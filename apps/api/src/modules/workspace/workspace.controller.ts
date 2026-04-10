/**
 * Workspace Module — Controller (Request Handlers)
 *
 * Thin handlers that parse requests, delegate to the service layer,
 * and return JSON responses. All theme mutations are ADMIN-only
 * (enforced by the adminOnly middleware in the route definition).
 */

import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../auth/auth.types.js";
import { updateThemeSchema } from "./workspace.validation.js";
import * as workspaceService from "./workspace.service.js";
import { AppError } from "../../errors/index.js";

/**
 * GET /v1/workspace/theme
 * Fetch the current workspace theme (or defaults).
 */
export async function getTheme(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const { workspaceId } = req.user!;
    const theme = await workspaceService.getTheme(workspaceId);
    res.json(theme);
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /v1/workspace/theme
 * Create or update workspace theme settings.
 */
export async function updateTheme(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const { workspaceId } = req.user!;
    const parsed = updateThemeSchema.parse(req.body);
    const theme = await workspaceService.upsertTheme(workspaceId, parsed);
    res.json(theme);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /v1/workspace/theme/logo
 * Upload a workspace logo (multipart form data).
 */
export async function uploadLogo(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const { workspaceId } = req.user!;
    const file = req.file;

    if (!file) {
      throw AppError.badRequest("No file provided");
    }

    const theme = await workspaceService.uploadAsset(workspaceId, "logo", file);
    res.json(theme);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /v1/workspace/theme/favicon
 * Upload a workspace favicon (multipart form data).
 */
export async function uploadFavicon(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const { workspaceId } = req.user!;
    const file = req.file;

    if (!file) {
      throw AppError.badRequest("No file provided");
    }

    const theme = await workspaceService.uploadAsset(
      workspaceId,
      "favicon",
      file,
    );
    res.json(theme);
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /v1/workspace/theme/logo
 * Remove the workspace logo.
 */
export async function removeLogo(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const { workspaceId } = req.user!;
    const theme = await workspaceService.removeAsset(workspaceId, "logo");
    res.json(theme);
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /v1/workspace/theme/favicon
 * Remove the workspace favicon.
 */
export async function removeFavicon(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const { workspaceId } = req.user!;
    const theme = await workspaceService.removeAsset(workspaceId, "favicon");
    res.json(theme);
  } catch (err) {
    next(err);
  }
}
