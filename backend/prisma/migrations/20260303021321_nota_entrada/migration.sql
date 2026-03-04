/*
  Warnings:

  - You are about to drop the `receive_items` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `receives` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "EntryNoteStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "EntryType" AS ENUM ('PURCHASE', 'RETURN', 'TRANSFER', 'WARRANTY_RETURN', 'LOAN_RETURN', 'ADJUSTMENT_IN', 'DONATION', 'SAMPLE', 'OTHER');

-- DropForeignKey
ALTER TABLE "receive_items" DROP CONSTRAINT "receive_items_receiveId_fkey";

-- DropForeignKey
ALTER TABLE "receives" DROP CONSTRAINT "receives_purchaseOrderId_fkey";

-- AlterTable
ALTER TABLE "movements" ADD COLUMN     "entryNoteId" TEXT;

-- DropTable
DROP TABLE "receive_items";

-- DropTable
DROP TABLE "receives";

-- CreateTable
CREATE TABLE "entry_notes" (
    "id" TEXT NOT NULL,
    "entryNoteNumber" TEXT NOT NULL,
    "type" "EntryType" NOT NULL DEFAULT 'PURCHASE',
    "status" "EntryNoteStatus" NOT NULL DEFAULT 'PENDING',
    "purchaseOrderId" TEXT,
    "warehouseId" TEXT NOT NULL,
    "supplierName" TEXT,
    "supplierId" TEXT,
    "supplierPhone" TEXT,
    "reason" TEXT,
    "reference" TEXT,
    "notes" TEXT,
    "receivedAt" TIMESTAMP(3),
    "verifiedAt" TIMESTAMP(3),
    "receivedBy" TEXT,
    "verifiedBy" TEXT,
    "authorizedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "entry_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "entry_note_items" (
    "id" TEXT NOT NULL,
    "entryNoteId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "quantityReceived" INTEGER NOT NULL,
    "unitCost" DECIMAL(12,2) NOT NULL,
    "storedToLocation" TEXT,
    "batchId" TEXT,
    "serialNumberId" TEXT,
    "batchNumber" TEXT,
    "expiryDate" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "entry_note_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "entry_notes_entryNoteNumber_key" ON "entry_notes"("entryNoteNumber");

-- CreateIndex
CREATE INDEX "entry_notes_entryNoteNumber_idx" ON "entry_notes"("entryNoteNumber");

-- CreateIndex
CREATE INDEX "entry_notes_type_idx" ON "entry_notes"("type");

-- CreateIndex
CREATE INDEX "entry_notes_status_idx" ON "entry_notes"("status");

-- CreateIndex
CREATE INDEX "entry_notes_purchaseOrderId_idx" ON "entry_notes"("purchaseOrderId");

-- CreateIndex
CREATE INDEX "entry_notes_warehouseId_idx" ON "entry_notes"("warehouseId");

-- CreateIndex
CREATE INDEX "entry_note_items_entryNoteId_idx" ON "entry_note_items"("entryNoteId");

-- CreateIndex
CREATE INDEX "entry_note_items_itemId_idx" ON "entry_note_items"("itemId");

-- AddForeignKey
ALTER TABLE "entry_notes" ADD CONSTRAINT "entry_notes_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "purchase_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entry_notes" ADD CONSTRAINT "entry_notes_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "warehouses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entry_note_items" ADD CONSTRAINT "entry_note_items_entryNoteId_fkey" FOREIGN KEY ("entryNoteId") REFERENCES "entry_notes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entry_note_items" ADD CONSTRAINT "entry_note_items_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entry_note_items" ADD CONSTRAINT "entry_note_items_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "batches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entry_note_items" ADD CONSTRAINT "entry_note_items_serialNumberId_fkey" FOREIGN KEY ("serialNumberId") REFERENCES "serial_numbers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
