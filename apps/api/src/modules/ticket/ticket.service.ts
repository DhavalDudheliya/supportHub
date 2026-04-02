import prisma from "../../lib/prisma.js";
import {
  CreateTicketInput,
  UpdateTicketInput,
  AddCommentInput,
  ListTicketsQuery,
} from "./ticket.types.js";

/** Generate the next incremental ticket number for a workspace. */
async function getNextTicketNumber(workspaceId: string): Promise<number> {
  const last = await prisma.ticket.findFirst({
    where: { workspaceId },
    orderBy: { ticketNumber: "desc" },
    select: { ticketNumber: true },
  });
  return (last?.ticketNumber ?? 0) + 1;
}

export async function createTicket(
  data: CreateTicketInput,
  workspaceId: string,
) {
  const ticketNumber = await getNextTicketNumber(workspaceId);

  // Handle tags — find-or-create by name within the workspace
  let tagConnections: { id: string }[] = [];
  if (data.tags && data.tags.length > 0) {
    const tagRecords = await Promise.all(
      data.tags.map((name) =>
        prisma.tag.upsert({
          where: { name_workspaceId: { name, workspaceId } },
          update: {},
          create: { name, workspaceId },
        }),
      ),
    );
    tagConnections = tagRecords.map((t) => ({ id: t.id }));
  }

  return prisma.ticket.create({
    data: {
      ticketNumber,
      subject: data.subject,
      description: data.description,
      priority: data.priority ?? "MEDIUM",
      customerId: data.customerId,
      assigneeId: data.assigneeId,
      workspaceId,
      tags: { connect: tagConnections },
    },
    include: {
      customer: true,
      assignee: true,
      tags: true,
    },
  });
}

export async function listTickets(
  workspaceId: string,
  query: ListTicketsQuery,
) {
  const { page, limit, status, priority, assigneeId, view } = query;
  const skip = (page - 1) * limit;

  // Build filter
  const where: any = { workspaceId };

  if (status) where.status = status;
  if (priority) where.priority = priority;
  if (assigneeId) where.assigneeId = assigneeId;

  // Predefined views
  switch (view) {
    case "unsolved":
      where.status = { in: ["OPEN", "PENDING"] };
      break;
    case "unassigned":
      where.assigneeId = null;
      where.status = { in: ["OPEN", "PENDING"] };
      break;
    case "recent":
      // Just use default ordering
      break;
    case "all":
    default:
      break;
  }

  const [tickets, total] = await Promise.all([
    prisma.ticket.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip,
      take: limit,
      include: {
        customer: { select: { id: true, name: true, email: true } },
        assignee: {
          select: { id: true, firstName: true, lastName: true },
        },
        tags: { select: { id: true, name: true } },
        _count: { select: { comments: true } },
      },
    }),
    prisma.ticket.count({ where }),
  ]);

  return { tickets, total, page, limit };
}

export async function getTicket(id: string, workspaceId: string) {
  const ticket = await prisma.ticket.findUnique({
    where: { id },
    include: {
      customer: true,
      assignee: {
        select: { id: true, firstName: true, lastName: true, email: true },
      },
      tags: true,
      comments: {
        orderBy: { createdAt: "asc" },
        include: {
          author: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
      },
    },
  });

  if (!ticket || ticket.workspaceId !== workspaceId) {
    throw { status: 404, message: "Ticket not found" };
  }

  return ticket;
}

export async function updateTicket(
  id: string,
  data: UpdateTicketInput,
  workspaceId: string,
) {
  const ticket = await prisma.ticket.findUnique({ where: { id } });

  if (!ticket || ticket.workspaceId !== workspaceId) {
    throw { status: 404, message: "Ticket not found" };
  }

  const { tags, ...updateData } = data;

  const tagOps: any = {};
  if (tags !== undefined) {
    // Find-or-create each tag, then set the relation (replaces existing)
    const tagRecords = await Promise.all(
      tags.map((name) =>
        prisma.tag.upsert({
          where: { name_workspaceId: { name, workspaceId } },
          update: {},
          create: { name, workspaceId },
        }),
      ),
    );
    tagOps.set = tagRecords.map((t) => ({ id: t.id }));
  }

  return prisma.ticket.update({
    where: { id },
    data: {
      ...updateData,
      tags: tagOps,
    },
    include: {
      customer: true,
      assignee: {
        select: { id: true, firstName: true, lastName: true },
      },
      tags: true,
    },
  });
}

export async function deleteTicket(id: string, workspaceId: string) {
  const ticket = await prisma.ticket.findUnique({ where: { id } });

  if (!ticket || ticket.workspaceId !== workspaceId) {
    throw { status: 404, message: "Ticket not found" };
  }

  // Delete comments first (cascade), then the ticket in a transaction
  await prisma.$transaction([
    prisma.ticketComment.deleteMany({ where: { ticketId: id } }),
    prisma.ticket.delete({ where: { id } }),
  ]);

  return { message: "Ticket deleted successfully" };
}

export async function addComment(
  ticketId: string,
  data: AddCommentInput,
  authorId: string,
  workspaceId: string,
) {
  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });

  if (!ticket || ticket.workspaceId !== workspaceId) {
    throw { status: 404, message: "Ticket not found" };
  }

  const comment = await prisma.ticketComment.create({
    data: {
      body: data.body,
      isInternal: data.isInternal ?? false,
      ticketId,
      authorId,
    },
    include: {
      author: {
        select: { id: true, firstName: true, lastName: true },
      },
    },
  });

  // Touch the ticket's updatedAt
  await prisma.ticket.update({
    where: { id: ticketId },
    data: { updatedAt: new Date() },
  });

  return comment;
}
