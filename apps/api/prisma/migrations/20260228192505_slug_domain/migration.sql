/*
  Warnings:

  - You are about to drop the column `slug` on the `Domain` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[subdomain]` on the table `Domain` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `subdomain` to the `Domain` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Domain_slug_key";

-- AlterTable
ALTER TABLE "Domain" DROP COLUMN "slug",
ADD COLUMN     "subdomain" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Domain_subdomain_key" ON "Domain"("subdomain");
