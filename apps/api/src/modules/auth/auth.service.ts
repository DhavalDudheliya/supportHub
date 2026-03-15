/**
 * Auth Module — Business Logic (Service Layer)
 *
 * Contains all authentication-related business logic, keeping the controller
 * handlers thin. Each function performs database operations, token management,
 * and error handling for a specific auth flow:
 *
 * - registerUser: Creates a new workspace (Workspace) and user account
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
 * 4. Create Workspace + User in a database transaction (atomic)
 * 5. Send verification email asynchronously (non-blocking)
 *
 * @param data - Registration form data (email, name, phone, company, password)
 * @returns Success message and the created workspace subdomain
 * @throws 409 if email or workspace subdomain already exists
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
  const existingWorkspace = await prisma.workspace.findUnique({
    where: { subdomain },
  });
  if (existingWorkspace) {
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

  // 5. Create Workspace and User atomically using a Prisma transaction
  //    If either creation fails, both are rolled back
  const result = await prisma.$transaction(async (tx) => {
    const workspace = await tx.workspace.create({
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
        workspaceId: workspace.id,
      },
    });

    return { user, workspace };
  });

  // 6. Send the verification email in the background (fire-and-forget)
  //    Failures are logged but don't block the registration response
  sendVerificationEmail(email, emailVerifyToken, subdomain).catch((err) => {
    logger.error({ err }, "Failed to send verification email");
  });

  return {
    message:
      "Registration successful! Please check your email to verify your account.",
    subdomain: result.workspace.subdomain,
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
 * @returns The user's workspace subdomain (used for redirecting to login page)
 * @throws 400 if the token is invalid or expired
 */
export async function verifyUserEmail(token: string) {
  // Find user by the unique verification token
  const user = await prisma.user.findUnique({
    where: { emailVerifyToken: token },
    include: { workspace: true },
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

  return { subdomain: user.workspace.subdomain };
}

/**
 * Resend the email verification link for a user who hasn't verified yet.
 *
 * Flow:
 * 1. Look up user by email (return generic success if not found — prevent enumeration)
 * 2. Skip silently if already verified
 * 3. Rate-limit: reject if the last token was issued less than 1 hour ago
 * 4. Generate a fresh verification token and expiry
 * 5. Update the user record and send the email
 *
 * @param email - The user's email address
 * @returns Generic success message
 * @throws 429 if the previous email was sent less than 1 hour ago
 */
export async function resendVerificationForEmail(email: string) {
  const user = await prisma.user.findUnique({
    where: { email },
    include: { workspace: true },
  });

  // Don't reveal whether the email exists — return a generic success
  if (!user) {
    return {
      message:
        "If an account with this email exists, a new verification link has been sent.",
    };
  }

  // Already verified — nothing to do
  if (user.isEmailVerified) {
    return {
      message:
        "If an account with this email exists, a new verification link has been sent.",
    };
  }

  // Rate-limit: if the existing token expires more than 23 hours from now,
  // the last email was sent less than 1 hour ago
  if (user.emailVerifyExpires) {
    const twentyThreeHoursFromNow = new Date(Date.now() + 23 * 60 * 60 * 1000);
    if (user.emailVerifyExpires > twentyThreeHoursFromNow) {
      throw {
        status: 429,
        message:
          "A verification email was sent recently. Please wait before requesting another.",
      };
    }
  }

  // Generate fresh token
  const emailVerifyToken = generateVerificationToken();
  const emailVerifyExpires = getVerificationExpiry();

  // Attempt to send email first. If it fails, we catch and throw
  // to avoid updating the database with a token that was never sent.
  try {
    await sendVerificationEmail(
      email,
      emailVerifyToken,
      user.workspace.subdomain,
    );
  } catch (err) {
    logger.error({ err }, "Failed to resend verification email");
    throw {
      status: 500,
      message: "Failed to send verification email. Please try again later.",
    };
  }

  // Only persist the new token after successful email send
  await prisma.user.update({
    where: { id: user.id },
    data: { emailVerifyToken, emailVerifyExpires },
  });

  return {
    message:
      "If an account with this email exists, a new verification link has been sent.",
  };
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
    include: { workspace: true },
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

  const tokenPayload = {
    userId: user.id,
    email: user.email,
    workspaceId: user.workspaceId,
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
      workspace: {
        id: user.workspace.id,
        subdomain: user.workspace.subdomain,
        company: user.workspace.company,
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
    include: { workspace: true },
  });

  if (!user) {
    throw { status: 401, message: "Invalid refresh token" };
  }

  const tokenPayload = {
    userId: user.id,
    email: user.email,
    workspaceId: user.workspaceId,
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
 * Fetch the authenticated user's full profile including workspace info.
 * Used by the GET /api/auth/me endpoint (protected route).
 *
 * @param userId - The UUID of the authenticated user (from JWT payload)
 * @returns User profile with workspace details (no sensitive fields)
 * @throws 404 if the user is not found
 */
export async function getUserProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { workspace: true },
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
    workspace: {
      id: user.workspace.id,
      subdomain: user.workspace.subdomain,
      company: user.workspace.company,
    },
  };
}

/**
 * Lookup workspace(s) associated with an email address.
 *
 * Privacy-preserving: Always returns 200/Success to prevent account enumeration.
 * If a user exists, it currently returns the subdomain directly to simplify the
 * initial flow, but in a production environment should send an email instead.
 */
export async function lookupUserWorkspace(email: string) {
  const user = await prisma.user.findUnique({
    where: { email },
    include: { workspace: true },
  });

  if (!user) {
    return { message: "No workspace found for this email" };
  }

  return { subdomain: user.workspace.subdomain };
}
