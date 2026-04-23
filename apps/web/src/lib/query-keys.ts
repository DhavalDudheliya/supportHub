import type { ListTicketsParams } from "./services/ticket.service";

export const queryKeys = {
  // ── Tickets ──
  tickets: {
    all: ["tickets"] as const,
    lists: () => [...queryKeys.tickets.all, "list"] as const,
    list: (params: ListTicketsParams) =>
      [...queryKeys.tickets.lists(), params] as const,
    details: () => [...queryKeys.tickets.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.tickets.details(), id] as const,
  },

  // ── Customers ──
  customers: {
    all: ["customers"] as const,
    lists: () => [...queryKeys.customers.all, "list"] as const,
    list: (page?: number, limit?: number) =>
      [...queryKeys.customers.lists(), { page, limit }] as const,
    details: () => [...queryKeys.customers.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.customers.details(), id] as const,
  },

  // ── Email ──
  email: {
    all: ["email"] as const,
    status: () => [...queryKeys.email.all, "status"] as const,
  },

  // ── Workspace ──
  workspace: {
    all: ["workspace"] as const,
    theme: () => [...queryKeys.workspace.all, "theme"] as const,
  },

  // ── Invitations ──
  invitations: {
    all: ["invitations"] as const,
    pending: () => [...queryKeys.invitations.all, "pending"] as const,
  },

  // ── Reports ──
  reports: {
    all: ["reports"] as const,
    overview: (from?: string, to?: string) =>
      [...queryKeys.reports.all, "overview", { from, to }] as const,
    volume: (from?: string, to?: string) =>
      [...queryKeys.reports.all, "volume", { from, to }] as const,
    statusBreakdown: (from?: string, to?: string) =>
      [...queryKeys.reports.all, "status-breakdown", { from, to }] as const,
    agentPerformance: (from?: string, to?: string) =>
      [...queryKeys.reports.all, "agent-performance", { from, to }] as const,
    tagDistribution: (from?: string, to?: string) =>
      [...queryKeys.reports.all, "tags", { from, to }] as const,
  },
} as const;
