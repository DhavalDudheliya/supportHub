/**
 * Customer Module — Controller (Route Handlers)
 *
 * Thin controller layer — validates input and delegates to the service.
 * Express 5 auto-catches rejected promises and forwards to the global
 * error handler (no try/catch boilerplate needed).
 */

import { Request, Response } from "express";
import * as customerService from "./customer.service.js";
import { AuthenticatedRequest } from "../auth/auth.types.js";
import {
  createCustomerSchema,
  updateCustomerSchema,
} from "./customer.validation.js";

export async function create(req: Request, res: Response) {
  const authReq = req as AuthenticatedRequest;
  const data = createCustomerSchema.parse(req.body);
  const customer = await customerService.createCustomer(
    data,
    authReq.user!.workspaceId,
  );
  res.status(201).json(customer);
}

export async function list(req: Request, res: Response) {
  const authReq = req as AuthenticatedRequest;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 25;
  const result = await customerService.listCustomers(
    authReq.user!.workspaceId,
    page,
    limit,
  );
  res.status(200).json(result);
}

export async function get(req: Request, res: Response) {
  const authReq = req as AuthenticatedRequest;
  const customer = await customerService.getCustomer(
    req.params.id as string,
    authReq.user!.workspaceId,
  );
  res.status(200).json(customer);
}

export async function update(req: Request, res: Response) {
  const authReq = req as AuthenticatedRequest;
  const data = updateCustomerSchema.parse(req.body);
  const customer = await customerService.updateCustomer(
    req.params.id as string,
    data,
    authReq.user!.workspaceId,
  );
  res.status(200).json(customer);
}
