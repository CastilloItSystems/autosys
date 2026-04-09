/*
  Warnings:

  - You are about to drop the column `brand` on the `customer_vehicles` table. All the data in the column will be lost.
  - You are about to drop the column `model` on the `customer_vehicles` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "customer_vehicles" DROP COLUMN "brand",
DROP COLUMN "model",
ADD COLUMN     "brandId" TEXT,
ADD COLUMN     "modelId" TEXT;

-- CreateIndex
CREATE INDEX "customer_vehicles_brandId_idx" ON "customer_vehicles"("brandId");

-- CreateIndex
CREATE INDEX "customer_vehicles_modelId_idx" ON "customer_vehicles"("modelId");

-- AddForeignKey
ALTER TABLE "customer_vehicles" ADD CONSTRAINT "customer_vehicles_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "brands"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_vehicles" ADD CONSTRAINT "customer_vehicles_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "models"("id") ON DELETE SET NULL ON UPDATE CASCADE;
