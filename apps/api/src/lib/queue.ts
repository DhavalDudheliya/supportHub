/**
 * BullMQ Queue — Email Processing
 *
 * Creates a named queue for processing inbound email notifications.
 * Jobs are enqueued by webhook handlers and consumed by the email worker.
 */

import { Queue } from "bullmq";
import redis from "./redis.js";

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
    jobId: `${data.provider}:${data.accountEmail}:${data.historyId || data.messageId}`,
  });
}
