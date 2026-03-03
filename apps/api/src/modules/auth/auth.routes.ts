/**
 * Auth Module — Route Definitions
 *
 * Mounts all authentication endpoints under /api/auth (set in index.ts).
 *
 * Public routes (no token required):
 *   POST /register       — Create account + workspace
 *   GET  /verify-email   — Verify email from link
 *   POST /login          — Authenticate and get tokens
 *   POST /refresh-token  — Rotate expired access token
 *
 * Protected routes (requires Bearer token via authMiddleware):
 *   GET  /me             — Get authenticated user's profile
 */

import { Router, type IRouter } from "express";
import {
  register,
  verifyEmail,
  login,
  refreshToken,
  me,
  lookupDomain,
} from "./auth.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";

const router: IRouter = Router();

// --- Public Routes ---
router.post("/register", register);
router.get("/verify-email", verifyEmail);
router.post("/login", login);
router.post("/lookup-domain", lookupDomain);
router.post("/refresh-token", refreshToken);

// --- Protected Routes ---
router.get("/me", authMiddleware, me);

export default router;
