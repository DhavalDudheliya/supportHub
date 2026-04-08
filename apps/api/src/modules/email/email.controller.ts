/**
 * Email Controller
 *
 * Handles HTTP requests for email account management:
 * - OAuth connect/callback flows for Gmail and Outlook
 * - Connection status retrieval
 * - Account disconnection
 *
 * OAuth callbacks intentionally keep manual try/catch because they must
 * redirect (not send JSON) on error. All other handlers rely on Express 5
 * auto-catch + global error middleware.
 */

import { Request, Response } from "express";
import prisma from "../../lib/prisma.js";
import { AuthenticatedRequest } from "../auth/auth.types.js";
import { AppError } from "../../errors/index.js";
import {
  getGmailAuthUrl,
  exchangeGmailCode,
  registerGmailWatch,
  stopGmailWatch,
} from "./gmail.service.js";
import {
  getOutlookAuthUrl,
  exchangeOutlookCode,
  createOutlookSubscription,
  deleteOutlookSubscription,
} from "./outlook.service.js";
import {
  storeEmailAccount,
  getConnectionStatus,
  disconnectEmailAccount,
  getEmailAccountWithFreshTokens,
} from "./email.service.js";
import logger from "../../lib/logger.js";

/**
 * GET /gmail/connect
 * Redirects the user to Google's OAuth consent screen.
 */
export async function connectGmail(req: Request, res: Response): Promise<void> {
  const { workspaceId } = (req as AuthenticatedRequest).user!;
  const authUrl = getGmailAuthUrl(workspaceId);
  res.json({ url: authUrl });
}

/**
 * GET /gmail/callback
 * Handles the OAuth callback from Google.
 * Exchanges the code for tokens, stores them, and registers a Gmail Watch.
 *
 * NOTE: This handler keeps manual try/catch because it must redirect
 * on both success and failure (not send JSON error responses).
 */
export async function gmailCallback(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const { code, state: workspaceId } = req.query as {
      code: string;
      state: string;
    };

    if (!code || !workspaceId) {
      res.status(400).json({ error: "Missing code or state parameter" });
      return;
    }

    // Exchange authorization code for tokens
    const tokens = await exchangeGmailCode(code);

    // Register Gmail Watch for real-time notifications
    const watch = await registerGmailWatch(
      tokens.accessToken,
      tokens.refreshToken,
    );

    // Store encrypted tokens and watch info
    await storeEmailAccount({
      provider: "GMAIL",
      email: tokens.email,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresAt: tokens.expiresAt,
      workspaceId,
      watchExpiry: watch.expiration,
      historyId: watch.historyId,
    });

    logger.info(
      { email: tokens.email, workspaceId },
      "Gmail account connected successfully",
    );

    // Lookup workspace to get the subdomain
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: { subdomain: true },
    });

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    let redirectUrl = `${frontendUrl}/settings/email?connected=gmail`;

    if (workspace && workspace.subdomain) {
      try {
        const url = new URL(frontendUrl);
        url.hostname = `${workspace.subdomain}.${url.hostname}`;
        redirectUrl = `${url.origin}/settings/email?connected=gmail`;
      } catch (e) {
        // Fallback to original
      }
    }

    res.redirect(redirectUrl);
  } catch (err) {
    logger.error({ err }, "Gmail OAuth callback failed");

    // In error case, try to parse workspaceId from state safely
    const workspaceId =
      typeof req.query.state === "string" ? req.query.state : undefined;
    let redirectUrl = `${process.env.FRONTEND_URL || "http://localhost:3000"}/settings/email?error=gmail_connection_failed`;

    if (workspaceId) {
      try {
        const workspace = await prisma.workspace.findUnique({
          where: { id: workspaceId },
          select: { subdomain: true },
        });
        if (workspace?.subdomain) {
          const url = new URL(
            process.env.FRONTEND_URL || "http://localhost:3000",
          );
          url.hostname = `${workspace.subdomain}.${url.hostname}`;
          redirectUrl = `${url.origin}/settings/email?error=gmail_connection_failed`;
        }
      } catch (e) {}
    }

    res.redirect(redirectUrl);
  }
}

/**
 * GET /outlook/connect
 * Redirects the user to Microsoft's OAuth consent screen.
 */
