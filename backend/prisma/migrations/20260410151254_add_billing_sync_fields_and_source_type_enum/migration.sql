-- CreateEnum
CREATE TYPE "ServiceOrderItemSourceType" AS ENUM ('MANUAL', 'MATERIAL', 'ADDITIONAL', 'TOT');

-- AlterTable
ALTER TABLE "service_order_additional_items" ADD COLUMN     "discountPct" DECIMAL(5,2) NOT NULL DEFAULT 0,
ADD COLUMN     "taxAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "taxRate" DECIMAL(5,2) NOT NULL DEFAULT 0.16,
ADD COLUMN     "taxType" "TaxType" NOT NULL DEFAULT 'IVA';

-- AlterTable
ALTER TABLE "service_order_items" ADD COLUMN     "sourceRefId" TEXT,
ADD COLUMN     "sourceType" "ServiceOrderItemSourceType" NOT NULL DEFAULT 'MANUAL';

-- AlterTable
ALTER TABLE "service_order_materials" ADD COLUMN     "discountPct" DECIMAL(5,2) NOT NULL DEFAULT 0,
ADD COLUMN     "taxAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "taxRate" DECIMAL(5,2) NOT NULL DEFAULT 0.16,
ADD COLUMN     "taxType" "TaxType" NOT NULL DEFAULT 'IVA';

-- AlterTable
ALTER TABLE "workshop_tot" ADD COLUMN     "clientPrice" DECIMAL(12,2),
ADD COLUMN     "discountPct" DECIMAL(5,2) NOT NULL DEFAULT 0,
ADD COLUMN     "taxAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "taxRate" DECIMAL(5,2) NOT NULL DEFAULT 0.16,
ADD COLUMN     "taxType" "TaxType" NOT NULL DEFAULT 'IVA';

-- CreateIndex
CREATE INDEX "service_order_items_serviceOrderId_sourceType_idx" ON "service_order_items"("serviceOrderId", "sourceType");

-- CreateIndex
CREATE INDEX "service_order_items_sourceRefId_idx" ON "service_order_items"("sourceRefId");
