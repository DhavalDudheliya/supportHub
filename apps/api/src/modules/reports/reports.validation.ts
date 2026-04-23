import { z } from "zod";

export const reportQuerySchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
});

export type ReportQuery = z.infer<typeof reportQuerySchema>;
