-- CreateTable
CREATE TABLE "WorkspaceTheme" (
    "id" TEXT NOT NULL,
    "primaryColor" TEXT NOT NULL DEFAULT '#4F6BF0',
    "accentColor" TEXT NOT NULL DEFAULT '#7C3AED',
    "fontFamily" TEXT NOT NULL DEFAULT 'Inter',
    "borderRadius" DOUBLE PRECISION NOT NULL DEFAULT 0.375,
    "defaultMode" TEXT NOT NULL DEFAULT 'system',
    "logoUrl" TEXT,
    "faviconUrl" TEXT,
    "workspaceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkspaceTheme_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WorkspaceTheme_workspaceId_key" ON "WorkspaceTheme"("workspaceId");

-- AddForeignKey
ALTER TABLE "WorkspaceTheme" ADD CONSTRAINT "WorkspaceTheme_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
