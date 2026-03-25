/*
  Warnings:

  - A unique constraint covering the columns `[empresaId,taxId]` on the table `suppliers` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "SupplierType" AS ENUM ('INDIVIDUAL', 'COMPANY');

-- AlterTable
ALTER TABLE "suppliers" ADD COLUMN     "creditDays" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "currency" TEXT,
ADD COLUMN     "isSpecialTaxpayer" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "mobile" TEXT,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "type" "SupplierType" NOT NULL DEFAULT 'COMPANY',
ADD COLUMN     "website" TEXT;

-- CreateIndex
CREATE INDEX "suppliers_code_idx" ON "suppliers"("code");

-- CreateIndex
CREATE INDEX "suppliers_taxId_idx" ON "suppliers"("taxId");

-- CreateIndex
CREATE UNIQUE INDEX "suppliers_empresaId_taxId_key" ON "suppliers"("empresaId", "taxId");
