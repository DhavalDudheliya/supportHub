/**
 * BullMQ Queues — Email Processing & AI Classification
 *
 * Two named queues:
 * 1. email-processing — Inbound email notifications (webhook → ticket creation)
 * 2. ai-classification — AI tagging & assignment (runs after ticket creation)
 *
 * Keeping them separate means email ingestion is never blocked by Gemini latency,
 * and AI jobs can have independent retry/rate-limit settings.
 */

import { Queue } from "bullmq";
import redis from "./redis.js";

// ── Email Processing Queue ─────────────────────────────────────────

/** Job data shape for the email processing queue */
export interface EmailJobData {
  provider: "GMAIL" | "OUTLOOK";
  /** The email address of the connected account */
  accountEmail: string;
  /** Gmail: historyId from Pub/Sub notification */
  historyId?: string;
  /** Outlook: messageId from Graph notification */
  messageId?: string;
  /** The workspace ID that owns this email account */
  workspaceId: string;
}

export const emailQueue = new Queue<EmailJobData>("email-processing", {
  connection: redis,
  defaultJobOptions: {
    removeOnComplete: { count: 1000 }, // Keep last 1000 completed jobs
    removeOnFail: { count: 5000 }, // Keep last 5000 failed jobs for debugging
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 5000, // 5s, 10s, 20s
    },
  },
});

/**
 * Enqueue an inbound email notification for async processing.
 */
export async function enqueueEmailJob(data: EmailJobData): Promise<void> {
  await emailQueue.add("process-email", data, {
    // Deduplicate by account + historyId/messageId to avoid double processing
    jobId: `${data.provider}-${data.accountEmail}-${data.historyId || data.messageId}`,
  });
}

// ── AI Classification Queue ────────────────────────────────────────

/** Job data shape for the AI classification queue */
export interface AIClassificationJobData {
  /** The ID of the email account to fetch the email from */
  emailAccountId: string;
  /** The ID of the ticket to classify */
  ticketId: string;
  /** The subject of the email */
  subject: string;
  /** The plain text body of the email */
  bodyPlain: string;
  /** The workspace ID that owns this email account */
  workspaceId: string;
}

export const aiClassificationQueue = new Queue<AIClassificationJobData>(
  "ai-classification",
  {
    connection: redis,
    defaultJobOptions: {
      removeOnComplete: { count: 1000 },
      removeOnFail: { count: 5000 },
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 3000, // 3s, 6s, 12s
      },
    },
  },
);

/**
 * Enqueue a ticket for AI classification (tagging + assignment).
 * Called by the email processor after a new ticket is created.
 */
export async function enqueueAIClassificationJob(
  data: AIClassificationJobData,
): Promise<void> {
  await aiClassificationQueue.add("classify-ticket", data, {
    jobId: `classify-${data.ticketId}`, // Deduplicate by ticket ID
  });
}
