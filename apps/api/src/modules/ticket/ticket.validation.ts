import { z } from "zod";

export const createTicketSchema = z.object({
  subject: z.string().trim().min(1, "Subject is required"),
  description: z.string().trim().min(1, "Description is required"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  customerId: z.string().uuid("Invalid customer ID"),
  assigneeId: z.string().uuid("Invalid assignee ID").optional(),
  tags: z.array(z.string()).optional(),
});

export const updateTicketSchema = z.object({
  subject: z.string().trim().min(1).optional(),
  description: z.string().trim().min(1).optional(),
  status: z.enum(["OPEN", "PENDING", "SOLVED", "CLOSED"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  assigneeId: z.string().uuid().nullable().optional(),
  tags: z.array(z.string()).optional(),
});

export const addCommentSchema = z.object({
  body: z.string().trim().min(1, "Comment body is required"),
  isInternal: z.boolean().optional(),
});

export const listTicketsQuerySchema = z.object({
  status: z.enum(["OPEN", "PENDING", "SOLVED", "CLOSED"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  assigneeId: z.string().uuid("Invalid assignee ID").optional(),
  view: z
    .enum(["unsolved", "unassigned", "all", "recent"])
    .optional()
    .default("all"),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(25),
});
