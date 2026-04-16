-- AlterTable
ALTER TABLE "service_order_materials" ADD COLUMN     "warehouseId" TEXT;

-- CreateIndex
CREATE INDEX "service_order_materials_warehouseId_idx" ON "service_order_materials"("warehouseId");

-- AddForeignKey
ALTER TABLE "service_order_materials" ADD CONSTRAINT "service_order_materials_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "warehouses"("id") ON DELETE SET NULL ON UPDATE CASCADE;
