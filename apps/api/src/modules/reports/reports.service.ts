/**
 * Reports Module — Service Layer
 *
 * Provides aggregate queries over existing Ticket, TicketComment, and Tag
 * models to power the reporting dashboard. No new tables required.
 */

import prisma from "../../lib/prisma.js";

/** Parse date-range params, defaulting to the last 7 days. */
function parseDateRange(from?: string, to?: string) {
  const toDate = to ? new Date(to) : new Date();
  const fromDate = from
    ? new Date(from)
    : new Date(toDate.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Ensure "to" extends to end of UTC day
  toDate.setUTCHours(23, 59, 59, 999);
  fromDate.setUTCHours(0, 0, 0, 0);

  return { fromDate, toDate };
}

/**
 * Overview — high-level summary stats for the workspace.
 */
export async function getOverview(
  workspaceId: string,
  from?: string,
  to?: string,
) {
  const { fromDate, toDate } = parseDateRange(from, to);

  const dateFilter = { workspaceId, createdAt: { gte: fromDate, lte: toDate } };

  const [total, open, pending, solved, closed] = await Promise.all([
    prisma.ticket.count({ where: dateFilter }),
    prisma.ticket.count({ where: { ...dateFilter, status: "OPEN" } }),
    prisma.ticket.count({ where: { ...dateFilter, status: "PENDING" } }),
    prisma.ticket.count({ where: { ...dateFilter, status: "SOLVED" } }),
    prisma.ticket.count({ where: { ...dateFilter, status: "CLOSED" } }),
  ]);

  // Average resolution time (for solved/closed tickets in the range)
  const resolvedTickets = await prisma.ticket.findMany({
    where: {
      workspaceId,
      status: { in: ["SOLVED", "CLOSED"] },
      createdAt: { gte: fromDate, lte: toDate },
    },
    select: { createdAt: true, updatedAt: true },
  });

  let avgResolutionMs = 0;
  if (resolvedTickets.length > 0) {
    const totalMs = resolvedTickets.reduce(
      (sum, t) => sum + (t.updatedAt.getTime() - t.createdAt.getTime()),
      0,
    );
    avgResolutionMs = totalMs / resolvedTickets.length;
  }
  const avgResolutionHours = Math.round(avgResolutionMs / (1000 * 60 * 60));

  return {
    total,
    open,
    pending,
    solved,
    closed,
    avgResolutionHours,
  };
}

/**
 * Volume — ticket count bucketed by day over the date range.
 */
export async function getVolume(
  workspaceId: string,
  from?: string,
  to?: string,
) {
  const { fromDate, toDate } = parseDateRange(from, to);

  const tickets = await prisma.ticket.findMany({
    where: {
      workspaceId,
      createdAt: { gte: fromDate, lte: toDate },
    },
    select: { createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  // Bucket into days
  const buckets: Record<string, number> = {};

  // Pre-fill all days in range with 0
  const cursor = new Date(fromDate);
  while (cursor <= toDate) {
    const key = cursor.toISOString().split("T")[0]!;
    buckets[key] = 0;
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  for (const ticket of tickets) {
    const key = ticket.createdAt.toISOString().split("T")[0]!;
    buckets[key] = (buckets[key] ?? 0) + 1;
  }

  return Object.entries(buckets).map(([date, count]) => ({ date, count }));
}

/**
 * Status Breakdown — ticket count per status.
 */
export async function getStatusBreakdown(
  workspaceId: string,
  from?: string,
  to?: string,
) {
  const { fromDate, toDate } = parseDateRange(from, to);

  const result = await prisma.ticket.groupBy({
    by: ["status"],
    where: {
      workspaceId,
      createdAt: { gte: fromDate, lte: toDate },
    },
    _count: { _all: true },
  });

  return result.map((r) => ({
    status: r.status,
    count: r._count._all,
  }));
}

/**
 * Agent Performance — tickets handled per agent.
 */
export async function getAgentPerformance(
  workspaceId: string,
  from?: string,
  to?: string,
) {
  const { fromDate, toDate } = parseDateRange(from, to);

  const result = await prisma.ticket.groupBy({
    by: ["assigneeId"],
    where: {
      workspaceId,
      assigneeId: { not: null },
      createdAt: { gte: fromDate, lte: toDate },
    },
    _count: { _all: true },
  });

  // Enrich with agent names
  const agentIds = result
    .map((r) => r.assigneeId)
    .filter((id): id is string => id !== null);

  const agents = await prisma.user.findMany({
    where: { id: { in: agentIds } },
    select: { id: true, firstName: true, lastName: true },
  });

  const agentMap = new Map(agents.map((a) => [a.id, a]));

  return result
    .map((r) => {
      const agent = agentMap.get(r.assigneeId!);
      return {
        agentId: r.assigneeId!,
        name: agent ? `${agent.firstName} ${agent.lastName}` : "Unknown",
        count: r._count._all,
      };
    })
    .sort((a, b) => b.count - a.count);
}

/**
 * Tag Distribution — top tags by ticket count.
 */
export async function getTagDistribution(
  workspaceId: string,
  from?: string,
  to?: string,
) {
  const { fromDate, toDate } = parseDateRange(from, to);

  const tags = await prisma.tag.findMany({
    where: { workspaceId },
    select: {
      id: true,
      name: true,
      category: true,
      _count: {
        select: {
          tickets: {
            where: {
              createdAt: { gte: fromDate, lte: toDate },
            },
          },
        },
      },
    },
  });

  return tags
    .map((t) => ({
      name: t.name,
      category: t.category,
      count: t._count.tickets,
    }))
    .filter((t) => t.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}
