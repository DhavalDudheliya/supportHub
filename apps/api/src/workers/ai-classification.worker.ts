/**
 * AI Classification Worker — BullMQ Background Processor
 *
 * Consumes jobs from the "ai-classification" queue.
 * Each job represents a newly created ticket that needs AI tagging
 * and automatic assignment.
 *
 * The worker:
 * 1. Calls Gemini to classify the ticket content
 * 2. Applies high-confidence tags (≥70%) directly to the ticket
 * 3. Creates TagSuggestion records for low-confidence tags (<70%)
 * 4. Runs the assignment rule engine
 * 5. Updates the ticket with assignee + AI-determined priority
 * 6. Creates an AIDecisionLog audit entry
 * 7. Emits Socket.IO events for real-time dashboard updates
 */

import { Worker, Job } from "bullmq";
import redis from "../lib/redis.js";
import prisma from "../lib/prisma.js";
import { emitTicketEvent } from "../lib/socket.js";
import logger from "../lib/logger.js";
import type { AIClassificationJobData } from "../lib/queue.js";
import type {
  TagCategory,
  TicketPriority,
} from "../../generated/prisma/client.js";
import {
  classifyTicket,
  CONFIDENCE_THRESHOLD,
  type ClassifiedTag,
} from "../services/gemini.service.js";
import { runAssignmentEngine } from "../services/assignment-engine.js";

let worker: Worker<AIClassificationJobData> | null = null;

/**
 * Start the BullMQ worker that processes AI classification jobs.
 * Should be called once during server startup.
 */
export function startAIClassificationWorker(): void {
  worker = new Worker<AIClassificationJobData>(
    "ai-classification",
    async (job: Job<AIClassificationJobData>) => {
      const { ticketId, subject, bodyPlain, workspaceId } = job.data;

      logger.info(
        { ticketId, workspaceId, jobId: job.id },
        "Processing AI classification job",
      );

      const startTime = Date.now();

      try {
        await processClassification(
          ticketId,
          subject,
          bodyPlain,
          workspaceId,
          startTime,
        );
      } catch (err) {
        logger.error(
          { err, ticketId, workspaceId },
          "Failed to process AI classification job",
        );
        throw err; // Re-throw to trigger BullMQ retry
      }
    },
    {
      connection: redis,
      concurrency: 3, // Limit parallel Gemini calls
      limiter: {
        max: 15,
        duration: 60000, // Max 15 jobs per minute
      },
    },
  );

  worker.on("completed", (job) => {
    logger.info({ jobId: job?.id }, "AI classification job completed");
  });

  worker.on("failed", (job, err) => {
    logger.error(
      { jobId: job?.id, err: err.message, attempts: job?.attemptsMade },
      "AI classification job failed",
    );
  });

  logger.info("AI classification worker started");
}

/**
 * Core classification pipeline for a single ticket.
 */
