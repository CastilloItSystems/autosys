/*
  Warnings:

  - The `status` column on the `cycle_counts` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to alter the column `discountPercentage` on the `pricing_tiers` table. The data in that column could be lost. The data in that column will be cast from `Integer` to `Decimal(5,2)`.
  - You are about to alter the column `minMargin` on the `pricings` table. The data in that column could be lost. The data in that column will be cast from `Integer` to `Decimal(5,2)`.
  - You are about to alter the column `maxMargin` on the `pricings` table. The data in that column could be lost. The data in that column will be cast from `Integer` to `Decimal(5,2)`.
  - You are about to alter the column `discountPercentage` on the `pricings` table. The data in that column could be lost. The data in that column will be cast from `Integer` to `Decimal(5,2)`.
  - The `status` column on the `reconciliations` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[itemId,warehouseId,type]` on the table `stock_alerts` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[empresaId,code]` on the table `suppliers` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[empresaId,code]` on the table `warehouses` will be added. If there are existing duplicate values, this will fail.
  - Changed the type of `source` on the `reconciliations` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "CycleCountStatus" AS ENUM ('DRAFT', 'IN_PROGRESS', 'APPROVED', 'APPLIED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ReconciliationStatus" AS ENUM ('DRAFT', 'IN_PROGRESS', 'APPROVED', 'APPLIED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ReconciliationSource" AS ENUM ('CYCLE_COUNT', 'PHYSICAL_INVENTORY', 'SYSTEM_ERROR', 'ADJUSTMENT', 'OTHER');

-- DropIndex
DROP INDEX "suppliers_code_idx";

-- DropIndex
DROP INDEX "suppliers_code_key";

-- DropIndex
DROP INDEX "warehouses_code_idx";

-- DropIndex
DROP INDEX "warehouses_code_key";

-- AlterTable
ALTER TABLE "cycle_counts" DROP COLUMN "status",
ADD COLUMN     "status" "CycleCountStatus" NOT NULL DEFAULT 'DRAFT';

-- AlterTable
ALTER TABLE "pricing_tiers" ALTER COLUMN "discountPercentage" SET DATA TYPE DECIMAL(5,2);

-- AlterTable
ALTER TABLE "pricings" ALTER COLUMN "minMargin" SET DATA TYPE DECIMAL(5,2),
ALTER COLUMN "maxMargin" SET DATA TYPE DECIMAL(5,2),
ALTER COLUMN "discountPercentage" SET DATA TYPE DECIMAL(5,2);

-- AlterTable
ALTER TABLE "reconciliations" DROP COLUMN "status",
ADD COLUMN     "status" "ReconciliationStatus" NOT NULL DEFAULT 'DRAFT',
DROP COLUMN "source",
ADD COLUMN     "source" "ReconciliationSource" NOT NULL;

-- DropEnum
DROP TYPE "cycle_count_status";

-- DropEnum
DROP TYPE "reconciliation_source";

-- DropEnum
DROP TYPE "reconciliation_status";

-- CreateIndex
CREATE INDEX "batches_itemId_expiryDate_idx" ON "batches"("itemId", "expiryDate");

-- CreateIndex
CREATE INDEX "cycle_counts_status_idx" ON "cycle_counts"("status");

-- CreateIndex
CREATE INDEX "movements_itemId_movementDate_idx" ON "movements"("itemId", "movementDate");

-- CreateIndex
CREATE INDEX "reconciliations_status_idx" ON "reconciliations"("status");

-- CreateIndex
CREATE INDEX "reconciliations_source_idx" ON "reconciliations"("source");

-- CreateIndex
CREATE INDEX "reservations_warehouseId_idx" ON "reservations"("warehouseId");

-- CreateIndex
CREATE UNIQUE INDEX "stock_alerts_itemId_warehouseId_type_key" ON "stock_alerts"("itemId", "warehouseId", "type");

-- CreateIndex
CREATE INDEX "stocks_warehouseId_quantityAvailable_idx" ON "stocks"("warehouseId", "quantityAvailable");

-- CreateIndex
CREATE UNIQUE INDEX "suppliers_empresaId_code_key" ON "suppliers"("empresaId", "code");

-- CreateIndex
CREATE INDEX "transfers_fromWarehouseId_status_idx" ON "transfers"("fromWarehouseId", "status");

-- CreateIndex
CREATE INDEX "transfers_toWarehouseId_status_idx" ON "transfers"("toWarehouseId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "warehouses_empresaId_code_key" ON "warehouses"("empresaId", "code");

-- AddForeignKey
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "warehouses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_alerts" ADD CONSTRAINT "stock_alerts_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "warehouses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
