/**
 * Email Worker — BullMQ Background Processor
 *
 * Consumes jobs from the "email-processing" queue.
 * Each job represents a notification from Gmail or Outlook that
 * new email has arrived in a connected mailbox.
 *
 * The worker:
 * 1. Retrieves the email account credentials (with auto token refresh)
 * 2. Fetches the new email content from Gmail/Outlook API
 * 3. Runs each email through the processing pipeline
 */

import { Worker, Job } from "bullmq";
import redis from "../lib/redis.js";
import type { EmailJobData } from "../lib/queue.js";
import {
  getEmailAccountWithFreshTokens,
  updateHistoryId,
} from "../modules/email/email.service.js";
import {
  fetchNewMessageIds,
  fetchGmailMessage,
} from "../modules/email/gmail.service.js";
import {
  fetchOutlookMessage,
  fetchRecentInboxMessageIds,
} from "../modules/email/outlook.service.js";
import { processInboundEmail } from "../modules/email/email-processor.js";
import logger from "../lib/logger.js";

let worker: Worker<EmailJobData> | null = null;

/**
 * Start the BullMQ worker that processes email jobs.
 * Should be called once during server startup.
 */
export function startEmailWorker(): void {
  worker = new Worker<EmailJobData>(
    "email-processing",
    async (job: Job<EmailJobData>) => {
      const { provider, accountEmail, workspaceId } = job.data;

      logger.info(
        { provider, accountEmail, workspaceId, jobId: job.id },
        "Processing email job",
      );

      try {
        if (provider === "GMAIL") {
          await processGmailJob(job.data);
        } else if (provider === "OUTLOOK") {
          await processOutlookJob(job.data);
        } else {
          logger.error({ provider }, "Unknown email provider in job");
        }
      } catch (err) {
        logger.error(
          { err, provider, accountEmail, workspaceId },
          "Failed to process email job",
        );
        throw err; // Re-throw to trigger BullMQ retry
      }
    },
    {
      connection: redis,
      concurrency: 5, // Process up to 5 jobs in parallel
      limiter: {
        max: 20,
        duration: 60000, // Max 20 jobs per minute per queue
      },
    },
  );

  worker.on("completed", (job) => {
    logger.info({ jobId: job?.id }, "Email job completed");
  });

  worker.on("failed", (job, err) => {
    logger.error(
      { jobId: job?.id, err: err.message, attempts: job?.attemptsMade },
      "Email job failed",
    );
  });

  logger.info("Email processing worker started");
}

/**
 * Process a Gmail notification job.
 *
 * Uses the History API to incrementally fetch only new messages
 * since the last known historyId.
 */
async function processGmailJob(data: EmailJobData): Promise<void> {
  const { workspaceId, historyId } = data;

  if (!historyId) {
    logger.warn({ workspaceId }, "Gmail job missing historyId — skipping");
    return;
  }

  // Get account with fresh tokens
  const account = await getEmailAccountWithFreshTokens(workspaceId, "GMAIL");
  if (!account) {
    logger.warn({ workspaceId }, "Gmail account not found or inactive");
    return;
  }

  // Use stored historyId to fetch only new messages
  const storedHistoryId = account.historyId || historyId;
  const { messageIds, latestHistoryId } = await fetchNewMessageIds(
    account.accessToken,
    account.refreshToken,
    storedHistoryId,
  );

  if (messageIds.length === 0) {
    logger.info({ workspaceId }, "No new Gmail messages since last check");
    // Still update historyId to avoid re-checking
    await updateHistoryId(workspaceId, latestHistoryId);
    return;
  }

  logger.info(
    { workspaceId, count: messageIds.length },
    "Fetching new Gmail messages",
  );

  // Fetch and process each new message
  for (const gmailMsgId of messageIds) {
    try {
      const parsed = await fetchGmailMessage(
        account.accessToken,
        account.refreshToken,
        gmailMsgId,
      );

      if (!parsed.messageId) {
        logger.warn(
          { gmailMsgId },
          "Gmail message has no Message-ID header — skipping",
        );
        continue;
      }

      await processInboundEmail({
        messageId: parsed.messageId,
        from: parsed.from,
        subject: parsed.subject,
        bodyPlain: parsed.bodyPlain,
        bodyHtml: parsed.bodyHtml,
        references: parsed.references,
        inReplyTo: parsed.inReplyTo,
        date: parsed.date,
        workspaceId,
      });
    } catch (err) {
      logger.error(
        { err, gmailMsgId, workspaceId },
        "Failed to process individual Gmail message",
      );
      // Continue processing other messages
    }
  }

  // Update historyId so we don't re-fetch these messages
  await updateHistoryId(workspaceId, latestHistoryId);
}

/**
 * Process an Outlook notification job.
 *
 * Fetches the specific message referenced in the notification,
 * or falls back to recent inbox messages if no messageId was provided.
 */
async function processOutlookJob(data: EmailJobData): Promise<void> {
  const { workspaceId, messageId } = data;

  // Get account with fresh tokens
  const account = await getEmailAccountWithFreshTokens(workspaceId, "OUTLOOK");
  if (!account) {
    logger.warn({ workspaceId }, "Outlook account not found or inactive");
    return;
  }

  // Determine which messages to fetch
  let messageIds: string[];

  if (messageId) {
    messageIds = [messageId];
  } else {
    // Fallback: fetch the most recent inbox messages
    logger.info(
      { workspaceId },
      "Outlook job has no messageId — fetching recent messages",
    );
    messageIds = await fetchRecentInboxMessageIds(account.accessToken, 3);
  }

  // Fetch and process each message
  for (const msgId of messageIds) {
    try {
      const parsed = await fetchOutlookMessage(account.accessToken, msgId);

      if (!parsed.messageId) {
        logger.warn(
          { outlookMsgId: msgId },
          "Outlook message has no Internet Message-ID — skipping",
        );
        continue;
      }

      await processInboundEmail({
        messageId: parsed.messageId,
        from: parsed.from,
        subject: parsed.subject,
        bodyPlain: parsed.bodyPlain,
        bodyHtml: parsed.bodyHtml,
        references: parsed.references,
        inReplyTo: parsed.inReplyTo,
        date: parsed.date,
        workspaceId,
      });
    } catch (err) {
      logger.error(
        { err, outlookMsgId: msgId, workspaceId },
        "Failed to process individual Outlook message",
      );
    }
  }
}

/**
 * Gracefully shut down the worker.
 */
export async function stopEmailWorker(): Promise<void> {
  if (worker) {
    await worker.close();
    logger.info("Email processing worker stopped");
  }
}
