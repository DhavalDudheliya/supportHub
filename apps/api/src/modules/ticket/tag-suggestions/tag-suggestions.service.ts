import prisma from "../../../lib/prisma.js";
import { AppError } from "../../../errors/index.js";

/**
 * Get all pending tag suggestions for a ticket
 */
export async function getSuggestions(ticketId: string, workspaceId: string) {
  // Verify ticket belongs to this workspace
  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    select: { workspaceId: true },
  });

  if (!ticket || ticket.workspaceId !== workspaceId) {
    throw AppError.notFound("Ticket not found");
  }

  return prisma.tagSuggestion.findMany({
    where: { ticketId },
    include: {
      tag: {
        select: { id: true, name: true, category: true },
      },
    },
    orderBy: { confidence: "desc" },
  });
}

/**
 * Accept or reject a tag suggestion
 */
export async function reviewSuggestion(
  ticketId: string,
  suggestionId: string,
  action: "accept" | "reject",
  userId: string,
  workspaceId: string,
) {
  // Verify suggestion exists and belongs to the right workspace
  const suggestion = await prisma.tagSuggestion.findUnique({
    where: { id: suggestionId },
    include: {
      ticket: { select: { workspaceId: true } },
      tag: { select: { id: true, name: true, category: true } },
    },
  });

  if (
    !suggestion ||
    suggestion.ticketId !== ticketId ||
    suggestion.ticket.workspaceId !== workspaceId
  ) {
    throw AppError.notFound("Suggestion not found");
  }

  const updated = await prisma.$transaction(async (tx) => {
    const { count } = await tx.tagSuggestion.updateMany({
      where: {
        id: suggestionId,
        ticketId,
        status: "PENDING",
      },
      data: {
        status: action === "accept" ? "ACCEPTED" : "REJECTED",
        reviewedBy: userId,
      },
    });

    if (count !== 1) {
      throw AppError.badRequest("Suggestion has already been reviewed");
    }

    if (action === "accept") {
      await tx.ticket.update({
        where: { id: ticketId },
        data: {
          tags: { connect: { id: suggestion.tagId } },
        },
      });
    }

    return tx.tagSuggestion.findUnique({
      where: { id: suggestionId },
      include: {
        tag: { select: { id: true, name: true, category: true } },
      },
    });
  });

  if (!updated) {
    // Should never reach here due to count !== 1 check
    throw AppError.badRequest("Failed to update suggestion");
  }

  return updated;
}
