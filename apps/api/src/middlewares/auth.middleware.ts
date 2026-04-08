/**
 * Authentication Middleware
 *
 * Express middleware that protects routes by verifying JWT access tokens.
 * Extracts the token from the `Authorization: Bearer <token>` header,
 * verifies it, and attaches the decoded user payload to `req.user`.
 *
 * Usage in routes:
 * ```ts
 * router.get("/me", authMiddleware, meController);
 * ```
 *
 * Throws AppError.unauthorized() if:
 * - No Authorization header is present
 * - The header doesn't follow "Bearer <token>" format
 * - The token is invalid or expired
 * - The token payload is missing workspaceId
 */

import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/jwt.js";
import { AuthenticatedRequest } from "../modules/auth/auth.types.js";
import { AppError } from "../errors/index.js";

/**
 * JWT authentication guard.
 * Must be applied before any route handler that requires authentication.
 */
export function authMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const authHeader = req.headers.authorization;

  // Check for the presence and format of the Authorization header
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw AppError.unauthorized("Access token is required");
  }

  // Extract the token (everything after "Bearer ")
  const token = authHeader.split(" ")[1];

  try {
    // Verify the token signature and expiry, then decode the payload
    const payload = verifyAccessToken(token);

    // Verify that the token contains the required workspace context
    if (!payload.workspaceId) {
      throw AppError.unauthorized("Invalid token payload: workspaceId missing");
    }

    // Attach user info to the request for downstream handlers
    (req as AuthenticatedRequest).user = {
      userId: payload.userId,
      email: payload.email,
      workspaceId: payload.workspaceId,
      role: payload.role,
    };

    next(); // Token is valid — proceed to the route handler
  } catch (err) {
    // If it's already an AppError, re-throw it as-is
    if (err instanceof AppError) {
      throw err;
    }
    // JWT verification failure (expired, malformed, etc.)
    throw AppError.unauthorized("Invalid or expired access token");
  }
}
