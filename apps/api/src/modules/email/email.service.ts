/**
 * Email Account Service
 *
 * CRUD operations for connected email accounts (EmailAccount model).
 * Handles encryption/decryption of OAuth tokens and token refresh logic.
 *
 * NOTE: This is distinct from services/email.service.ts which handles
 * outbound SMTP emails (verification, notifications, etc.).
 */

import prisma from "../../lib/prisma.js";
import { encrypt, decrypt } from "../../utils/encryption.js";
import { refreshGmailToken } from "./gmail.service.js";
import { refreshOutlookToken } from "./outlook.service.js";
import logger from "../../lib/logger.js";

type Provider = "GMAIL" | "OUTLOOK";

interface StoreAccountInput {
  provider: Provider;
  email: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  workspaceId: string;
  watchExpiry?: Date;
  watchResourceId?: string;
  historyId?: string;
}

/**
 * Store or update an email account with encrypted tokens.
 * Uses upsert to handle both initial connection and reconnection.
 */
export async function storeEmailAccount(input: StoreAccountInput) {
  const {
    provider,
    email,
    accessToken,
    refreshToken,
    expiresAt,
    workspaceId,
    watchExpiry,
    watchResourceId,
    historyId,
  } = input;

  return prisma.emailAccount.upsert({
    where: { provider_workspaceId: { provider, workspaceId } },
    update: {
      email,
      accessTokenEnc: encrypt(accessToken),
      refreshTokenEnc: encrypt(refreshToken),
      tokenExpiresAt: expiresAt,
      watchExpiry,
      watchResourceId,
      historyId,
      isActive: true,
    },
    create: {
      provider,
      email,
      accessTokenEnc: encrypt(accessToken),
      refreshTokenEnc: encrypt(refreshToken),
      tokenExpiresAt: expiresAt,
      watchExpiry,
      watchResourceId,
      historyId,
      workspaceId,
    },
  });
}

/**
 * Retrieve an email account and decrypt its tokens.
 * Automatically refreshes the access token if it's expired or about to expire.
 */
export async function getEmailAccountWithFreshTokens(
  workspaceId: string,
  provider: Provider,
): Promise<{
  id: string;
  email: string;
  accessToken: string;
  refreshToken: string;
  historyId: string | null;
  watchExpiry: Date | null;
  watchResourceId: string | null;
} | null> {
  const account = await prisma.emailAccount.findUnique({
    where: { provider_workspaceId: { provider, workspaceId } },
  });

  if (!account || !account.isActive) return null;

  let accessToken = decrypt(account.accessTokenEnc);
  const refreshToken = decrypt(account.refreshTokenEnc);

  // Check if token is expired or will expire within 5 minutes
  const isExpired =
    account.tokenExpiresAt &&
    account.tokenExpiresAt.getTime() < Date.now() + 5 * 60 * 1000;

  if (isExpired) {
    logger.info({ provider, workspaceId }, "Access token expired — refreshing");

    try {
      if (provider === "GMAIL") {
        const fresh = await refreshGmailToken(refreshToken);
        accessToken = fresh.accessToken;

        await prisma.emailAccount.update({
          where: { id: account.id },
          data: {
            accessTokenEnc: encrypt(fresh.accessToken),
            tokenExpiresAt: fresh.expiresAt,
          },
        });
      } else {
        const fresh = await refreshOutlookToken(refreshToken);
        accessToken = fresh.accessToken;

        await prisma.emailAccount.update({
          where: { id: account.id },
          data: {
            accessTokenEnc: encrypt(fresh.accessToken),
            refreshTokenEnc: encrypt(fresh.refreshToken),
            tokenExpiresAt: fresh.expiresAt,
          },
        });
      }
    } catch (err) {
      logger.error({ err, provider, workspaceId }, "Failed to refresh token");
      throw err;
    }
  }

  return {
    id: account.id,
    email: account.email,
    accessToken,
    refreshToken,
    historyId: account.historyId,
    watchExpiry: account.watchExpiry,
    watchResourceId: account.watchResourceId,
  };
}

/**
 * Get connection status for all email providers in a workspace.
 */
export async function getConnectionStatus(workspaceId: string) {
  const accounts = await prisma.emailAccount.findMany({
    where: { workspaceId, isActive: true },
    select: {
      provider: true,
      email: true,
      watchExpiry: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return {
    gmail: accounts.find((a) => a.provider === "GMAIL") || null,
    outlook: accounts.find((a) => a.provider === "OUTLOOK") || null,
  };
}

/**
 * Disconnect an email account (soft delete — marks as inactive).
 */
export async function disconnectEmailAccount(
  workspaceId: string,
  provider: Provider,
): Promise<void> {
  const account = await prisma.emailAccount.findUnique({
    where: { provider_workspaceId: { provider, workspaceId } },
  });

  if (!account) return;

  await prisma.emailAccount.update({
    where: { id: account.id },
    data: { isActive: false },
  });
}

/**
 * Look up which workspace owns a given email address (for webhook routing).
 */
export async function findWorkspaceByEmail(
  email: string,
  provider: Provider,
): Promise<string | null> {
  const account = await prisma.emailAccount.findFirst({
    where: { email, provider, isActive: true },
    select: { workspaceId: true },
  });
  return account?.workspaceId || null;
}

/**
 * Update the historyId for a Gmail account (after processing notifications).
 */
export async function updateHistoryId(
  workspaceId: string,
  historyId: string,
): Promise<void> {
  await prisma.emailAccount.update({
    where: {
      provider_workspaceId: { provider: "GMAIL", workspaceId },
    },
    data: { historyId },
  });
}

/**
 * Update watch/subscription expiry after renewal.
 */
export async function updateWatchExpiry(
  workspaceId: string,
  provider: Provider,
  watchExpiry: Date,
  watchResourceId?: string,
): Promise<void> {
  const data: any = { watchExpiry };
  if (watchResourceId) data.watchResourceId = watchResourceId;

  await prisma.emailAccount.update({
    where: { provider_workspaceId: { provider, workspaceId } },
    data,
  });
}
