/**
 * Global Error Handler Middleware
 *
 * The last middleware in the Express pipeline. Catches ALL errors that
 * propagate via next(error) or from rejected async handlers (Express 5).
 *
 * Handles:
 * - AppError     → structured JSON with correct status code
 * - ZodError     → 400 with field-level validation details
 * - Prisma errors → maps known error codes to appropriate HTTP statuses
 * - Unknown errors → sanitized 500 (no internal details leaked in production)
 *
 * Every error response includes the request ID for log correlation.
 */

import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { AppError } from "./app-error.js";
import logger from "../lib/logger.js";

const isDev = process.env.NODE_ENV !== "production";

/** Standardized error response shape */
interface ErrorResponse {
  status: "error";
  code: string;
  message: string;
  details?: Record<string, unknown>[];
  requestId?: string;
  stack?: string;
}

/**
 * Express error-handling middleware (4-argument signature).
 * Must be registered AFTER all routes.
 */
export function globalErrorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const requestId = req.requestId;

  // ── AppError (our own structured errors) ──────────────────────────
  if (err instanceof AppError) {
    const level = err.statusCode >= 500 ? "error" : "warn";
    logger[level](
      { err, requestId, statusCode: err.statusCode, code: err.code },
      err.message,
    );

    const body: ErrorResponse = {
      status: "error",
      code: err.code,
      message: err.message,
      requestId,
    };

    if (err.details) body.details = err.details;
    if (isDev && err.stack) body.stack = err.stack;

    res.status(err.statusCode).json(body);
    return;
  }

  // ── Zod Validation Errors ─────────────────────────────────────────
  if (err instanceof ZodError) {
    const details = err.issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
    }));

    logger.warn({ requestId, issues: details }, "Validation error");

    const body: ErrorResponse = {
      status: "error",
      code: "VALIDATION_ERROR",
      message: "Validation failed",
      details,
      requestId,
    };

    if (isDev && err.stack) body.stack = err.stack;

    res.status(400).json(body);
    return;
  }

  // ── Prisma Known Request Errors ───────────────────────────────────
  if (isPrismaClientKnownRequestError(err)) {
    const { statusCode, code, message } = mapPrismaError(err);

    logger.warn({ requestId, prismaCode: err.code, meta: err.meta }, message);

    const body: ErrorResponse = {
      status: "error",
      code,
      message,
      requestId,
    };

    if (isDev && err.stack) body.stack = err.stack;

    res.status(statusCode).json(body);
    return;
  }

  // ── Unknown / Unexpected Errors ───────────────────────────────────
  logger.error(
    { err, requestId },
    `Unhandled error: ${err.message || "Unknown error"}`,
  );

  const body: ErrorResponse = {
    status: "error",
    code: "INTERNAL_ERROR",
    message: isDev
      ? err.message || "Internal server error"
      : "Internal server error",
    requestId,
  };

  if (isDev && err.stack) body.stack = err.stack;

  res.status(500).json(body);
}

// ── Prisma Error Helpers ──────────────────────────────────────────────

/**
 * Type guard for Prisma's PrismaClientKnownRequestError.
 * We use duck-typing to avoid importing the Prisma client in this module.
 */
function isPrismaClientKnownRequestError(err: unknown): err is {
  code: string;
  meta?: Record<string, unknown>;
  message: string;
  stack?: string;
} {
  if (typeof err !== "object" || err === null || !("code" in err)) {
    return false;
  }
  const code = (err as Record<string, unknown>).code;
  return typeof code === "string" && code.startsWith("P");
}

/** Map Prisma error codes to HTTP-appropriate responses */
function mapPrismaError(err: {
  code: string;
  meta?: Record<string, unknown>;
}): { statusCode: number; code: string; message: string } {
  switch (err.code) {
    case "P2002": {
      // Unique constraint violation
      const target = err.meta?.target;
      const fields = Array.isArray(target) ? target.join(", ") : "field";
      return {
        statusCode: 409,
        code: "CONFLICT",
        message: `A record with this ${fields} already exists`,
      };
    }
    case "P2025":
      // Record not found
      return {
        statusCode: 404,
        code: "NOT_FOUND",
        message: "The requested record was not found",
      };
    case "P2003":
      // Foreign key constraint failure
      return {
        statusCode: 400,
        code: "BAD_REQUEST",
        message: "Referenced record does not exist",
      };
    case "P2014":
      // Required relation violation
      return {
        statusCode: 400,
        code: "BAD_REQUEST",
        message: "The change would violate a required relation",
      };
    default:
      return {
        statusCode: 500,
        code: "INTERNAL_ERROR",
        message: "A database error occurred",
      };
  }
}
