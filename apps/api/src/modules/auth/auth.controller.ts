/**
 * Auth Module — Controller (Route Handlers)
 *
 * Thin controller layer that handles HTTP request/response concerns:
 * - Validates input using Zod schemas
 * - Delegates business logic to the auth service
 * - Relies on Express 5 automatic error forwarding + global error handler
 *
 * No try/catch needed — Express 5 catches rejected promises from async
 * handlers and forwards them to the global error middleware automatically.
 */

import { Request, Response } from "express";
import { verifyRefreshToken } from "../../utils/jwt.js";
import { AppError } from "../../errors/index.js";
import {
  registerUser,
  verifyUserEmail,
  resendVerificationForEmail,
  loginUser,
  refreshUserToken,
  getUserProfile,
  lookupUserWorkspace,
} from "./auth.service.js";
import {
  registerSchema,
  loginSchema,
  lookupWorkspaceSchema,
  refreshTokenSchema,
  resendVerificationSchema,
} from "./auth.validation.js";
import { AuthenticatedRequest } from "./auth.types.js";

/**
 * POST /api/auth/register
 *
 * Creates a new user and creates their tenant workspace.
 * Validates input, then delegates to registerUser service.
 *
 * Request body: RegisterBody (email, firstName, lastName, phone, companyName, password)
 * Response 201: { message, subdomain }
 * Response 400: Validation errors
 * Response 409: Email or workspace already exists
 */
export async function register(req: Request, res: Response): Promise<void> {
  const data = registerSchema.parse(req.body);
  const result = await registerUser(data);
  res.status(201).json(result);
}

/**
 * GET /api/auth/verify-email?token=<token>
 *
 * Verifies a user's email using the token from the verification link.
 * On success, redirects to the frontend login page of their workspace.
 *
 * Query params: token (required)
 * Response 302: Redirect to {protocol}://{subdomain}.{FRONTEND_DOMAIN}/login?verified=true
 * Response 400: Invalid or expired token
 */
export async function verifyEmail(req: Request, res: Response): Promise<void> {
  const token = req.query.token as string;

  if (!token) {
    throw AppError.badRequest("Verification token is required");
  }

  // Verify the token and get the user's domain subdomain for redirect
  const result = await verifyUserEmail(token);
  const frontendDomain = process.env.FRONTEND_DOMAIN || "localhost:3000";
  const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
  res.redirect(
    `${protocol}://${result.subdomain}.${frontendDomain}/login?verified=true`,
  );
}

/**
 * POST /api/auth/resend-verification
 *
 * Resends the email verification link for an unverified account.
 * Uses generic success messages to prevent email enumeration.
 *
 * Request body: { email }
 * Response 200: { message }
 * Response 400: Validation errors
 * Response 429: Rate limited
 */
export async function resendVerification(
  req: Request,
  res: Response,
): Promise<void> {
  const data = resendVerificationSchema.parse(req.body);
  const result = await resendVerificationForEmail(data.email);
  res.status(200).json(result);
}

/**
 * POST /api/auth/login
 *
 * Authenticates a user with email and password.
 * Returns JWT access and refresh tokens along with user profile.
 *
 * Request body: LoginBody (email, password)
 * Response 200: { accessToken, refreshToken, user }
 * Response 400: Validation errors
 * Response 401: Invalid credentials
 * Response 403: Email not verified
 */
export async function login(req: Request, res: Response): Promise<void> {
  const data = loginSchema.parse(req.body);
  const result = await loginUser(data);
  res.status(200).json(result);
}

/**
 * POST /api/auth/refresh-token
 *
 * Issues a new access + refresh token pair using a valid refresh token.
 * The old refresh token is invalidated (token rotation).
 *
 * Request body: RefreshTokenBody (refreshToken)
 * Response 200: { accessToken, refreshToken }
 * Response 400: Missing / invalid token
 * Response 401: Invalid or expired token
 */
export async function refreshToken(req: Request, res: Response): Promise<void> {
  const { refreshToken: token } = refreshTokenSchema.parse(req.body);

  // First verify the JWT signature and expiry before checking the DB
  try {
    verifyRefreshToken(token);
  } catch {
    throw AppError.unauthorized("Invalid or expired refresh token");
  }

  // Token is a valid JWT — now check it matches a user in the database
  const data = await refreshUserToken(token);
  res.status(200).json(data);
}

/**
 * GET /api/auth/me (Protected — requires authMiddleware)
 *
 * Returns the authenticated user's profile.
 * The user identity is extracted from the JWT by the auth middleware.
 *
 * Response 200: User profile with domain info
 * Response 401: Not authenticated
 */
export async function me(req: Request, res: Response): Promise<void> {
  const authReq = req as AuthenticatedRequest;

  // This should never happen if authMiddleware is applied, but guard anyway
  if (!authReq.user) {
    throw AppError.unauthorized();
  }

  const profile = await getUserProfile(authReq.user.userId);
  res.status(200).json(profile);
}

/**
 * POST /api/auth/lookup-workspace
 *
 * Looks up the workspace subdomain associated with an email address.
 * Used for the "Find Your Workspace" portal login flow in multi-tenant environments.
 *
 * Request body: LookupWorkspaceBody (email)
 * Response 200: { subdomain }
 * Response 400: Validation errors
 * Response 404: Email not found
 */
export async function lookupWorkspace(
  req: Request,
  res: Response,
): Promise<void> {
  const data = lookupWorkspaceSchema.parse(req.body);
  const result = await lookupUserWorkspace(data.email);
  res.status(200).json(result);
}
