/**
 * SupportHub API — Entry Point
 *
 * Initializes the Express application with:
 * - Request ID assignment for end-to-end tracing
 * - CORS middleware for cross-origin requests
 * - JSON and URL-encoded body parsing
 * - Lightweight API request logging via Pino
 * - Health check endpoints (/ and /api/health)
 * - All feature module routes via centralized routes.ts (/api/*)
 * - 404 catch-all for undefined routes
 * - Global error handling middleware (AppError, ZodError, Prisma errors)
 * - Socket.IO for real-time WebSocket communication
 * - BullMQ email worker for background email processing
 * - Cron jobs for Gmail watch / Outlook subscription renewal
 * - Graceful handling of unhandled rejections and uncaught exceptions
 *
 * Environment variables:
 * - PORT: Server port (default: 5000)
 */

import http from "http";
import express, { Express, Request, Response, NextFunction } from "express";
import cors from "cors";
import "dotenv/config"; // Load .env variables into process.env

import logger, { colors, statusColor } from "./lib/logger.js";
import routes from "./routes.js";
import redis from "./lib/redis.js";
import prisma from "./lib/prisma.js";
import { initSocketIO, closeSocketRedis } from "./lib/socket.js";
import { startEmailWorker, stopEmailWorker } from "./workers/email.worker.js";
import {
  startAIClassificationWorker,
  stopAIClassificationWorker,
} from "./workers/ai-classification.worker.js";
import { startRenewalCron } from "./cron/renewal.cron.js";
import { requestIdMiddleware } from "./middlewares/request-id.middleware.js";
import { notFoundHandler } from "./middlewares/not-found.middleware.js";
import { globalErrorHandler } from "./errors/index.js";

const app: Express = express();
const PORT = process.env.PORT || 5000;

// Create HTTP server (needed for Socket.IO attachment)
const server = http.createServer(app);

// --- Global Middleware ---
app.use(requestIdMiddleware); // Assign unique request ID (must be first)
app.use(cors()); // Enable CORS for all origins
app.use(express.json()); // Parse JSON request bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// --- API Request Logger (color-coded in dev) ---
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on("finish", () => {
    const ms = Date.now() - start;
    logger.info(
      `${colors.cyan}${req.method}${colors.reset} ${colors.white}${req.originalUrl}${colors.reset} ${statusColor(res.statusCode)}${res.statusCode}${colors.reset} ${colors.gray}${ms}ms${colors.reset}`,
    );
  });
  next();
});

// --- Health Check Routes ---
app.get("/", (_req: Request, res: Response) => {
  res.json({ message: "SupportHub API is running" });
});

app.get("/api/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// --- All Feature Module Routes (centralized in routes.ts) ---
app.use("/api", routes);

// --- 404 Catch-All (must be after all routes) ---
app.use(notFoundHandler);

// --- Global Error Handler (must be the LAST middleware) ---
app.use(globalErrorHandler);

// --- Initialize Socket.IO ---
initSocketIO(server);

// --- Start Background Workers & Cron (optional) ---
// By default the API runs the background workers in-process — this keeps
// `pnpm dev` and a single-box prod deploy as one process (backward compatible).
// In a scaled topology (Compose/K8s) set RUN_BACKGROUND_WORKERS=false on the API
// replicas and run `worker.ts` as a separate process so work isn't duplicated.
const runWorkersInApi = process.env.RUN_BACKGROUND_WORKERS !== "false";

if (runWorkersInApi) {
  startEmailWorker();
  startAIClassificationWorker();
  startRenewalCron();
  logger.info("Background workers + renewal cron started in-process (API)");
} else {
  logger.info(
    "RUN_BACKGROUND_WORKERS=false — workers/cron run in a separate worker process",
  );
}

// --- Unhandled Rejection & Uncaught Exception Handlers ---
process.on("unhandledRejection", (reason: unknown) => {
  logger.fatal({ err: reason }, "Unhandled Promise Rejection");
});

process.on("uncaughtException", (err: Error) => {
  logger.fatal({ err }, "Uncaught Exception — shutting down");
  process.exit(1);
});

// --- Graceful Shutdown ---
// Stop accepting new connections, drain in-flight workers (if running here),
// then disconnect Redis/Prisma so rolling deploys don't drop in-flight work.
let shuttingDown = false;

async function shutdown(signal: string): Promise<void> {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info({ signal }, "API shutting down gracefully");

  try {
    // Stop accepting new connections and wait for in-flight requests to drain
    // before tearing down Redis/Prisma underneath them.
    await new Promise<void>((resolve) => {
      server.close((err) => {
        if (err) logger.error({ err }, "Error closing HTTP server");
        else logger.info("HTTP server closed");
        resolve();
      });
    });

    if (runWorkersInApi) {
      await Promise.allSettled([
        stopEmailWorker(),
        stopAIClassificationWorker(),
      ]);
    }
    // Close the Socket.IO adapter/emitter pub-sub connections, then the main one.
    await closeSocketRedis();
    await Promise.allSettled([redis.quit(), prisma.$disconnect()]);
    logger.info("API shutdown complete");
    process.exit(0);
  } catch (err) {
    logger.error({ err }, "Error during API shutdown");
    process.exit(1);
  }
}

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));

// --- Start Server ---
server.listen(PORT, () => {
  logger.info(`Server is running on http://localhost:${PORT}`);
});
