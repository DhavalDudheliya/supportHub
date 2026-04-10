/**
 * Workspace Module — Business Logic (Service Layer)
 *
 * Handles workspace theme CRUD operations and asset management.
 * Theme records are created lazily on first update (upsert pattern).
 */

import prisma from "../../lib/prisma.js";
import {
  uploadFile,
  deleteFile,
  extractKeyFromUrl,
  generateAssetKey,
} from "../../services/s3.service.js";
import { UpdateThemeBody } from "./workspace.types.js";
import { AppError } from "../../errors/index.js";
import logger from "../../lib/logger.js";

/**
 * Default theme values returned when no WorkspaceTheme record exists.
 */
const DEFAULT_THEME = {
  primaryColor: "#4F6BF0",
  accentColor: "#7C3AED",
  fontFamily: "Inter",
  borderRadius: 0.375,
  defaultMode: "system",
  logoUrl: null,
  faviconUrl: null,
};

/**
 * Fetch the workspace theme.
 * Returns stored values if a theme record exists, otherwise returns defaults.
 */
export async function getTheme(workspaceId: string) {
  const theme = await prisma.workspaceTheme.findUnique({
    where: { workspaceId },
  });

  if (!theme) {
    return { ...DEFAULT_THEME };
  }

  return {
    primaryColor: theme.primaryColor,
    accentColor: theme.accentColor,
    fontFamily: theme.fontFamily,
    borderRadius: theme.borderRadius,
    defaultMode: theme.defaultMode,
    logoUrl: theme.logoUrl,
    faviconUrl: theme.faviconUrl,
  };
}

/**
 * Create or update the workspace theme settings.
 * Uses Prisma upsert to handle both first-time creation and subsequent updates.
 */
export async function upsertTheme(workspaceId: string, data: UpdateThemeBody) {
  const theme = await prisma.workspaceTheme.upsert({
    where: { workspaceId },
    create: {
      workspaceId,
      ...data,
    },
    update: data,
  });

  return {
    primaryColor: theme.primaryColor,
    accentColor: theme.accentColor,
    fontFamily: theme.fontFamily,
    borderRadius: theme.borderRadius,
    defaultMode: theme.defaultMode,
    logoUrl: theme.logoUrl,
    faviconUrl: theme.faviconUrl,
  };
}

/**
 * Upload a branding asset (logo or favicon) for a workspace.
 *
 * Flow:
 * 1. Delete the old asset from S3 if one exists
 * 2. Upload the new file to S3
 * 3. Upsert the WorkspaceTheme record with the new URL
 *
 * @param workspaceId - The workspace UUID
 * @param type - "logo" or "favicon"
 * @param file - The uploaded file (from multer)
 * @returns The updated theme with the new asset URL
 */
export async function uploadAsset(
  workspaceId: string,
  type: "logo" | "favicon",
  file: Express.Multer.File,
) {
  // Validate file size
  const maxSize = type === "logo" ? 2 * 1024 * 1024 : 500 * 1024;
  if (file.size > maxSize) {
    const maxLabel = type === "logo" ? "2MB" : "500KB";
    throw AppError.badRequest(`File size exceeds the ${maxLabel} limit`);
  }

  // Determine extension from mimetype
  const extMap: Record<string, string> = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/svg+xml": "svg",
    "image/webp": "webp",
    "image/x-icon": "ico",
    "image/vnd.microsoft.icon": "ico",
  };
  const ext = extMap[file.mimetype];
  if (!ext) {
    throw AppError.badRequest(
      `Unsupported file type: ${file.mimetype}. Allowed: PNG, JPG, SVG, WebP${type === "favicon" ? ", ICO" : ""}`,
    );
  }

  // Delete old asset from S3 if it exists
  const existing = await prisma.workspaceTheme.findUnique({
    where: { workspaceId },
  });

  const urlField = type === "logo" ? "logoUrl" : "faviconUrl";
  if (existing && existing[urlField]) {
    const oldKey = extractKeyFromUrl(existing[urlField]!);
    if (oldKey) {
      try {
        await deleteFile(oldKey);
      } catch (err) {
        logger.warn({ err, key: oldKey }, "Failed to delete old asset from S3");
      }
    }
  }

  // Upload new file
  const key = generateAssetKey(workspaceId, type, ext);
  const url = await uploadFile(file.buffer, key, file.mimetype);

  // Upsert the theme record with the new URL
  const theme = await prisma.workspaceTheme.upsert({
    where: { workspaceId },
    create: {
      workspaceId,
      [urlField]: url,
    },
    update: {
      [urlField]: url,
    },
  });

  return {
    primaryColor: theme.primaryColor,
    accentColor: theme.accentColor,
    fontFamily: theme.fontFamily,
    borderRadius: theme.borderRadius,
    defaultMode: theme.defaultMode,
    logoUrl: theme.logoUrl,
    faviconUrl: theme.faviconUrl,
  };
}

/**
 * Remove a branding asset (logo or favicon) from a workspace.
 * Deletes the file from S3 and clears the URL in the database.
 */
export async function removeAsset(
  workspaceId: string,
  type: "logo" | "favicon",
) {
  const theme = await prisma.workspaceTheme.findUnique({
    where: { workspaceId },
  });

  const urlField = type === "logo" ? "logoUrl" : "faviconUrl";

  if (theme && theme[urlField]) {
    const key = extractKeyFromUrl(theme[urlField]!);
    if (key) {
      try {
        await deleteFile(key);
      } catch (err) {
        logger.warn({ err }, "Failed to delete asset from S3");
      }
    }

    await prisma.workspaceTheme.update({
      where: { workspaceId },
      data: { [urlField]: null },
    });
  }

  return getTheme(workspaceId);
}
