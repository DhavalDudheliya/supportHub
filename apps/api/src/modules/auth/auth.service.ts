/**
 * Auth Module — Business Logic (Service Layer)
 *
 * Contains all authentication-related business logic, keeping the controller
 * handlers thin. Each function performs database operations, token management,
 * and error handling for a specific auth flow:
 *
 * - registerUser: Creates a new workspace (Domain) and user account
 * - verifyUserEmail: Validates the email verification token
 * - loginUser: Authenticates credentials and issues JWT tokens
 * - refreshUserToken: Implements token rotation for refresh tokens
 * - getUserProfile: Fetches the authenticated user's profile
 *
 * Error Convention: Errors are thrown as `{ status, message }` objects.
 * The controller catches these and maps them to HTTP responses.
 */

import prisma from "../../lib/prisma.js";
import { hashPassword, comparePassword } from "../../utils/password.js";
import { generateAccessToken, generateRefreshToken } from "../../utils/jwt.js";
import {
  generateVerificationToken,
  getVerificationExpiry,
} from "../../utils/token.js";
import { generateSubdomain } from "../../utils/subdomain.js";
import { sendVerificationEmail } from "../../services/email.service.js";
import { RegisterBody, LoginBody } from "./auth.types.js";
import logger from "../../lib/logger.js";

/**
 * Register a new user and create their tenant workspace.
 *
 * Flow:
 * 1. Check email uniqueness
 * 2. Generate a URL subdomain from the company name and check uniqueness
 * 3. Hash the password with bcrypt
 * 4. Create Domain + User in a database transaction (atomic)
 * 5. Send verification email asynchronously (non-blocking)
 *
 * @param data - Registration form data (email, name, phone, company, password)
 * @returns Success message and the created workspace subdomain
 * @throws 409 if email or domain subdomain already exists
 */
export async function registerUser(data: RegisterBody) {
  const { email, firstName, lastName, phone, companyName, password } = data;

  // 1. Check if a user with this email already exists
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw { status: 409, message: "An account with this email already exists" };
  }

  // 2. Generate the workspace subdomain from company name and check uniqueness
  const subdomain = generateSubdomain(companyName);
  const existingDomain = await prisma.domain.findUnique({
    where: { subdomain },
  });
  if (existingDomain) {
    throw {
      status: 409,
      message:
        "A workspace with this company name already exists. Please choose a different name.",
    };
  }

  // 3. Hash the password (bcrypt with 12 salt rounds)
  const passwordHash = await hashPassword(password);

  // 4. Generate a one-time email verification token (valid for 24 hours)
  const emailVerifyToken = generateVerificationToken();
  const emailVerifyExpires = getVerificationExpiry();

  // 5. Create Domain and User atomically using a Prisma transaction
  //    If either creation fails, both are rolled back
  const result = await prisma.$transaction(async (tx) => {
    const domain = await tx.domain.create({
      data: {
        subdomain,
        company: companyName,
      },
    });

    const user = await tx.user.create({
      data: {
        email,
        firstName,
        lastName,
        phone,
        passwordHash,
        emailVerifyToken,
        emailVerifyExpires,
        domainId: domain.id,
      },
    });

    return { user, domain };
  });

  // 6. Send the verification email in the background (fire-and-forget)
  //    Failures are logged but don't block the registration response
  sendVerificationEmail(email, emailVerifyToken, subdomain).catch((err) => {
    logger.error({ err }, "Failed to send verification email");
  });

  return {
    message:
      "Registration successful! Please check your email to verify your account.",
    subdomain: result.domain.subdomain,
  };
}

/**
 * Verify a user's email address using the token from the verification link.
 *
 * Flow:
 * 1. Look up the user by their unique verification token
 * 2. Check if the token has expired (24-hour window)
 * 3. Mark the email as verified and clear the token fields
 *
 * @param token - The verification token from the email link's query parameter
 * @returns The user's domain subdomain (used for redirecting to login page)
 * @throws 400 if the token is invalid or expired
 */
