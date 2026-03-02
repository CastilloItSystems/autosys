/*
  Warnings:

  - The values [LOST] on the enum `LoanStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the `loans` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[loanId]` on the table `exit_notes` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "EventTypeEnum" AS ENUM ('STOCK_CREATED', 'STOCK_UPDATED', 'STOCK_RESERVED', 'STOCK_UNRESERVED', 'STOCK_MOVEMENT_CREATED', 'STOCK_LOW', 'ADJUSTMENT_CREATED', 'ADJUSTMENT_APPROVED', 'ADJUSTMENT_APPLIED', 'ADJUSTMENT_REJECTED', 'ADJUSTMENT_CANCELLED', 'CYCLE_COUNT_CREATED', 'CYCLE_COUNT_APPROVED', 'CYCLE_COUNT_APPLIED', 'CYCLE_COUNT_REJECTED', 'CYCLE_COUNT_COMPLETED', 'RECONCILIATION_CREATED', 'RECONCILIATION_APPROVED', 'RECONCILIATION_APPLIED', 'RECONCILIATION_REJECTED', 'LOAN_CREATED', 'LOAN_APPROVED', 'LOAN_ACTIVE', 'LOAN_RETURNED', 'LOAN_OVERDUE', 'EXTERNAL_REPAIR_CREATED', 'EXTERNAL_REPAIR_SENT', 'EXTERNAL_REPAIR_RECEIVED', 'EXTERNAL_REPAIR_QUALITY_CHECK', 'EXTERNAL_REPAIR_REJECTED', 'RETURN_CREATED', 'RETURN_APPROVED', 'RETURN_PROCESSED', 'RETURN_REJECTED', 'TRANSFER_CREATED', 'TRANSFER_SENT', 'TRANSFER_RECEIVED', 'SERIAL_CREATED', 'SERIAL_ASSIGNED_LOCATION', 'SERIAL_STATUS_CHANGED', 'ITEM_CREATED', 'ITEM_UPDATED', 'ITEM_DELETED', 'BATCH_CREATED', 'BATCH_EXPIRING_SOON', 'BATCH_EXPIRED', 'SYSTEM_ALERT', 'SYSTEM_WARNING', 'SYSTEM_ERROR');

-- CreateEnum
CREATE TYPE "EventPriorityEnum" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "MovementType" ADD VALUE 'LOAN_OUT';
ALTER TYPE "MovementType" ADD VALUE 'LOAN_RETURN';

-- DropForeignKey
ALTER TABLE "loans" DROP CONSTRAINT "loans_exitNoteId_fkey";

-- AlterTable
ALTER TABLE "exit_notes" ADD COLUMN     "loanId" TEXT;

-- DropTable
DROP TABLE "loans";

-- Replace LoanStatus enum (old table using it was dropped above)
DROP TYPE "LoanStatus";
CREATE TYPE "LoanStatus" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'ACTIVE', 'RETURNED', 'OVERDUE', 'CANCELLED');

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "type" "EventTypeEnum" NOT NULL,
    "entityId" VARCHAR(36) NOT NULL,
    "entityType" VARCHAR(50) NOT NULL,
    "userId" VARCHAR(36) NOT NULL,
    "eventData" JSONB NOT NULL,
    "priority" "EventPriorityEnum" NOT NULL DEFAULT 'MEDIUM',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loans" (
    "id" TEXT NOT NULL,
    "loanNumber" VARCHAR(50) NOT NULL,
    "borrowerName" VARCHAR(255) NOT NULL,
    "borrowerId" VARCHAR(36),
    "status" "LoanStatus" NOT NULL DEFAULT 'DRAFT',
    "warehouseId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "returnedAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "approvedBy" VARCHAR(36),
    "purpose" VARCHAR(255),
    "notes" TEXT,
    "createdBy" VARCHAR(36) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "loans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loan_items" (
    "id" TEXT NOT NULL,
    "loanId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "quantityLoaned" INTEGER NOT NULL,
    "quantityReturned" INTEGER NOT NULL DEFAULT 0,
    "unitCost" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "loan_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Event_entityId_idx" ON "Event"("entityId");

-- CreateIndex
CREATE INDEX "Event_entityType_idx" ON "Event"("entityType");

-- CreateIndex
CREATE INDEX "Event_userId_idx" ON "Event"("userId");

-- CreateIndex
CREATE INDEX "Event_type_idx" ON "Event"("type");

-- CreateIndex
CREATE INDEX "Event_createdAt_idx" ON "Event"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "loans_loanNumber_key" ON "loans"("loanNumber");

-- CreateIndex
CREATE INDEX "loans_loanNumber_idx" ON "loans"("loanNumber");

-- CreateIndex
CREATE INDEX "loans_status_idx" ON "loans"("status");

-- CreateIndex
CREATE INDEX "loans_borrowerId_idx" ON "loans"("borrowerId");

-- CreateIndex
CREATE INDEX "loans_warehouseId_idx" ON "loans"("warehouseId");

-- CreateIndex
CREATE INDEX "loans_dueDate_idx" ON "loans"("dueDate");

-- CreateIndex
CREATE INDEX "loans_createdAt_idx" ON "loans"("createdAt");

-- CreateIndex
CREATE INDEX "loan_items_loanId_idx" ON "loan_items"("loanId");

-- CreateIndex
CREATE INDEX "loan_items_itemId_idx" ON "loan_items"("itemId");

-- CreateIndex
CREATE UNIQUE INDEX "loan_items_loanId_itemId_key" ON "loan_items"("loanId", "itemId");

-- CreateIndex
CREATE UNIQUE INDEX "exit_notes_loanId_key" ON "exit_notes"("loanId");

-- AddForeignKey
ALTER TABLE "exit_notes" ADD CONSTRAINT "exit_notes_loanId_fkey" FOREIGN KEY ("loanId") REFERENCES "loans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loans" ADD CONSTRAINT "loans_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "warehouses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loan_items" ADD CONSTRAINT "loan_items_loanId_fkey" FOREIGN KEY ("loanId") REFERENCES "loans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loan_items" ADD CONSTRAINT "loan_items_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
