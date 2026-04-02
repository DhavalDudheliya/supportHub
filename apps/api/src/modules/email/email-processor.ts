/**
 * Email Processor
 *
 * Core processing pipeline for inbound emails. Every email — whether from
 * Gmail or Outlook — flows through this unified pipeline:
 *
 * 1. Deduplication   — Skip if Message-ID already processed
 * 2. Thread detection — Check References/In-Reply-To for existing tickets
 * 3. Customer ID     — Find or create customer by sender email
 * 4. Ticket/Reply    — Create new ticket or append reply to existing
 * 5. Real-time emit  — Push event to connected dashboard clients
 */

import prisma from "../../lib/prisma.js";
import { emitTicketEvent } from "../../lib/socket.js";
import logger from "../../lib/logger.js";

/** Unified email data shape from both Gmail and Outlook parsers */
export interface InboundEmail {
  messageId: string; // RFC 2822 Message-ID header
  from: { name: string; email: string };
  subject: string;
  bodyPlain: string;
  bodyHtml: string;
  references: string | null; // Space-separated Message-IDs
  inReplyTo: string | null; // Single Message-ID
  date: Date;
  workspaceId: string;
}

/**
 * Process a single inbound email through the full pipeline.
 * Returns true if the email was processed (new ticket or reply created),
 * false if it was skipped (duplicate).
 */
export async function processInboundEmail(
  email: InboundEmail,
): Promise<boolean> {
  const { messageId, from, subject, bodyPlain, bodyHtml, workspaceId } = email;

  // ── Step 1: Deduplication ──
  const existing = await prisma.emailMessage.findUnique({
    where: { messageId_workspaceId: { messageId, workspaceId } },
  });

  if (existing) {
    logger.info(
      { messageId, workspaceId },
      "Duplicate email — already processed, skipping",
    );
    return false;
  }

  // ── Step 2: Thread Detection ──
  const existingTicketId = await detectThread(email);

  // ── Step 3: Customer Identification ──
  const customer = await findOrCreateCustomer(
    from.email,
    from.name,
    workspaceId,
  );

  // ── Step 4: Create ticket or append reply ──
  if (existingTicketId) {
    await appendReplyToTicket(existingTicketId, email, customer.id);
  } else {
    await createTicketFromEmail(email, customer.id);
  }

  return true;
}

/**
 * Detect if this email is a reply to an existing ticket.
 * Checks both In-Reply-To and References headers against stored EmailMessages.
 *
 * Returns the ticketId if a match is found, null otherwise.
 */
async function detectThread(email: InboundEmail): Promise<string | null> {
  const { inReplyTo, references, workspaceId } = email;

  // Collect all Message-IDs to search for
  const referencedIds: string[] = [];

  if (inReplyTo) {
    referencedIds.push(inReplyTo.trim());
  }

  if (references) {
    // References header is space-separated list of Message-IDs
    const parsed = references
      .split(/\s+/)
      .map((id) => id.trim())
      .filter(Boolean);
    referencedIds.push(...parsed);
  }

  if (referencedIds.length === 0) {
    return null;
  }

  // Deduplicate
  const uniqueIds = [...new Set(referencedIds)];

  // Look for any of these Message-IDs in our processed emails
  const match = await prisma.emailMessage.findFirst({
    where: {
      workspaceId,
      messageId: { in: uniqueIds },
    },
    select: { ticketId: true },
    orderBy: { createdAt: "desc" }, // Most recent match
  });

  if (match) {
    logger.info(
      { ticketId: match.ticketId, matchedIds: uniqueIds },
      "Thread detected — email is a reply to existing ticket",
    );
  }

  return match?.ticketId || null;
}

/**
 * Find an existing customer or create a new one.
 */
async function findOrCreateCustomer(
  email: string,
  name: string,
  workspaceId: string,
) {
  const customer = await prisma.customer.upsert({
    where: { email_workspaceId: { email, workspaceId } },
    update: {}, // No update needed if exists
    create: {
      email,
      name: name || email.split("@")[0] || "Unknown",
      workspaceId,
    },
  });

  return customer;
}

/**
 * Generate the next incremental ticket number for a workspace.
 */
async function getNextTicketNumber(workspaceId: string): Promise<number> {
  const last = await prisma.ticket.findFirst({
    where: { workspaceId },
    orderBy: { ticketNumber: "desc" },
    select: { ticketNumber: true },
  });
  return (last?.ticketNumber ?? 0) + 1;
}

/**
 * Create a new ticket from an inbound email (new conversation).
 */
async function createTicketFromEmail(
  email: InboundEmail,
  customerId: string,
): Promise<void> {
  const { messageId, subject, bodyPlain, bodyHtml, references, workspaceId } =
    email;

  const ticketNumber = await getNextTicketNumber(workspaceId);

  // Use plain text body if available, otherwise fallback to HTML
  const description = bodyPlain || bodyHtml || "(No content)";

  const ticket = await prisma.ticket.create({
    data: {
      ticketNumber,
      subject: subject || "(No subject)",
      description,
      source: "EMAIL",
      customerId,
      workspaceId,
      // Create the EmailMessage record in the same transaction
      emailMessages: {
        create: {
          messageId,
          references,
          workspaceId,
        },
      },
    },
    include: {
      customer: { select: { id: true, name: true, email: true } },
    },
  });

  logger.info(
    {
      ticketId: ticket.id,
      ticketNumber: ticket.ticketNumber,
      messageId,
      workspaceId,
    },
    "New ticket created from inbound email",
  );

  // ── Step 5: Real-time emit ──
  emitTicketEvent(workspaceId, "ticket:created", {
    ticket: {
      id: ticket.id,
      ticketNumber: ticket.ticketNumber,
      subject: ticket.subject,
      status: ticket.status,
      priority: ticket.priority,
      source: ticket.source,
      customer: ticket.customer,
      createdAt: ticket.createdAt,
    },
  });
}

/**
 * Append a reply to an existing ticket (continuation of email thread).
 */
async function appendReplyToTicket(
  ticketId: string,
  email: InboundEmail,
  customerId: string,
): Promise<void> {
  const { messageId, bodyPlain, bodyHtml, references, workspaceId } = email;

  const body = bodyPlain || bodyHtml || "(No content)";

  // Check if the ticket is resolved/closed — reopen it since customer replied
  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    select: { status: true, ticketNumber: true },
  });

  const shouldReopen =
    ticket?.status === "SOLVED" || ticket?.status === "CLOSED";

  // Update ticket and create the email record
  await prisma.$transaction([
    // Store the email message record for deduplication/threading
    prisma.emailMessage.create({
      data: {
        messageId,
        references,
        ticketId,
        workspaceId,
      },
    }),
    // Update the ticket's timestamp (and reopen if necessary)
    prisma.ticket.update({
      where: { id: ticketId },
      data: {
        updatedAt: new Date(),
        ...(shouldReopen ? { status: "OPEN" } : {}),
      },
    }),
  ]);

  logger.info(
    {
      ticketId,
      ticketNumber: ticket?.ticketNumber,
      messageId,
      reopened: shouldReopen,
    },
    "Reply appended to existing ticket from inbound email",
  );

  // ── Step 5: Real-time emit ──
  emitTicketEvent(workspaceId, "ticket:reply", {
    ticketId,
    reply: {
      body,
      source: "EMAIL",
      customerId,
      createdAt: new Date(),
    },
    reopened: shouldReopen,
  });

  if (shouldReopen) {
    emitTicketEvent(workspaceId, "ticket:updated", {
      ticketId,
      changes: { status: "OPEN" },
    });
  }
}