export async function verifyUserEmail(token: string) {
  // Find user by the unique verification token
  const user = await prisma.user.findUnique({
    where: { emailVerifyToken: token },
    include: { domain: true },
  });

  if (!user) {
    throw { status: 400, message: "Invalid or expired verification token" };
  }

  // Check if the 24-hour verification window has passed
  if (user.emailVerifyExpires && user.emailVerifyExpires < new Date()) {
    throw {
      status: 400,
      message: "Verification token has expired. Please request a new one.",
    };
  }

  // Mark email as verified and clear the token (single-use)
  await prisma.user.update({
    where: { id: user.id },
    data: {
      isEmailVerified: true,
      emailVerifyToken: null,
      emailVerifyExpires: null,
    },
  });

  return { subdomain: user.domain.subdomain };
}

/**
 * Authenticate a user with email and password.
 *
 * Flow:
 * 1. Find user by email
 * 2. Ensure their email is verified (403 if not)
 * 3. Compare password against the stored bcrypt hash (401 if wrong)
 * 4. Generate access + refresh token pair
 * 5. Store the refresh token on the user record (for rotation)
 *
 * @param data - Login credentials (email, password)
 * @returns Access token, refresh token, and user profile (without password)
 * @throws 401 if email doesn't exist or password is wrong
 * @throws 403 if email is not yet verified
 */
export async function loginUser(data: LoginBody) {
  const { email, password } = data;

  // Look up user with their domain info
  const user = await prisma.user.findUnique({
    where: { email },
    include: { domain: true },
  });

  // Use a generic error message to prevent email enumeration
  if (!user) {
    throw { status: 401, message: "Invalid email or password" };
  }

  // Block login for unverified accounts
  if (!user.isEmailVerified) {
    throw {
      status: 403,
      message: "Please verify your email before logging in",
    };
  }

  // Verify the password against the stored hash
  const isPasswordValid = await comparePassword(password, user.passwordHash);
  if (!isPasswordValid) {
    throw { status: 401, message: "Invalid email or password" };
  }

  // Build the JWT payload with essential user identity data
  const tokenPayload = {
    userId: user.id,
    email: user.email,
    domainId: user.domainId,
    role: user.role,
  };

  // Generate the token pair
  const accessToken = generateAccessToken(tokenPayload);
  const refreshToken = generateRefreshToken(tokenPayload);

  // Store refresh token on the user for token rotation validation
  await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken },
  });

  // Return tokens and a safe user profile (no passwordHash)
  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      role: user.role,
      domain: {
        id: user.domain.id,
        subdomain: user.domain.subdomain,
        company: user.domain.company,
      },
    },
  };
}

/**
 * Issue a new access + refresh token pair using a valid refresh token.
 * Implements token rotation — the old refresh token is invalidated and
 * replaced with a new one, preventing replay attacks.
 *
 * @param refreshToken - The current valid refresh token
 * @returns New access and refresh tokens
 * @throws 401 if the refresh token doesn't match any user
 */
export async function refreshUserToken(refreshToken: string) {
  // Find the user who holds this refresh token
  const user = await prisma.user.findFirst({
    where: { refreshToken },
    include: { domain: true },
  });

  if (!user) {
    throw { status: 401, message: "Invalid refresh token" };
  }

  const tokenPayload = {
    userId: user.id,
    email: user.email,
    domainId: user.domainId,
    role: user.role,
  };

  // Token rotation: generate a completely new pair
  const newAccessToken = generateAccessToken(tokenPayload);
  const newRefreshToken = generateRefreshToken(tokenPayload);

  // Replace the old refresh token in the database
  await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken: newRefreshToken },
  });

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  };
}

/**
 * Fetch the authenticated user's full profile including domain info.
 * Used by the GET /api/auth/me endpoint (protected route).
 *
 * @param userId - The UUID of the authenticated user (from JWT payload)
 * @returns User profile with domain details (no sensitive fields)
 * @throws 404 if the user is not found
 */
export async function getUserProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { domain: true },
  });

  if (!user) {
    throw { status: 404, message: "User not found" };
  }

  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone,
    role: user.role,
    domain: {
      id: user.domain.id,
      subdomain: user.domain.subdomain,
      company: user.domain.company,
    },
  };
}

/**
 * Look up a user's workspace subdomain by their email.
 * This supports the "Find Your Workspace" public login flow.
 *
 * @param email - The user's registered email address
 * @returns The user's workspace subdomain
 * @throws 404 if no account exists with this email
 */
export async function lookupUserDomain(email: string) {
  const user = await prisma.user.findUnique({
    where: { email },
    include: { domain: true },
  });

  if (!user) {
    throw { status: 404, message: "No account found with this email" };
  }

  return { subdomain: user.domain.subdomain };
}
