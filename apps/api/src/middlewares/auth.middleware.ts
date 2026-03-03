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
 * Responds with 401 if:
 * - No Authorization header is present
 * - The header doesn't follow "Bearer <token>" format
 * - The token is invalid or expired
 */

import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/jwt.js";
import { AuthenticatedRequest } from "../modules/auth/auth.types.js";

/**
 * JWT authentication guard.
 * Must be applied before any route handler that requires authentication.
 */
export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const authHeader = req.headers.authorization;

  // Check for the presence and format of the Authorization header
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Access token is required" });
    return;
  }

  // Extract the token (everything after "Bearer ")
  const token = authHeader.split(" ")[1];

  try {
    // Verify the token signature and expiry, then decode the payload
    const payload = verifyAccessToken(token);

    // Attach user info to the request for downstream handlers
    (req as AuthenticatedRequest).user = {
      userId: payload.userId,
      email: payload.email,
      domainId: payload.domainId,
      role: payload.role,
    };

    next(); // Token is valid — proceed to the route handler
  } catch {
    res.status(401).json({ error: "Invalid or expired access token" });
  }
}
