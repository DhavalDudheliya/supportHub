/**
 * Central Route Registry
 *
 * Aggregates all feature module routes and mounts them under the /api prefix.
 * When adding a new module, simply import its router and add an entry here —
 * keeps index.ts clean and focused on app configuration.
 */

import { Router, type IRouter } from "express";
import authRoutes from "./modules/auth/auth.routes.js";
import invitationRoutes from "./modules/invitation/invitation.routes.js";
import customerRoutes from "./modules/customer/customer.routes.js";
import ticketRoutes from "./modules/ticket/ticket.routes.js";
import tagSuggestionRoutes from "./modules/ticket/tag-suggestions/tag-suggestions.routes.js";
import emailRoutes from "./modules/email/email.routes.js";
import workspaceRoutes from "./modules/workspace/workspace.routes.js";
import rulesRoutes from "./modules/rules/rules.routes.js";
import aiLogsRoutes from "./modules/rules/ai-logs.routes.js";
import reportsRoutes from "./modules/reports/reports.routes.js";

const router: IRouter = Router();

// --- v1 Routes ---
router.use("/v1/auth", authRoutes);
router.use("/v1/invitations", invitationRoutes);
router.use("/v1/customers", customerRoutes);
router.use("/v1/tickets", ticketRoutes);
router.use("/v1/tickets", tagSuggestionRoutes); // Tag suggestion sub-routes (/tickets/:id/suggestions)
router.use("/v1/email", emailRoutes);
router.use("/v1/workspace", workspaceRoutes);
router.use("/v1/rules", rulesRoutes);
router.use("/v1/ai-logs", aiLogsRoutes);
router.use("/v1/reports", reportsRoutes);

export default router;
