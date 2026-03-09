/*
  Warnings:

  - The values [IN_TRANSIT,RECEIVED] on the enum `TransferStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `receivedAt` on the `transfers` table. All the data in the column will be lost.
  - You are about to drop the column `receivedBy` on the `transfers` table. All the data in the column will be lost.
  - You are about to drop the column `sentAt` on the `transfers` table. All the data in the column will be lost.
  - You are about to drop the column `sentBy` on the `transfers` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[exitNoteId]` on the table `transfers` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[entryNoteId]` on the table `transfers` will be added. If there are existing duplicate values, this will fail.

*/
-- First, update any existing rows with IN_TRANSIT or RECEIVED to CANCELLED
UPDATE "transfers" SET "status" = 'CANCELLED' WHERE "status" IN ('IN_TRANSIT', 'RECEIVED');

-- AlterEnum
BEGIN;
CREATE TYPE "TransferStatus_new" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'CANCELLED');
ALTER TABLE "public"."transfers" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "transfers" ALTER COLUMN "status" TYPE "TransferStatus_new" USING ("status"::text::"TransferStatus_new");
ALTER TYPE "TransferStatus" RENAME TO "TransferStatus_old";
ALTER TYPE "TransferStatus_new" RENAME TO "TransferStatus";
DROP TYPE "public"."TransferStatus_old";
ALTER TABLE "transfers" ALTER COLUMN "status" SET DEFAULT 'DRAFT';
COMMIT;

-- AlterTable
ALTER TABLE "transfers" DROP COLUMN "receivedAt",
DROP COLUMN "receivedBy",
DROP COLUMN "sentAt",
DROP COLUMN "sentBy",
ADD COLUMN     "entryNoteId" TEXT,
ADD COLUMN     "exitNoteId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "transfers_exitNoteId_key" ON "transfers"("exitNoteId");

-- CreateIndex
CREATE UNIQUE INDEX "transfers_entryNoteId_key" ON "transfers"("entryNoteId");

-- AddForeignKey
ALTER TABLE "transfers" ADD CONSTRAINT "transfers_exitNoteId_fkey" FOREIGN KEY ("exitNoteId") REFERENCES "exit_notes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transfers" ADD CONSTRAINT "transfers_entryNoteId_fkey" FOREIGN KEY ("entryNoteId") REFERENCES "entry_notes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
