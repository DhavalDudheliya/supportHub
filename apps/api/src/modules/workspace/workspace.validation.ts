/**
 * Workspace Module — Validation Schemas
 *
 * Zod schemas for workspace theme endpoints.
 * These schemas validate request bodies and serve as the single
 * source of truth for TypeScript types (inferred via z.infer).
 */

import { z } from "zod";

/**
 * Hex color validation — must be a valid 6-digit hex color.
 */
const hexColorSchema = z
  .string()
  .regex(/^#[0-9A-Fa-f]{6}$/, "Must be a valid hex color (e.g., #4F6BF0)");

/**
 * Curated list of Google Fonts available for workspace branding.
 * These are all free, open-source, and widely supported.
 */
export const ALLOWED_FONTS = [
  "Inter",
  "Roboto",
  "DM Sans",
  "Poppins",
  "Plus Jakarta Sans",
  "Outfit",
  "Nunito",
  "Lato",
  "Source Sans 3",
  "Open Sans",
] as const;

/**
 * Schema for updating workspace theme settings.
 * All fields are optional — only provided fields are updated.
 */
export const updateThemeSchema = z.object({
  primaryColor: hexColorSchema.optional(),
  accentColor: hexColorSchema.optional(),
  fontFamily: z.enum(ALLOWED_FONTS).optional(),
  borderRadius: z
    .number()
    .min(0, "Border radius cannot be negative")
    .max(1.5, "Border radius cannot exceed 1.5rem")
    .optional(),
  defaultMode: z.enum(["light", "dark", "system"]).optional(),
});
