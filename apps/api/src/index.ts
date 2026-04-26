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
import { initSocketIO } from "./lib/socket.js";
import { startEmailWorker } from "./workers/email.worker.js";
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

// --- Start Background Workers ---
startEmailWorker();

// --- Start Cron Jobs ---
startRenewalCron();

// --- Unhandled Rejection & Uncaught Exception Handlers ---
process.on("unhandledRejection", (reason: unknown) => {
  logger.fatal({ err: reason }, "Unhandled Promise Rejection");
});

process.on("uncaughtException", (err: Error) => {
  logger.fatal({ err }, "Uncaught Exception — shutting down");
  process.exit(1);
});

// --- Start Server ---
server.listen(PORT, () => {
  logger.info(`Server is running on http://localhost:${PORT}`);
});
