/*
  Warnings:

  - A unique constraint covering the columns `[empresaId,sku]` on the table `items` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[empresaId,barcode]` on the table `items` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "items_barcode_key";

-- DropIndex
DROP INDEX "items_sku_key";

-- CreateIndex
CREATE UNIQUE INDEX "items_empresa_sku_unique" ON "items"("empresaId", "sku");

-- CreateIndex
CREATE UNIQUE INDEX "items_empresa_barcode_unique" ON "items"("empresaId", "barcode");
