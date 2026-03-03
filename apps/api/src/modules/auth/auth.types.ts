/**
 * Auth Module — Type Definitions
 *
 * TypeScript types are inferred directly from the Zod schemas,
 * keeping validation rules and types in a single source of truth.
 *
 * AuthenticatedRequest is defined separately as it extends Express Request.
 */

import { Request } from "express";
import { z } from "zod";
import {
  registerSchema,
  loginSchema,
  lookupDomainSchema,
  refreshTokenSchema,
} from "./auth.validation.js";

/** Inferred from registerSchema */
export type RegisterBody = z.infer<typeof registerSchema>;

/** Inferred from loginSchema */
export type LoginBody = z.infer<typeof loginSchema>;

/** Inferred from lookupDomainSchema */
export type LookupDomainBody = z.infer<typeof lookupDomainSchema>;

/** Inferred from refreshTokenSchema */
export type RefreshTokenBody = z.infer<typeof refreshTokenSchema>;

/**
 * Extended Express Request with authenticated user data.
 * Populated by the authMiddleware after verifying the JWT access token.
 * Available in any route handler protected by authMiddleware.
 */
export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string; // UUID of the authenticated user
    email: string; // User's email address
    domainId: string; // UUID of the user's tenant workspace
    role: string; // "ADMIN" or "AGENT"
  };
}
