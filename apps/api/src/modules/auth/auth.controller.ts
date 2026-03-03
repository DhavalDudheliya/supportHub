/**
 * Auth Module — Controller (Route Handlers)
 *
 * Thin controller layer that handles HTTP request/response concerns:
 * - Validates input using Zod schemas via safeParse
 * - Delegates business logic to the auth service
 * - Maps service results/errors to appropriate HTTP responses
 *
 * Each handler follows the pattern:
 *   validate → call service → send response → catch errors
 */

import { Request, Response } from "express";
import { verifyRefreshToken } from "../../utils/jwt.js";
import {
  registerUser,
  verifyUserEmail,
  loginUser,
  refreshUserToken,
  getUserProfile,
  lookupUserDomain,
} from "./auth.service.js";
import {
  registerSchema,
  loginSchema,
  lookupDomainSchema,
  refreshTokenSchema,
} from "./auth.validation.js";
import { AuthenticatedRequest } from "./auth.types.js";

/**
 * Extract a flat string[] of human-readable messages from a Zod error.
 * Keeps the existing 400 response shape: { errors: string[] }
 */
function formatZodErrors(error: import("zod").ZodError): string[] {
  return error.issues.map((issue) => issue.message);
}

/**
 * POST /api/auth/register
 *
 * Registers a new user and creates their tenant workspace.
 * Validates input, then delegates to registerUser service.
 *
 * Request body: RegisterBody (email, firstName, lastName, phone, companyName, password)
 * Response 201: { message, subdomain }
 * Response 400: { errors: string[] } — validation errors
 * Response 409: { error } — email or domain already exists
 */
export async function register(req: Request, res: Response): Promise<void> {
  try {
    const result = registerSchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ errors: formatZodErrors(result.error) });
      return;
    }

    const data = await registerUser(result.data);
    res.status(201).json(data);
  } catch (error: any) {
    const status = error.status || 500;
    const message = error.message || "Internal server error";
    res.status(status).json({ error: message });
  }
}

/**
 * GET /api/auth/verify-email?token=<token>
 *
 * Verifies a user's email using the token from the verification link.
 * On success, redirects to the frontend login page of their workspace.
 *
 * Query params: token (required)
 * Response 302: Redirect to {protocol}://{subdomain}.{FRONTEND_DOMAIN}/login?verified=true
 * Response 400: { error } — invalid or expired token
 */
export async function verifyEmail(req: Request, res: Response): Promise<void> {
  try {
    const token = req.query.token as string;

    if (!token) {
      res.status(400).json({ error: "Verification token is required" });
      return;
    }

    // Verify the token and get the user's domain subdomain for redirect
    const result = await verifyUserEmail(token);
    const frontendDomain = process.env.FRONTEND_DOMAIN || "localhost:3000";
    const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
    res.redirect(
      `${protocol}://${result.subdomain}.${frontendDomain}/login?verified=true`,
    );
  } catch (error: any) {
    const status = error.status || 500;
    const message = error.message || "Internal server error";
    res.status(status).json({ error: message });
  }
}

/**
 * POST /api/auth/login
 *
 * Authenticates a user with email and password.
 * Returns JWT access and refresh tokens along with user profile.
 *
 * Request body: LoginBody (email, password)
 * Response 200: { accessToken, refreshToken, user }
 * Response 400: { errors: string[] } — validation errors
 * Response 401: { error } — invalid credentials
 * Response 403: { error } — email not verified
 */
export async function login(req: Request, res: Response): Promise<void> {
  try {
    const result = loginSchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ errors: formatZodErrors(result.error) });
      return;
    }

    const data = await loginUser(result.data);
    res.status(200).json(data);
  } catch (error: any) {
    const status = error.status || 500;
    const message = error.message || "Internal server error";
    res.status(status).json({ error: message });
  }
}

/**
 * POST /api/auth/refresh-token
 *
 * Issues a new access + refresh token pair using a valid refresh token.
 * The old refresh token is invalidated (token rotation).
 *
 * Request body: RefreshTokenBody (refreshToken)
 * Response 200: { accessToken, refreshToken }
 * Response 400: { errors: string[] } — missing / invalid token
 * Response 401: { error } — invalid or expired token
 */
export async function refreshToken(req: Request, res: Response): Promise<void> {
  try {
    const result = refreshTokenSchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ errors: formatZodErrors(result.error) });
      return;
    }

    const { refreshToken: token } = result.data;

    // First verify the JWT signature and expiry before checking the DB
    try {
      verifyRefreshToken(token);
    } catch {
      res.status(401).json({ error: "Invalid or expired refresh token" });
      return;
    }

    // Token is a valid JWT — now check it matches a user in the database
    const data = await refreshUserToken(token);
    res.status(200).json(data);
  } catch (error: any) {
    const status = error.status || 500;
    const message = error.message || "Internal server error";
    res.status(status).json({ error: message });
  }
}

/**
 * GET /api/auth/me (Protected — requires authMiddleware)
 *
 * Returns the authenticated user's profile.
 * The user identity is extracted from the JWT by the auth middleware.
 *
 * Response 200: User profile with domain info
 * Response 401: { error } — not authenticated
 */
export async function me(req: Request, res: Response): Promise<void> {
  try {
    const authReq = req as AuthenticatedRequest;

    // This should never happen if authMiddleware is applied, but guard anyway
    if (!authReq.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const profile = await getUserProfile(authReq.user.userId);
    res.status(200).json(profile);
  } catch (error: any) {
    const status = error.status || 500;
    const message = error.message || "Internal server error";
    res.status(status).json({ error: message });
  }
}

/**
 * POST /api/auth/lookup-domain
 *
 * Looks up the workspace subdomain associated with an email address.
 * Used for the "Find Your Workspace" portal login flow in multi-tenant environments.
 *
 * Request body: LookupDomainBody (email)
 * Response 200: { subdomain }
 * Response 400: { errors: string[] } — validation errors
 * Response 404: { error } — email not found
 */
export async function lookupDomain(req: Request, res: Response): Promise<void> {
  try {
    const result = lookupDomainSchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ errors: formatZodErrors(result.error) });
      return;
    }

    const data = await lookupUserDomain(result.data.email);
    res.status(200).json(data);
  } catch (error: any) {
    const status = error.status || 500;
    const message = error.message || "Internal server error";
    res.status(status).json({ error: message });
  }
}
