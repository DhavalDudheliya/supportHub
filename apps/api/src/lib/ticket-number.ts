/**
 * Per-workspace ticket number allocation.
 *
 * `ticketNumber` is a human-friendly, per-workspace sequence (#1, #2, …) backed
 * by the `@@unique([ticketNumber, workspaceId])` constraint on `Ticket`.
 *
 * The naive `MAX(ticketNumber) + 1` read-then-insert has a race: two concurrent
 * creations in the same workspace read the same MAX and both try to insert the
 * same number. Under a single process this was masked by the event loop; once the
 * email/AI work runs in multiple worker replicas (Tier 2) it becomes a real
 * collision.
 *
 * Fix: optimistic concurrency. We compute the next number and attempt the insert;
 * if the unique constraint rejects it (Prisma `P2002`), another writer won the
 * number — we recompute and retry. This needs no schema change and stays correct
 * across any number of processes. (A Postgres sequence per workspace would also
 * work but requires migrations and dynamic DDL; the retry loop is simpler and the
 * contention window is tiny.)
 */

import prisma from "./prisma.js";

const MAX_ATTEMPTS = 5;

/** Compute the next ticket number for a workspace (not collision-safe on its own). */
export async function peekNextTicketNumber(
  workspaceId: string,
): Promise<number> {
  const last = await prisma.ticket.findFirst({
    where: { workspaceId },
    orderBy: { ticketNumber: "desc" },
    select: { ticketNumber: true },
  });
  return (last?.ticketNumber ?? 0) + 1;
}

/**
 * Duck-typed check for a Prisma unique-constraint violation on `ticketNumber`.
 * We avoid importing the Prisma error class (matches `error-handler.middleware.ts`).
 */
function isTicketNumberConflict(err: unknown): boolean {
  if (typeof err !== "object" || err === null || !("code" in err)) return false;
  if ((err as Record<string, unknown>).code !== "P2002") return false;
  const target = (err as { meta?: { target?: unknown } }).meta?.target;
  // target is typically ["ticketNumber", "workspaceId"]; if absent, retry anyway.
  return Array.isArray(target) ? target.includes("ticketNumber") : true;
}

/**
 * Create a ticket with a collision-safe per-workspace number.
 *
 * `create` receives the candidate number and performs the actual
 * `prisma.ticket.create(...)`. It is retried with a fresh number if the insert
 * loses the race on the `ticketNumber` unique constraint.
 */
export async function createWithTicketNumber<T>(
  workspaceId: string,
  create: (ticketNumber: number) => Promise<T>,
): Promise<T> {
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const ticketNumber = await peekNextTicketNumber(workspaceId);
    try {
      return await create(ticketNumber);
    } catch (err) {
      if (isTicketNumberConflict(err) && attempt < MAX_ATTEMPTS) {
        continue; // another writer took this number — recompute and retry
      }
      throw err;
    }
  }
  // Unreachable: the loop either returns or throws on the last attempt.
  throw new Error(
    `Failed to allocate a unique ticketNumber for workspace ${workspaceId} after ${MAX_ATTEMPTS} attempts`,
  );
}
