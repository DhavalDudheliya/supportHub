/**
 * Admin Role Guard Middleware
 *
 * Ensures the authenticated user has the ADMIN role.
 * Must be applied AFTER authMiddleware in the middleware chain.
 *
 * Usage:
 * ```ts
 * router.put("/theme", authMiddleware, adminOnly, updateThemeController);
 * ```
 */

import { Request, Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../modules/auth/auth.types.js";
import { AppError } from "../errors/index.js";

/**
 * Reusable middleware: rejects non-ADMIN users with 403 Forbidden.
 */
export function adminOnly(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const user = (req as AuthenticatedRequest).user;

  if (!user || user.role !== "ADMIN") {
    throw AppError.forbidden("Only admins can perform this action");
  }

  next();
}
