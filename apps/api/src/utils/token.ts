/**
 * Verification Token Utilities
 *
 * Generates cryptographically secure tokens used for email verification links.
 * These tokens are stored in the database and included in the verification URL
 * sent to the user's email. They are single-use and expire after 24 hours.
 */

import crypto from "crypto";

/**
 * Generate a cryptographically random, URL-safe verification token.
 * Uses 32 random bytes (256 bits) encoded as a 64-character hex string.
 * @returns A unique hex token string
 */
export function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Calculate the expiry timestamp for a verification token.
 * Tokens are valid for 24 hours from the time of generation.
 * @returns Date object set to 24 hours from now
 */
export function getVerificationExpiry(): Date {
  const expiry = new Date();
  expiry.setHours(expiry.getHours() + 24);
  return expiry;
}
