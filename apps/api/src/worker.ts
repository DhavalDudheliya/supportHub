/**
 * SupportHub Worker — Background Processing Entry Point
 *
 * A headless companion to `index.ts` that runs ONLY the background work:
 *  - BullMQ email-processing worker
 *  - BullMQ AI-classification worker
 *  - the Gmail/Outlook renewal cron (leader-elected via Redis)
 *
 * It starts no HTTP server and no Socket.IO server. Worker-produced real-time
 * events still reach browsers: `emitTicketEvent` publishes them through the
 * Socket.IO Redis emitter, and the API replicas (which DO run Socket.IO with the
 * Redis adapter) fan them out to connected sockets.
 *
 * Run this as a separate, independently-scalable process (Compose/K8s) with the
 * API started using RUN_BACKGROUND_WORKERS=false so work isn't double-processed.
 * `pnpm dev` keeps everything in one process for local DX (see index.ts).
 */

import "dotenv/config";

import logger from "./lib/logger.js";
import redis from "./lib/redis.js";
import prisma from "./lib/prisma.js";
import { closeSocketRedis } from "./lib/socket.js";
import { startEmailWorker, stopEmailWorker } from "./workers/email.worker.js";
import {
  startAIClassificationWorker,
  stopAIClassificationWorker,
} from "./workers/ai-classification.worker.js";
import { startRenewalCron } from "./cron/renewal.cron.js";

startEmailWorker();
startAIClassificationWorker();
startRenewalCron();

logger.info(
  "Worker process started (email + AI classification + renewal cron)",
);

// --- Graceful Shutdown ---
// On SIGTERM/SIGINT: stop accepting new jobs, let in-flight jobs drain, then
// disconnect Redis and Prisma so a rolling deploy doesn't drop work mid-flight.
let shuttingDown = false;

async function shutdown(signal: string): Promise<void> {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info({ signal }, "Worker shutting down — draining in-flight jobs");

  try {
    await Promise.allSettled([stopEmailWorker(), stopAIClassificationWorker()]);
    // Close the Socket.IO emitter pub connection (if any event was emitted),
    // then the main Redis connection.
    await closeSocketRedis();
    await Promise.allSettled([redis.quit(), prisma.$disconnect()]);
    logger.info("Worker shutdown complete");
    process.exit(0);
  } catch (err) {
    logger.error({ err }, "Error during worker shutdown");
    process.exit(1);
  }
}

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));

// --- Unhandled Rejection & Uncaught Exception Handlers ---
process.on("unhandledRejection", (reason: unknown) => {
  logger.fatal({ err: reason }, "Unhandled Promise Rejection (worker)");
});

process.on("uncaughtException", (err: Error) => {
  logger.fatal({ err }, "Uncaught Exception (worker) — shutting down");
  process.exit(1);
});
