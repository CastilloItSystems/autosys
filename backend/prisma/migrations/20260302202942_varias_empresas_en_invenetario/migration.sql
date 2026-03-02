/*
  Warnings:

  - A unique constraint covering the columns `[empresaId,code]` on the table `brands` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[empresaId,code]` on the table `categories` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[empresaId,code]` on the table `customers` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[empresaId,taxId]` on the table `customers` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[empresaId,brandId,code,name,year,type]` on the table `models` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[empresaId,code]` on the table `units` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[empresaId,abbreviation]` on the table `units` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `empresaId` to the `brands` table without a default value. This is not possible if the table is not empty.
  - Added the required column `empresaId` to the `categories` table without a default value. This is not possible if the table is not empty.
  - Added the required column `empresaId` to the `customers` table without a default value. This is not possible if the table is not empty.
  - Added the required column `empresaId` to the `invoices` table without a default value. This is not possible if the table is not empty.
  - Added the required column `empresaId` to the `items` table without a default value. This is not possible if the table is not empty.
  - Added the required column `empresaId` to the `models` table without a default value. This is not possible if the table is not empty.
  - Added the required column `empresaId` to the `orders` table without a default value. This is not possible if the table is not empty.
  - Added the required column `empresaId` to the `pre_invoices` table without a default value. This is not possible if the table is not empty.
  - Added the required column `empresaId` to the `suppliers` table without a default value. This is not possible if the table is not empty.
  - Added the required column `empresaId` to the `units` table without a default value. This is not possible if the table is not empty.
  - Added the required column `empresaId` to the `warehouses` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "brands_code_key";

-- DropIndex
DROP INDEX "categories_code_key";

-- DropIndex
DROP INDEX "customers_code_key";

-- DropIndex
DROP INDEX "customers_taxId_key";

-- DropIndex
DROP INDEX "models_brandId_code_name_year_type_key";

-- DropIndex
DROP INDEX "units_abbreviation_key";

-- DropIndex
DROP INDEX "units_code_key";

-- AlterTable
ALTER TABLE "brands" ADD COLUMN     "empresaId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "categories" ADD COLUMN     "empresaId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "customers" ADD COLUMN     "empresaId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "invoices" ADD COLUMN     "empresaId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "items" ADD COLUMN     "empresaId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "models" ADD COLUMN     "empresaId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "empresaId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "pre_invoices" ADD COLUMN     "empresaId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "suppliers" ADD COLUMN     "empresaId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "units" ADD COLUMN     "empresaId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "warehouses" ADD COLUMN     "empresaId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "brands_empresaId_idx" ON "brands"("empresaId");

-- CreateIndex
CREATE UNIQUE INDEX "brands_empresaId_code_key" ON "brands"("empresaId", "code");

-- CreateIndex
CREATE INDEX "categories_empresaId_idx" ON "categories"("empresaId");

-- CreateIndex
CREATE UNIQUE INDEX "categories_empresaId_code_key" ON "categories"("empresaId", "code");

-- CreateIndex
CREATE INDEX "customers_empresaId_idx" ON "customers"("empresaId");

-- CreateIndex
CREATE UNIQUE INDEX "customers_empresaId_code_key" ON "customers"("empresaId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "customers_empresaId_taxId_key" ON "customers"("empresaId", "taxId");

-- CreateIndex
CREATE INDEX "invoices_empresaId_idx" ON "invoices"("empresaId");

-- CreateIndex
CREATE INDEX "items_empresaId_idx" ON "items"("empresaId");

-- CreateIndex
CREATE INDEX "models_empresaId_idx" ON "models"("empresaId");

-- CreateIndex
CREATE UNIQUE INDEX "models_empresaId_brandId_code_name_year_type_key" ON "models"("empresaId", "brandId", "code", "name", "year", "type");

-- CreateIndex
CREATE INDEX "orders_empresaId_idx" ON "orders"("empresaId");

-- CreateIndex
CREATE INDEX "pre_invoices_empresaId_idx" ON "pre_invoices"("empresaId");

-- CreateIndex
CREATE INDEX "suppliers_empresaId_idx" ON "suppliers"("empresaId");

-- CreateIndex
CREATE INDEX "units_empresaId_idx" ON "units"("empresaId");

-- CreateIndex
CREATE UNIQUE INDEX "units_empresaId_code_key" ON "units"("empresaId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "units_empresaId_abbreviation_key" ON "units"("empresaId", "abbreviation");

-- CreateIndex
CREATE INDEX "warehouses_empresaId_idx" ON "warehouses"("empresaId");

-- AddForeignKey
ALTER TABLE "brands" ADD CONSTRAINT "brands_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id_empresa") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id_empresa") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items" ADD CONSTRAINT "items_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id_empresa") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "models" ADD CONSTRAINT "models_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id_empresa") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suppliers" ADD CONSTRAINT "suppliers_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id_empresa") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "units" ADD CONSTRAINT "units_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id_empresa") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "warehouses" ADD CONSTRAINT "warehouses_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id_empresa") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id_empresa") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id_empresa") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id_empresa") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pre_invoices" ADD CONSTRAINT "pre_invoices_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id_empresa") ON DELETE RESTRICT ON UPDATE CASCADE;
