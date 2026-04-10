/**
 * Workspace Module — Type Definitions
 *
 * TypeScript types inferred from Zod schemas,
 * keeping validation rules and types in sync.
 */

import { z } from "zod";
import { updateThemeSchema } from "./workspace.validation.js";

/** Inferred from updateThemeSchema */
export type UpdateThemeBody = z.infer<typeof updateThemeSchema>;
