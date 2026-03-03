/**
 * Auth Module — Zod Validation Schemas
 *
 * Declarative validation for auth endpoints using Zod.
 * Types are inferred from these schemas in auth.types.ts,
 * keeping validation rules and TypeScript types in sync.
 */

import { z } from "zod";

/**
 * POST /api/auth/register
 *
 * Rules:
 * - email:       valid email format
 * - firstName:   at least 2 characters (after trim)
 * - lastName:    at least 2 characters (after trim)
 * - phone:      required, non-empty
 * - companyName: at least 2 characters (after trim)
 * - password:    at least 8 characters
 */
export const registerSchema = z.object({
  email: z.email("Invalid email format"),
  firstName: z
    .string({ message: "First name is required" })
    .trim()
    .min(2, "First name must be at least 2 characters"),
  lastName: z
    .string({ message: "Last name is required" })
    .trim()
    .min(2, "Last name must be at least 2 characters"),
  phone: z
    .string({ message: "Phone number is required" })
    .min(1, "Phone number is required"),
  companyName: z
    .string({ message: "Company name is required" })
    .trim()
    .min(2, "Company name must be at least 2 characters"),
  password: z
    .string({ message: "Password is required" })
    .min(8, "Password must be at least 8 characters"),
});

/**
 * POST /api/auth/login
 *
 * Rules:
 * - email:    valid email format
 * - password: required
 */
export const loginSchema = z.object({
  email: z.email("Invalid email format"),
  password: z
    .string({ message: "Password is required" })
    .min(1, "Password is required"),
});

/**
 * POST /api/auth/lookup-domain
 *
 * Rules:
 * - email: valid email format
 */
export const lookupDomainSchema = z.object({
  email: z.email("Invalid email format"),
});

/**
 * POST /api/auth/refresh-token
 *
 * Rules:
 * - refreshToken: required non-empty string
 */
export const refreshTokenSchema = z.object({
  refreshToken: z
    .string({ message: "Refresh token is required" })
    .min(1, "Refresh token is required"),
});
