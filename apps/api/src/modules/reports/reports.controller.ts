/**
 * Reports Module — Controller (Route Handlers)
 *
 * Thin controller layer — validates query params and delegates to the service.
 */

import { Request, Response } from "express";
import * as reportsService from "./reports.service.js";
import { AuthenticatedRequest } from "../auth/auth.types.js";
import { reportQuerySchema } from "./reports.validation.js";

export async function overview(req: Request, res: Response) {
  const authReq = req as AuthenticatedRequest;
  const { from, to } = reportQuerySchema.parse(req.query);
  const data = await reportsService.getOverview(
    authReq.user!.workspaceId,
    from,
    to,
  );
  res.status(200).json(data);
}

export async function volume(req: Request, res: Response) {
  const authReq = req as AuthenticatedRequest;
  const { from, to } = reportQuerySchema.parse(req.query);
  const data = await reportsService.getVolume(
    authReq.user!.workspaceId,
    from,
    to,
  );
  res.status(200).json(data);
}

export async function statusBreakdown(req: Request, res: Response) {
  const authReq = req as AuthenticatedRequest;
  const { from, to } = reportQuerySchema.parse(req.query);
  const data = await reportsService.getStatusBreakdown(
    authReq.user!.workspaceId,
    from,
    to,
  );
  res.status(200).json(data);
}

export async function agentPerformance(req: Request, res: Response) {
  const authReq = req as AuthenticatedRequest;
  const { from, to } = reportQuerySchema.parse(req.query);
  const data = await reportsService.getAgentPerformance(
    authReq.user!.workspaceId,
    from,
    to,
  );
  res.status(200).json(data);
}

export async function tagDistribution(req: Request, res: Response) {
  const authReq = req as AuthenticatedRequest;
  const { from, to } = reportQuerySchema.parse(req.query);
  const data = await reportsService.getTagDistribution(
    authReq.user!.workspaceId,
    from,
    to,
  );
  res.status(200).json(data);
}
