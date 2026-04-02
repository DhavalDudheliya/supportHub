/**
 * Webhook Controller
 *
 * Handles inbound push notifications from:
 * - Google Pub/Sub (Gmail new email notifications)
 * - Microsoft Graph (Outlook new email notifications)
 *
 * Both handlers follow the same pattern:
 * 1. Immediately respond (200/202) to prevent retry storms
 * 2. Enqueue a BullMQ job for async processing
 */

import { Request, Response } from "express";
import { enqueueEmailJob } from "../../lib/queue.js";
import { findWorkspaceByEmail } from "./email.service.js";
import prisma from "../../lib/prisma.js";
import logger from "../../lib/logger.js";

/**
 * POST /webhook/gmail
 * Receives Google Pub/Sub push notifications.
 *
 * Pub/Sub message format:
 * {
 *   message: {
 *     data: "<base64-encoded JSON>",
 *     messageId: "...",
 *     publishTime: "..."
 *   },
 *   subscription: "..."
 * }
 *
 * Decoded data:
 * { emailAddress: "user@gmail.com", historyId: "12345" }
 */
export async function handleGmailWebhook(
  req: Request,
  res: Response,
): Promise<void> {
  // Immediately acknowledge — Google retries aggressively if we're slow
  res.status(200).send();

  try {
    const message = req.body?.message;
    if (!message?.data) {
      logger.warn("Gmail webhook received without message data");
      return;
    }

    // Decode the Base64 Pub/Sub payload
    const decoded = JSON.parse(
      Buffer.from(message.data, "base64").toString("utf8"),
    );

    const { emailAddress, historyId } = decoded;

    if (!emailAddress || !historyId) {
      logger.warn(
        { decoded },
        "Gmail webhook missing emailAddress or historyId",
      );
      return;
    }

    // Look up which workspace owns this email
    const workspaceId = await findWorkspaceByEmail(emailAddress, "GMAIL");
    if (!workspaceId) {
      logger.warn(
        { emailAddress },
        "Gmail webhook for unknown email — ignoring",
      );
      return;
    }

    // Enqueue for async processing
    await enqueueEmailJob({
      provider: "GMAIL",
      accountEmail: emailAddress,
      historyId,
      workspaceId,
    });

    logger.info(
      { emailAddress, historyId, workspaceId },
      "Gmail webhook processed — job enqueued",
    );
  } catch (err) {
    // Don't re-throw — we already sent 200. Just log the error.
    logger.error({ err }, "Error processing Gmail webhook");
  }
}

/**
 * POST /webhook/outlook
 * Receives Microsoft Graph change notifications.
 *
 * Notification format:
 * {
 *   value: [{
 *     subscriptionId: "...",
 *     clientState: "...",
 *     changeType: "created",
 *     resource: "Users/.../Messages/...",
 *     resourceData: { id: "message-id", ... }
 *   }]
 * }
 */
export async function handleOutlookWebhook(
  req: Request,
  res: Response,
): Promise<void> {
  // --- Subscription validation (initial handshake) ---
  // When creating a subscription, Microsoft sends a validation request
  // with a validationToken query parameter that we must echo back.
  const validationToken = req.query.validationToken as string | undefined;
  if (validationToken) {
    res.set("Content-Type", "text/plain");
    res.status(200).send(validationToken);
    return;
  }

  // Immediately acknowledge — Microsoft expects 202
  res.status(202).send();

  try {
    const notifications = req.body?.value;
    if (!Array.isArray(notifications) || notifications.length === 0) {
      logger.warn("Outlook webhook received without notification data");
      return;
    }

    for (const notification of notifications) {
      // Verify clientState matches our app ID
      if (notification.clientState !== process.env.MICROSOFT_CLIENT_ID) {
        logger.warn(
          { clientState: notification.clientState },
          "Outlook webhook clientState mismatch — ignoring",
        );
        continue;
      }

      // Extract the message ID from the resource path
      // Resource format: "Users/{user-id}/Messages/{message-id}"
      const resourceParts = (notification.resource || "").split("/");
      const messageId =
        notification.resourceData?.id ||
        resourceParts[resourceParts.length - 1];

      if (!messageId) {
        logger.warn({ notification }, "Outlook webhook missing message ID");
        continue;
      }

      // Find workspace by subscription — look up all active Outlook accounts
      // and match by subscriptionId

      const account = await prisma.emailAccount.findFirst({
        where: {
          provider: "OUTLOOK",
          watchResourceId: notification.subscriptionId,
          isActive: true,
        },
        select: { workspaceId: true, email: true },
      });

      if (!account) {
        logger.warn(
          { subscriptionId: notification.subscriptionId },
          "Outlook webhook for unknown subscription — ignoring",
        );
        continue;
      }

      await enqueueEmailJob({
        provider: "OUTLOOK",
        accountEmail: account.email,
        messageId,
        workspaceId: account.workspaceId,
      });

      logger.info(
        { email: account.email, messageId, workspaceId: account.workspaceId },
        "Outlook webhook processed — job enqueued",
      );
    }
  } catch (err) {
    logger.error({ err }, "Error processing Outlook webhook");
  }
}
