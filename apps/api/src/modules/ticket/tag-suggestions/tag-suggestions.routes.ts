/**
 * Tag Suggestions — Router
 *
 * Endpoints for agents to view and act on AI-suggested tags.
 * When the AI's confidence is below 70%, tags are shown as suggestions
 * for the agent to accept or reject with one click.
 */

import { Router, type IRouter } from "express";
import { authMiddleware } from "../../../middlewares/auth.middleware.js";
import * as tagSuggestionController from "./tag-suggestions.controller.js";

const router: IRouter = Router();

router.use(authMiddleware);

/** Get all pending tag suggestions for a ticket */
router.get("/:id/suggestions", tagSuggestionController.list);

/** Accept or reject a tag suggestion */
router.patch("/:id/suggestions/:suggestionId", tagSuggestionController.review);

export default router;
