/**
 * Request ID Middleware
 *
 * Assigns a unique identifier to every incoming request for end-to-end
 * traceability across logs, error responses, and downstream services.
 *
 * - Generates a UUID v4 via `crypto.randomUUID()`
 * - Attaches it to `req.requestId` for use in route handlers and error middleware
 * - Sets the `X-Request-Id` response header so clients can reference it
 * - If the client sends an `X-Request-Id` header, it's respected (pass-through)
 */

import { Request, Response, NextFunction } from "express";
import { randomUUID } from "crypto";

export function requestIdMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const id =
    (req.headers["x-request-id"] as string | undefined) || randomUUID();

  req.requestId = id;
  res.setHeader("X-Request-Id", id);

  next();
}
