/**
 * Renewal Cron Job
 *
 * Periodically renews Gmail Watches and Outlook Subscriptions
 * to ensure the notification pipeline never breaks.
 *
 * Schedule: Every 6 hours
 *
 * Gmail Watch:  Expires after 7 days — we renew when < 48h remain
 * Outlook Sub:  Expires after 2 days — we renew when < 12h remain
 *
 * Also proactively refreshes access tokens that are about to expire.
 */

import cron from "node-cron";
import prisma from "../lib/prisma.js";
import { decrypt, encrypt } from "../utils/encryption.js";
import {
  registerGmailWatch,
  refreshGmailToken,
} from "../modules/email/gmail.service.js";
import {
  renewOutlookSubscription,
  refreshOutlookToken,
} from "../modules/email/outlook.service.js";
import { updateWatchExpiry } from "../modules/email/email.service.js";
import logger from "../lib/logger.js";

/**
 * Start the renewal cron job.
 * Runs every 6 hours: at 00:00, 06:00, 12:00, 18:00.
 */
export function startRenewalCron(): void {
  // Run every 6 hours
  cron.schedule("0 */6 * * *", async () => {
    logger.info("Running watch/subscription renewal cron job");

    try {
      await renewGmailWatches();
    } catch (err) {
      logger.error({ err }, "Gmail watch renewal failed");
    }

    try {
      await renewOutlookSubscriptions();
    } catch (err) {
      logger.error({ err }, "Outlook subscription renewal failed");
    }

    try {
      await refreshExpiringTokens();
    } catch (err) {
      logger.error({ err }, "Token refresh failed");
    }

    logger.info("Watch/subscription renewal cron job completed");
  });

  logger.info("Renewal cron job scheduled (every 6 hours)");
}

/**
 * Renew Gmail Watches that expire within the next 48 hours.
 */
async function renewGmailWatches(): Promise<void> {
  const threshold = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours from now

  const accounts = await prisma.emailAccount.findMany({
    where: {
      provider: "GMAIL",
      isActive: true,
      watchExpiry: { lt: threshold },
    },
  });

  if (accounts.length === 0) {
    logger.info("No Gmail watches need renewal");
    return;
  }

  logger.info({ count: accounts.length }, "Renewing Gmail watches");

  for (const account of accounts) {
    try {
      const accessToken = decrypt(account.accessTokenEnc);
      const refreshToken = decrypt(account.refreshTokenEnc);

      const watch = await registerGmailWatch(accessToken, refreshToken);

      await updateWatchExpiry(account.workspaceId, "GMAIL", watch.expiration);

      // Also update the historyId if it changed
      await prisma.emailAccount.update({
        where: { id: account.id },
        data: { historyId: watch.historyId },
      });

      logger.info(
        {
          email: account.email,
          workspaceId: account.workspaceId,
          newExpiry: watch.expiration,
        },
        "Gmail watch renewed successfully",
      );
    } catch (err) {
      logger.error(
        { err, email: account.email, workspaceId: account.workspaceId },
        "Failed to renew Gmail watch for account",
      );
    }
  }
}

/**
 * Renew Outlook Subscriptions that expire within the next 12 hours.
 */
async function renewOutlookSubscriptions(): Promise<void> {
  const threshold = new Date(Date.now() + 12 * 60 * 60 * 1000); // 12 hours from now

  const accounts = await prisma.emailAccount.findMany({
    where: {
      provider: "OUTLOOK",
      isActive: true,
      watchExpiry: { lt: threshold },
    },
  });

  if (accounts.length === 0) {
    logger.info("No Outlook subscriptions need renewal");
    return;
  }

  logger.info({ count: accounts.length }, "Renewing Outlook subscriptions");

  for (const account of accounts) {
    try {
      if (!account.watchResourceId) {
        logger.warn(
          { email: account.email },
          "Outlook account has no subscriptionId — skipping renewal",
        );
        continue;
      }

      const accessToken = decrypt(account.accessTokenEnc);

      const newExpiry = await renewOutlookSubscription(
        accessToken,
        account.watchResourceId,
      );

      await updateWatchExpiry(account.workspaceId, "OUTLOOK", newExpiry);

      logger.info(
        {
          email: account.email,
          workspaceId: account.workspaceId,
          newExpiry,
        },
        "Outlook subscription renewed successfully",
      );
    } catch (err) {
      logger.error(
        { err, email: account.email, workspaceId: account.workspaceId },
        "Failed to renew Outlook subscription for account",
      );
    }
  }
}

/**
 * Proactively refresh access tokens expiring within the next 10 minutes.
 * This prevents API call failures during email processing.
 */
async function refreshExpiringTokens(): Promise<void> {
  const threshold = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

  const accounts = await prisma.emailAccount.findMany({
    where: {
      isActive: true,
      tokenExpiresAt: { lt: threshold },
    },
  });

  if (accounts.length === 0) return;

  logger.info({ count: accounts.length }, "Refreshing expiring access tokens");

  for (const account of accounts) {
    try {
      const refreshToken = decrypt(account.refreshTokenEnc);

      if (account.provider === "GMAIL") {
        const fresh = await refreshGmailToken(refreshToken);
        await prisma.emailAccount.update({
          where: { id: account.id },
          data: {
            accessTokenEnc: encrypt(fresh.accessToken),
            tokenExpiresAt: fresh.expiresAt,
          },
        });
      } else {
        const fresh = await refreshOutlookToken(refreshToken);
        await prisma.emailAccount.update({
          where: { id: account.id },
          data: {
            accessTokenEnc: encrypt(fresh.accessToken),
            refreshTokenEnc: encrypt(fresh.refreshToken),
            tokenExpiresAt: fresh.expiresAt,
          },
        });
      }

      logger.info(
        { provider: account.provider, email: account.email },
        "Access token refreshed proactively",
      );
    } catch (err) {
      logger.error(
        { err, provider: account.provider, email: account.email },
        "Failed to refresh access token proactively",
      );
    }
  }
}
