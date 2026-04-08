/**
 * 404 Not Found Middleware
 *
 * Catch-all handler for requests that don't match any defined route.
 * Must be registered AFTER all route definitions but BEFORE the
 * global error handler.
 *
 * Returns a structured JSON response consistent with the error format
 * used throughout the API.
 */

import { Request, Response } from "express";

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    status: "error",
    code: "NOT_FOUND",
    message: `Route not found: ${req.method} ${req.originalUrl}`,
    requestId: req.requestId,
  });
}
