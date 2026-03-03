/**
 * Central Route Registry
 *
 * Aggregates all feature module routes and mounts them under the /api prefix.
 * When adding a new module, simply import its router and add an entry here —
 * keeps index.ts clean and focused on app configuration.
 *
 * @example Adding a new module:
 * ```ts
 * import ticketRoutes from "./modules/ticket/ticket.routes.js";
 * router.use("/tickets", ticketRoutes);
 * ```
 */

import { Router, type IRouter } from "express";
import authRoutes from "./modules/auth/auth.routes.js";

const router: IRouter = Router();

// --- v1 Routes ---
router.use("/v1/auth", authRoutes);

export default router;
