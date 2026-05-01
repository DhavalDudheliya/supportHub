/**
 * Invitation Module — Controller (Route Handlers)
 *
 * Thin controller layer — validates input and delegates to the service.
 * Express 5 auto-catches rejected promises and forwards to the global
 * error handler (no try/catch boilerplate needed).
 */

import { Request, Response } from "express";
import * as invitationService from "./invitation.service.js";
import { AuthenticatedRequest } from "../auth/auth.types.js";
import { AppError } from "../../errors/index.js";
import {
  acceptInvitationSchema,
  inviteAgentSchema,
} from "./invitation.validation.js";

export async function inviteAgent(req: Request, res: Response) {
  const authReq = req as AuthenticatedRequest;

  // Only admins can invite
  if (authReq.user?.role !== "ADMIN") {
    throw AppError.forbidden("Only admins can invite new agents");
  }

  const data = inviteAgentSchema.parse(req.body);
  const invitation = await invitationService.createInvitation(
    data,
    authReq.user.workspaceId,
    authReq.user.userId,
  );

  res.status(201).json({
    message: "Invitation sent successfully",
    invitation,
  });
}

export async function getInvitations(req: Request, res: Response) {
  const authReq = req as AuthenticatedRequest;

  // Only admins can view invitations
  if (authReq.user?.role !== "ADMIN") {
    throw AppError.forbidden("Only admins can view invitations");
  }

  const invitations = await invitationService.getPendingInvitations(
    authReq.user.workspaceId,
  );

  res.status(200).json(invitations);
}

export async function getTeamAgents(req: Request, res: Response) {
  const authReq = req as AuthenticatedRequest;

  if (authReq.user?.role !== "ADMIN") {
    throw AppError.forbidden("Only admins can view team agents");
  }

  const agents = await invitationService.getTeamAgents(
    authReq.user.workspaceId,
  );

  res.status(200).json(agents);
}

export async function revokeInvitation(req: Request, res: Response) {
  const authReq = req as AuthenticatedRequest;
  const id = req.params.id as string;

  // Only admins can revoke invitations
  if (authReq.user?.role !== "ADMIN") {
    throw AppError.forbidden("Only admins can revoke invitations");
  }

  const result = await invitationService.revokeInvitation(
    id,
    authReq.user.workspaceId,
  );

  res.status(200).json(result);
}

export async function acceptInvitation(req: Request, res: Response) {
  const data = acceptInvitationSchema.parse(req.body);
  const user = await invitationService.acceptInvitation(data);

  res.status(200).json({
    message: "Invitation accepted successfully",
    userId: user.id,
  });
}
