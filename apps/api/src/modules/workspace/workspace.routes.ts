/**
 * Workspace Module — Route Definitions
 *
 * Registers all workspace-related routes with appropriate middleware:
 * - authMiddleware: verifies JWT access token
 * - adminOnly: restricts mutations to ADMIN role
 * - multer: handles multipart file uploads (memory storage)
 *
 * All routes are mounted under /api/v1/workspace by the central route registry.
 */

import { Router, type IRouter } from "express";
import multer from "multer";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { adminOnly } from "../../middlewares/admin.middleware.js";
import * as controller from "./workspace.controller.js";

const router: IRouter = Router();

/**
 * Multer configuration — memory storage (no disk writes).
 * Files are kept in buffer for direct upload to S3.
 */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB max (further validated per asset type in service)
  },
});

// --- Theme Routes ---

/** Get current workspace theme (any authenticated user) */
router.get("/theme", authMiddleware, controller.getTheme);

/** Update workspace theme (ADMIN only) */
router.put("/theme", authMiddleware, adminOnly, controller.updateTheme);

/** Upload workspace logo (ADMIN only, multipart) */
router.post(
  "/theme/logo",
  authMiddleware,
  adminOnly,
  upload.single("file"),
  controller.uploadLogo,
);

/** Upload workspace favicon (ADMIN only, multipart) */
router.post(
  "/theme/favicon",
  authMiddleware,
  adminOnly,
  upload.single("file"),
  controller.uploadFavicon,
);

/** Remove workspace logo (ADMIN only) */
router.delete("/theme/logo", authMiddleware, adminOnly, controller.removeLogo);

/** Remove workspace favicon (ADMIN only) */
router.delete(
  "/theme/favicon",
  authMiddleware,
  adminOnly,
  controller.removeFavicon,
);

export default router;