async function processClassification(
  ticketId: string,
  subject: string,
  bodyPlain: string,
  workspaceId: string,
  startTime: number,
): Promise<void> {
  // ── Step 1: Call Gemini ──
  const classification = await classifyTicket(subject, bodyPlain);
  const processingMs = Date.now() - startTime;

  if (!classification) {
    // Gemini failed or not configured — log and bail gracefully
    logger.warn(
      { ticketId, workspaceId },
      "AI classification returned null — ticket will remain untagged",
    );

    await prisma.aIDecisionLog.create({
      data: {
        ticketId,
        rawResponse: {},
        tagsApplied: [],
        tagsSuggested: [],
        processingMs,
        modelVersion: "gemini-2.0-flash",
        workspaceId,
      },
    });

    return;
  }

  const { result, rawResponse } = classification;

  // ── Step 2: Split tags into auto-apply vs. suggestions ──
  const highConfTags: ClassifiedTag[] = [];
  const lowConfTags: ClassifiedTag[] = [];

  for (const tag of result.tags) {
    if (tag.confidence >= CONFIDENCE_THRESHOLD) {
      highConfTags.push(tag);
    } else {
      lowConfTags.push(tag);
    }
  }

  // ── Step 3: Find or verify tag records in the database ──
  const tagRecords = await prisma.tag.findMany({
    where: {
      workspaceId,
      OR: result.tags.map((t) => ({
        name: t.name,
        category: t.category as TagCategory,
      })),
    },
  });

  // Build lookup map: "category:name" → tag record
  const tagMap = new Map(tagRecords.map((t) => [`${t.category}:${t.name}`, t]));

  // ── Step 4: Apply high-confidence tags to the ticket ──
  const appliedTagIds: string[] = [];
  for (const tag of highConfTags) {
    const record = tagMap.get(`${tag.category}:${tag.name}`);
    if (record) {
      appliedTagIds.push(record.id);
    }
  }

  if (appliedTagIds.length > 0) {
    await prisma.ticket.update({
      where: { id: ticketId },
      data: {
        tags: {
          connect: appliedTagIds.map((id) => ({ id })),
        },
      },
    });
  }

  // ── Step 5: Create suggestions for low-confidence tags ──
  const suggestedTagData: Array<{
    tagId: string;
    ticketId: string;
    confidence: number;
    workspaceId: string;
  }> = [];

  for (const tag of lowConfTags) {
    const record = tagMap.get(`${tag.category}:${tag.name}`);
    if (record) {
      suggestedTagData.push({
        tagId: record.id,
        ticketId,
        confidence: tag.confidence,
        workspaceId,
      });
    }
  }

  if (suggestedTagData.length > 0) {
    // Use createMany to batch insert (skipDuplicates for idempotency)
    await prisma.tagSuggestion.createMany({
      data: suggestedTagData,
      skipDuplicates: true,
    });
  }

  // ── Step 6: Set AI-determined priority ──
  const aiPriority = result.priority as TicketPriority;
  await prisma.ticket.update({
    where: { id: ticketId },
    data: { priority: aiPriority },
  });

  // ── Step 7: Run assignment rules engine ──
  const allAppliedTags = highConfTags.map((t) => ({
    name: t.name,
    category: t.category,
  }));

  const assignment = await runAssignmentEngine(workspaceId, allAppliedTags);

  let assigneeId: string | null = null;

  if (assignment) {
    const updateData: Record<string, unknown> = {
      assigneeId: assignment.assigneeId,
    };

    // If the rule overrides priority, apply it (rule takes precedence over AI)
    if (assignment.setPriority) {
      updateData.priority = assignment.setPriority;
    }

    await prisma.ticket.update({
      where: { id: ticketId },
      data: updateData,
    });

    assigneeId = assignment.assigneeId;
  }

  // ── Step 8: Create AI decision log ──
  await prisma.aIDecisionLog.create({
    data: {
      ticketId,
      rawResponse: JSON.parse(rawResponse),
      tagsApplied: highConfTags.map((t) => ({
        name: t.name,
        category: t.category,
        confidence: t.confidence,
      })),
      tagsSuggested: lowConfTags.map((t) => ({
        name: t.name,
        category: t.category,
        confidence: t.confidence,
      })),
      prioritySet: aiPriority,
      ruleId: assignment?.ruleId ?? null,
      ruleName: assignment?.ruleName ?? null,
      assigneeId,
      processingMs,
      modelVersion: "gemini-2.0-flash",
      workspaceId,
    },
  });

  // ── Step 9: Emit real-time events ──
  const appliedTagNames = highConfTags.map((t) => ({
    name: t.name,
    category: t.category,
  }));

  emitTicketEvent(workspaceId, "ticket:tagged", {
    ticketId,
    tags: appliedTagNames,
    suggestions: lowConfTags.length,
    priority: aiPriority,
  });

  if (assigneeId) {
    emitTicketEvent(workspaceId, "ticket:assigned", {
      ticketId,
      assigneeId,
      ruleName: assignment?.ruleName,
    });
  }

  logger.info(
    {
      ticketId,
      tagsApplied: highConfTags.length,
      tagsSuggested: lowConfTags.length,
      priority: aiPriority,
      assigneeId,
      ruleName: assignment?.ruleName ?? "none",
      processingMs,
    },
    "AI classification complete",
  );
}

/**
 * Gracefully shut down the worker.
 */
export async function stopAIClassificationWorker(): Promise<void> {
  if (worker) {
    await worker.close();
    logger.info("AI classification worker stopped");
  }
}
