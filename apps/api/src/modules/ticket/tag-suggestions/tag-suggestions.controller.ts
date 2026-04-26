/**
 * Tag Suggestions — Controller (Route Handlers)
 *
 * Thin controller layer — validates input and delegates to the service.
 */

import { Request, Response } from "express";
import { z } from "zod";
import * as tagSuggestionService from "./tag-suggestions.service.js";
import { AuthenticatedRequest } from "../../auth/auth.types.js";

const actionSchema = z.object({
  action: z.enum(["accept", "reject"]),
});

export async function list(req: Request, res: Response) {
  const authReq = req as AuthenticatedRequest;
  const ticketId = req.params.id as string;

  const suggestions = await tagSuggestionService.getSuggestions(
    ticketId,
    authReq.user!.workspaceId,
  );

  res.status(200).json(suggestions);
}

export async function review(req: Request, res: Response) {
  const authReq = req as AuthenticatedRequest;
  const { id: ticketId, suggestionId } = req.params as {
    id: string;
    suggestionId: string;
  };
  const { action } = actionSchema.parse(req.body);

  const updated = await tagSuggestionService.reviewSuggestion(
    ticketId,
    suggestionId,
    action,
    authReq.user!.userId,
    authReq.user!.workspaceId,
  );

  res.status(200).json(updated);
}