export async function connectOutlook(
  req: Request,
  res: Response,
): Promise<void> {
  const { workspaceId } = (req as AuthenticatedRequest).user!;
  const authUrl = await getOutlookAuthUrl(workspaceId);
  res.json({ url: authUrl });
}

/**
 * GET /outlook/callback
 * Handles the OAuth callback from Microsoft.
 *
 * NOTE: This handler keeps manual try/catch because it must redirect
 * on both success and failure (not send JSON error responses).
 */
export async function outlookCallback(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const { code, state: workspaceId } = req.query as {
      code: string;
      state: string;
    };

    if (!code || !workspaceId) {
      res.status(400).json({ error: "Missing code or state parameter" });
      return;
    }

    // Exchange authorization code for tokens
    const tokens = await exchangeOutlookCode(code);

    // Create Graph webhook subscription
    const subscription = await createOutlookSubscription(tokens.accessToken);

    // Store encrypted tokens and subscription info
    await storeEmailAccount({
      provider: "OUTLOOK",
      email: tokens.email,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresAt: tokens.expiresAt,
      workspaceId,
      watchExpiry: subscription.expiry,
      watchResourceId: subscription.subscriptionId,
    });

    logger.info(
      { email: tokens.email, workspaceId },
      "Outlook account connected successfully",
    );

    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: { subdomain: true },
    });

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    let redirectUrl = `${frontendUrl}/settings/email?connected=outlook`;

    if (workspace && workspace.subdomain) {
      try {
        const url = new URL(frontendUrl);
        url.hostname = `${workspace.subdomain}.${url.hostname}`;
        redirectUrl = `${url.origin}/settings/email?connected=outlook`;
      } catch (e) {
        // Fallback to original
      }
    }

    res.redirect(redirectUrl);
  } catch (err) {
    logger.error({ err }, "Outlook OAuth callback failed");

    // In error case, try to parse workspaceId from state safely
    const workspaceId =
      typeof req.query.state === "string" ? req.query.state : undefined;
    let redirectUrl = `${process.env.FRONTEND_URL || "http://localhost:3000"}/settings/email?error=outlook_connection_failed`;

    if (workspaceId) {
      try {
        const workspace = await prisma.workspace.findUnique({
          where: { id: workspaceId },
          select: { subdomain: true },
        });
        if (workspace?.subdomain) {
          const url = new URL(
            process.env.FRONTEND_URL || "http://localhost:3000",
          );
          url.hostname = `${workspace.subdomain}.${url.hostname}`;
          redirectUrl = `${url.origin}/settings/email?error=outlook_connection_failed`;
        }
      } catch (e) {}
    }

    res.redirect(redirectUrl);
  }
}

/**
 * GET /status
 * Returns the connection status of email accounts for the current workspace.
 */
export async function getStatus(req: Request, res: Response): Promise<void> {
  const { workspaceId } = (req as AuthenticatedRequest).user!;
  const status = await getConnectionStatus(workspaceId);
  res.json(status);
}

/**
 * POST /disconnect/:provider
 * Disconnects an email account (stops watch/subscription and deactivates).
 */
export async function disconnect(req: Request, res: Response): Promise<void> {
  const { workspaceId } = (req as AuthenticatedRequest).user!;
  const provider = (req.params.provider as string)?.toUpperCase() as
    | "GMAIL"
    | "OUTLOOK";

  if (provider !== "GMAIL" && provider !== "OUTLOOK") {
    throw AppError.badRequest("Invalid provider. Use gmail or outlook");
  }

  // Try to stop the watch/subscription before deactivating
  try {
    const account = await getEmailAccountWithFreshTokens(workspaceId, provider);
    if (account) {
      if (provider === "GMAIL") {
        await stopGmailWatch(account.accessToken, account.refreshToken);
      } else if (account.watchResourceId) {
        await deleteOutlookSubscription(
          account.accessToken,
          account.watchResourceId,
        );
      }
    }
  } catch (cleanupErr) {
    // Log but don't fail — we still want to deactivate the account locally
    logger.warn(
      { err: cleanupErr, provider },
      "Failed to clean up watch/subscription during disconnect",
    );
  }

  await disconnectEmailAccount(workspaceId, provider);

  logger.info({ workspaceId, provider }, "Email account disconnected");
  res.json({ message: `${provider} account disconnected successfully` });
}
