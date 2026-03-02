-- CreateEnum
CREATE TYPE "cycle_count_status" AS ENUM ('DRAFT', 'IN_PROGRESS', 'APPROVED', 'APPLIED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "reconciliation_status" AS ENUM ('DRAFT', 'IN_PROGRESS', 'APPROVED', 'APPLIED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "reconciliation_source" AS ENUM ('CYCLE_COUNT', 'PHYSICAL_INVENTORY', 'SYSTEM_ERROR', 'ADJUSTMENT', 'OTHER');

-- CreateTable
CREATE TABLE "cycle_counts" (
    "id" TEXT NOT NULL,
    "cycleCountNumber" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "status" "cycle_count_status" NOT NULL DEFAULT 'DRAFT',
    "startedBy" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedBy" TEXT,
    "completedAt" TIMESTAMP(3),
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "appliedBy" TEXT,
    "appliedAt" TIMESTAMP(3),
    "notes" TEXT,
    "remarks" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cycle_counts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cycle_count_items" (
    "id" TEXT NOT NULL,
    "cycleCountId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "expectedQuantity" INTEGER NOT NULL,
    "countedQuantity" INTEGER,
    "variance" INTEGER,
    "location" VARCHAR(255),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cycle_count_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reconciliations" (
    "id" TEXT NOT NULL,
    "reconciliationNumber" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "status" "reconciliation_status" NOT NULL DEFAULT 'DRAFT',
    "source" "reconciliation_source" NOT NULL,
    "startedBy" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedBy" TEXT,
    "completedAt" TIMESTAMP(3),
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "appliedBy" TEXT,
    "appliedAt" TIMESTAMP(3),
    "reason" VARCHAR(500) NOT NULL,
    "notes" TEXT,
    "remarks" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reconciliations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reconciliation_items" (
    "id" TEXT NOT NULL,
    "reconciliationId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "systemQuantity" INTEGER NOT NULL,
    "expectedQuantity" INTEGER NOT NULL,
    "difference" INTEGER NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reconciliation_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "cycle_counts_cycleCountNumber_key" ON "cycle_counts"("cycleCountNumber");

-- CreateIndex
CREATE INDEX "cycle_counts_cycleCountNumber_idx" ON "cycle_counts"("cycleCountNumber");

-- CreateIndex
CREATE INDEX "cycle_counts_warehouseId_idx" ON "cycle_counts"("warehouseId");

-- CreateIndex
CREATE INDEX "cycle_counts_status_idx" ON "cycle_counts"("status");

-- CreateIndex
CREATE INDEX "cycle_counts_createdAt_idx" ON "cycle_counts"("createdAt");

-- CreateIndex
CREATE INDEX "cycle_count_items_cycleCountId_idx" ON "cycle_count_items"("cycleCountId");

-- CreateIndex
CREATE INDEX "cycle_count_items_itemId_idx" ON "cycle_count_items"("itemId");

-- CreateIndex
CREATE UNIQUE INDEX "cycle_count_items_cycleCountId_itemId_key" ON "cycle_count_items"("cycleCountId", "itemId");

-- CreateIndex
CREATE UNIQUE INDEX "reconciliations_reconciliationNumber_key" ON "reconciliations"("reconciliationNumber");

-- CreateIndex
CREATE INDEX "reconciliations_reconciliationNumber_idx" ON "reconciliations"("reconciliationNumber");

-- CreateIndex
CREATE INDEX "reconciliations_warehouseId_idx" ON "reconciliations"("warehouseId");

-- CreateIndex
CREATE INDEX "reconciliations_status_idx" ON "reconciliations"("status");

-- CreateIndex
CREATE INDEX "reconciliations_source_idx" ON "reconciliations"("source");

-- CreateIndex
CREATE INDEX "reconciliations_createdAt_idx" ON "reconciliations"("createdAt");

-- CreateIndex
CREATE INDEX "reconciliation_items_reconciliationId_idx" ON "reconciliation_items"("reconciliationId");

-- CreateIndex
CREATE INDEX "reconciliation_items_itemId_idx" ON "reconciliation_items"("itemId");

-- CreateIndex
CREATE UNIQUE INDEX "reconciliation_items_reconciliationId_itemId_key" ON "reconciliation_items"("reconciliationId", "itemId");

-- AddForeignKey
ALTER TABLE "cycle_counts" ADD CONSTRAINT "cycle_counts_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "warehouses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cycle_count_items" ADD CONSTRAINT "cycle_count_items_cycleCountId_fkey" FOREIGN KEY ("cycleCountId") REFERENCES "cycle_counts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cycle_count_items" ADD CONSTRAINT "cycle_count_items_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reconciliations" ADD CONSTRAINT "reconciliations_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "warehouses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reconciliation_items" ADD CONSTRAINT "reconciliation_items_reconciliationId_fkey" FOREIGN KEY ("reconciliationId") REFERENCES "reconciliations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reconciliation_items" ADD CONSTRAINT "reconciliation_items_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
