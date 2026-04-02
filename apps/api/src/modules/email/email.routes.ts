/**
 * Email Routes
 *
 * Defines all endpoints for the email integration module:
 * - OAuth connect/callback flows (Gmail & Outlook)
 * - Connection status and disconnect
 * - Webhook endpoints for inbound email notifications
 *
 * Webhook endpoints are NOT behind auth middleware — they receive
 * push notifications from Google/Microsoft servers directly.
 */

import { Router, type IRouter } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import {
  connectGmail,
  gmailCallback,
  connectOutlook,
  outlookCallback,
  getStatus,
  disconnect,
} from "./email.controller.js";
import {
  handleGmailWebhook,
  handleOutlookWebhook,
} from "./webhook.controller.js";

const router: IRouter = Router();

// --- Authenticated routes (require JWT) ---
router.get("/gmail/connect", authMiddleware, connectGmail);
router.get("/outlook/connect", authMiddleware, connectOutlook);
router.get("/status", authMiddleware, getStatus);
router.post("/disconnect/:provider", authMiddleware, disconnect);

// --- OAuth callbacks (no auth — user is redirected here by the provider) ---
router.get("/gmail/callback", gmailCallback);
router.get("/outlook/callback", outlookCallback);

// --- Webhook endpoints (no auth — called by Google/Microsoft servers) ---
router.post("/webhook/gmail", handleGmailWebhook);
router.post("/webhook/outlook", handleOutlookWebhook);

export default router;
