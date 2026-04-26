/*
  Warnings:

  - A unique constraint covering the columns `[name,category,workspaceId]` on the table `Tag` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `category` to the `Tag` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "TagCategory" AS ENUM ('ISSUE_TYPE', 'DEPARTMENT', 'PRODUCT_AREA', 'SENTIMENT', 'SLA');

-- CreateEnum
CREATE TYPE "SuggestionStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');

-- CreateEnum
CREATE TYPE "AssignmentStrategy" AS ENUM ('SPECIFIC', 'ROUND_ROBIN');

-- DropIndex
DROP INDEX "Tag_name_workspaceId_key";

-- AlterTable  (Step 1: add columns — category is nullable for now)
ALTER TABLE "Tag"
  ADD COLUMN "category" "TagCategory",
  ADD COLUMN "isSystem" BOOLEAN NOT NULL DEFAULT false;

-- Backfill existing rows with a sensible default category
UPDATE "Tag" SET "category" = 'ISSUE_TYPE' WHERE "category" IS NULL;

-- Step 3: now make the column required
ALTER TABLE "Tag" ALTER COLUMN "category" SET NOT NULL;

-- CreateTable
CREATE TABLE "TagSuggestion" (
    "id" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "status" "SuggestionStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TagSuggestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssignmentRule" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "priority" INTEGER NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "conditions" JSONB NOT NULL,
    "assigneeId" TEXT,
    "strategy" "AssignmentStrategy" NOT NULL DEFAULT 'SPECIFIC',
    "setPriority" "TicketPriority",
    "flagUrgent" BOOLEAN NOT NULL DEFAULT false,
    "workspaceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssignmentRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIDecisionLog" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "rawResponse" JSONB NOT NULL,
    "tagsApplied" JSONB NOT NULL,
    "tagsSuggested" JSONB NOT NULL,
    "prioritySet" "TicketPriority",
    "ruleId" TEXT,
    "ruleName" TEXT,
    "assigneeId" TEXT,
    "processingMs" INTEGER NOT NULL,
    "modelVersion" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIDecisionLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TagSuggestion_tagId_ticketId_key" ON "TagSuggestion"("tagId", "ticketId");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_name_category_workspaceId_key" ON "Tag"("name", "category", "workspaceId");

-- AddForeignKey
ALTER TABLE "TagSuggestion" ADD CONSTRAINT "TagSuggestion_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TagSuggestion" ADD CONSTRAINT "TagSuggestion_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssignmentRule" ADD CONSTRAINT "AssignmentRule_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssignmentRule" ADD CONSTRAINT "AssignmentRule_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIDecisionLog" ADD CONSTRAINT "AIDecisionLog_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIDecisionLog" ADD CONSTRAINT "AIDecisionLog_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
