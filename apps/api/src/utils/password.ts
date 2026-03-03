/**
 * Password Hashing Utilities
 *
 * Uses bcrypt for secure one-way password hashing. Bcrypt automatically
 * handles salt generation and incorporates a configurable cost factor
 * (SALT_ROUNDS) to resist brute-force attacks.
 */

import bcrypt from "bcrypt";

/** Cost factor for bcrypt hashing — higher = slower but more secure */
const SALT_ROUNDS = 12;

/**
 * Hash a plain-text password using bcrypt.
 * @param password - The plain-text password to hash
 * @returns The bcrypt hash string (includes salt + hash)
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Compare a plain-text password against a bcrypt hash.
 * @param password - The plain-text password to verify
 * @param hash - The stored bcrypt hash to compare against
 * @returns True if the password matches the hash
 */
export async function comparePassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
