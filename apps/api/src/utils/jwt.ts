/**
 * JWT (JSON Web Token) Utilities
 *
 * Provides token generation and verification for the dual-token authentication system:
 * - Access Token: Short-lived (default 15 min), sent with every API request
 * - Refresh Token: Long-lived (default 7 days), used to obtain new access tokens
 *
 * Both tokens carry the same payload (userId, email, domainId, role) but are
 * signed with different secrets for security isolation.
 *
 * Secrets and expiry durations are configurable via environment variables:
 * - JWT_ACCESS_SECRET / JWT_REFRESH_SECRET
 * - JWT_ACCESS_EXPIRY / JWT_REFRESH_EXPIRY
 */

import jwt, { JwtPayload, SignOptions } from "jsonwebtoken";

/**
 * Shape of the data embedded in both access and refresh tokens.
 * Extends JwtPayload to include standard fields like `iat` and `exp`.
 */
export interface AuthTokenPayload extends JwtPayload {
  userId: string;
  email: string;
  domainId: string;
  role: string;
}

// Token signing secrets — MUST be overridden in production via env vars
const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || "access-secret-dev";
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "refresh-secret-dev";

// Token expiry durations (supports zeit/ms format: "15m", "7d", "1h", etc.)
const ACCESS_EXPIRY = process.env.JWT_ACCESS_EXPIRY || "15m";
const REFRESH_EXPIRY = process.env.JWT_REFRESH_EXPIRY || "7d";

/**
 * Generate a short-lived access token.
 * @param payload - User identity data to embed in the token
 * @returns Signed JWT string
 */
export function generateAccessToken(
  payload: Omit<AuthTokenPayload, "iat" | "exp">,
): string {
  const options: SignOptions = { expiresIn: ACCESS_EXPIRY as any };
  return jwt.sign(payload, ACCESS_SECRET, options);
}

/**
 * Generate a long-lived refresh token.
 * @param payload - User identity data to embed in the token
 * @returns Signed JWT string
 */
export function generateRefreshToken(
  payload: Omit<AuthTokenPayload, "iat" | "exp">,
): string {
  const options: SignOptions = { expiresIn: REFRESH_EXPIRY as any };
  return jwt.sign(payload, REFRESH_SECRET, options);
}

/**
 * Verify and decode an access token.
 * @param token - The JWT string to verify
 * @returns Decoded payload if valid
 * @throws JsonWebTokenError if the token is invalid or expired
 */
export function verifyAccessToken(token: string): AuthTokenPayload {
  return jwt.verify(token, ACCESS_SECRET) as AuthTokenPayload;
}

/**
 * Verify and decode a refresh token.
 * @param token - The JWT string to verify
 * @returns Decoded payload if valid
 * @throws JsonWebTokenError if the token is invalid or expired
 */
export function verifyRefreshToken(token: string): AuthTokenPayload {
  return jwt.verify(token, REFRESH_SECRET) as AuthTokenPayload;
}
