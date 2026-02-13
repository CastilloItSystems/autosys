-- CreateEnum
CREATE TYPE "BulkOperationType" AS ENUM ('IMPORT', 'EXPORT', 'UPDATE', 'DELETE');

-- CreateEnum
CREATE TYPE "BulkOperationStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateTable
CREATE TABLE "bulk_operations" (
    "id" TEXT NOT NULL,
    "operationType" "BulkOperationType" NOT NULL,
    "status" "BulkOperationStatus" NOT NULL DEFAULT 'PENDING',
    "fileName" TEXT,
    "fileUrl" TEXT,
    "totalRecords" INTEGER NOT NULL,
    "processedRecords" INTEGER NOT NULL DEFAULT 0,
    "errorRecords" INTEGER NOT NULL DEFAULT 0,
    "errorDetails" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,
    "metadata" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bulk_operations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pricings" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "costPrice" DECIMAL(12,2) NOT NULL,
    "salePrice" DECIMAL(12,2) NOT NULL,
    "wholesalePrice" DECIMAL(12,2),
    "minMargin" INTEGER NOT NULL,
    "maxMargin" INTEGER NOT NULL,
    "discountPercentage" INTEGER,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pricings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pricing_tiers" (
    "id" TEXT NOT NULL,
    "pricingId" TEXT NOT NULL,
    "minQuantity" INTEGER NOT NULL,
    "maxQuantity" INTEGER,
    "tierPrice" DECIMAL(12,2) NOT NULL,
    "discountPercentage" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pricing_tiers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "bulk_operations_createdBy_idx" ON "bulk_operations"("createdBy");

-- CreateIndex
CREATE INDEX "bulk_operations_status_idx" ON "bulk_operations"("status");

-- CreateIndex
CREATE INDEX "bulk_operations_operationType_idx" ON "bulk_operations"("operationType");

-- CreateIndex
CREATE INDEX "bulk_operations_createdAt_idx" ON "bulk_operations"("createdAt");

-- CreateIndex
CREATE INDEX "pricings_itemId_idx" ON "pricings"("itemId");

-- CreateIndex
CREATE INDEX "pricings_isActive_idx" ON "pricings"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "pricings_itemId_key" ON "pricings"("itemId");

-- CreateIndex
CREATE INDEX "pricing_tiers_pricingId_idx" ON "pricing_tiers"("pricingId");

-- CreateIndex
CREATE INDEX "pricing_tiers_minQuantity_idx" ON "pricing_tiers"("minQuantity");

-- AddForeignKey
ALTER TABLE "pricings" ADD CONSTRAINT "pricings_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pricing_tiers" ADD CONSTRAINT "pricing_tiers_pricingId_fkey" FOREIGN KEY ("pricingId") REFERENCES "pricings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
