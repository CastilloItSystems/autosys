-- CreateEnum
CREATE TYPE "AdjustmentStatus" AS ENUM ('DRAFT', 'APPROVED', 'APPLIED', 'REJECTED', 'CANCELLED');

-- CreateTable
CREATE TABLE "adjustments" (
    "id" TEXT NOT NULL,
    "adjustmentNumber" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "status" "AdjustmentStatus" NOT NULL DEFAULT 'DRAFT',
    "reason" VARCHAR(255) NOT NULL,
    "notes" TEXT,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "appliedBy" TEXT,
    "appliedAt" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "adjustments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "adjustment_items" (
    "id" TEXT NOT NULL,
    "adjustmentId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "quantityChange" INTEGER NOT NULL,
    "currentQuantity" INTEGER,
    "newQuantity" INTEGER,
    "unitCost" DECIMAL(12,2),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "adjustment_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "adjustments_adjustmentNumber_key" ON "adjustments"("adjustmentNumber");

-- CreateIndex
CREATE INDEX "adjustments_adjustmentNumber_idx" ON "adjustments"("adjustmentNumber");

-- CreateIndex
CREATE INDEX "adjustments_warehouseId_idx" ON "adjustments"("warehouseId");

-- CreateIndex
CREATE INDEX "adjustments_status_idx" ON "adjustments"("status");

-- CreateIndex
CREATE INDEX "adjustments_createdAt_idx" ON "adjustments"("createdAt");

-- CreateIndex
CREATE INDEX "adjustment_items_adjustmentId_idx" ON "adjustment_items"("adjustmentId");

-- CreateIndex
CREATE INDEX "adjustment_items_itemId_idx" ON "adjustment_items"("itemId");

-- CreateIndex
CREATE UNIQUE INDEX "adjustment_items_adjustmentId_itemId_key" ON "adjustment_items"("adjustmentId", "itemId");

-- AddForeignKey
ALTER TABLE "adjustments" ADD CONSTRAINT "adjustments_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "warehouses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "adjustment_items" ADD CONSTRAINT "adjustment_items_adjustmentId_fkey" FOREIGN KEY ("adjustmentId") REFERENCES "adjustments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "adjustment_items" ADD CONSTRAINT "adjustment_items_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
