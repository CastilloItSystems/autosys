/*
  Warnings:

  - The `currency` column on the `dealer_financing` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `currency` column on the `dealer_quotes` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `currency` column on the `dealer_reservations` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[salesOrderId]` on the table `dealer_quotes` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[preInvoiceId]` on the table `dealer_quotes` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[invoiceId]` on the table `dealer_quotes` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `itemId` to the `dealer_units` table without a default value. This is not possible if the table is not empty.
  - Added the required column `warehouseId` to the `dealer_units` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "DealerExchangeRateSource" AS ENUM ('BCV_AUTO', 'MANUAL');

-- CreateEnum
CREATE TYPE "DealerFiscalStatus" AS ENUM ('NOT_REQUESTED', 'ORDER_DRAFT', 'ORDER_APPROVED', 'PREINVOICE_READY', 'PAID', 'INVOICED', 'ERROR');

-- AlterTable
ALTER TABLE "dealer_financing" ADD COLUMN     "exchangeRate" DECIMAL(14,4),
ADD COLUMN     "exchangeRateSource" "DealerExchangeRateSource",
DROP COLUMN "currency",
ADD COLUMN     "currency" "OrderCurrency" NOT NULL DEFAULT 'USD';

-- AlterTable
ALTER TABLE "dealer_quotes" ADD COLUMN     "exchangeRate" DECIMAL(14,4),
ADD COLUMN     "exchangeRateSource" "DealerExchangeRateSource",
ADD COLUMN     "fiscalError" TEXT,
ADD COLUMN     "fiscalStatus" "DealerFiscalStatus" NOT NULL DEFAULT 'NOT_REQUESTED',
ADD COLUMN     "invoiceId" TEXT,
ADD COLUMN     "preInvoiceId" TEXT,
ADD COLUMN     "salesOrderId" TEXT,
DROP COLUMN "currency",
ADD COLUMN     "currency" "OrderCurrency" NOT NULL DEFAULT 'USD';

-- AlterTable
ALTER TABLE "dealer_reservations" ADD COLUMN     "exchangeRate" DECIMAL(14,4),
ADD COLUMN     "exchangeRateSource" "DealerExchangeRateSource",
DROP COLUMN "currency",
ADD COLUMN     "currency" "OrderCurrency" NOT NULL DEFAULT 'USD';

-- AlterTable
ALTER TABLE "dealer_units" ADD COLUMN     "itemId" TEXT NOT NULL,
ADD COLUMN     "warehouseId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "dealer_quotes_salesOrderId_key" ON "dealer_quotes"("salesOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "dealer_quotes_preInvoiceId_key" ON "dealer_quotes"("preInvoiceId");

-- CreateIndex
CREATE UNIQUE INDEX "dealer_quotes_invoiceId_key" ON "dealer_quotes"("invoiceId");

-- CreateIndex
CREATE INDEX "dealer_quotes_fiscalStatus_idx" ON "dealer_quotes"("fiscalStatus");

-- CreateIndex
CREATE INDEX "dealer_quotes_empresaId_fiscalStatus_idx" ON "dealer_quotes"("empresaId", "fiscalStatus");

-- CreateIndex
CREATE INDEX "dealer_quotes_salesOrderId_idx" ON "dealer_quotes"("salesOrderId");

-- CreateIndex
CREATE INDEX "dealer_quotes_preInvoiceId_idx" ON "dealer_quotes"("preInvoiceId");

-- CreateIndex
CREATE INDEX "dealer_units_itemId_idx" ON "dealer_units"("itemId");

-- CreateIndex
CREATE INDEX "dealer_units_warehouseId_idx" ON "dealer_units"("warehouseId");

-- AddForeignKey
ALTER TABLE "dealer_quotes" ADD CONSTRAINT "dealer_quotes_salesOrderId_fkey" FOREIGN KEY ("salesOrderId") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dealer_quotes" ADD CONSTRAINT "dealer_quotes_preInvoiceId_fkey" FOREIGN KEY ("preInvoiceId") REFERENCES "pre_invoices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dealer_quotes" ADD CONSTRAINT "dealer_quotes_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "invoices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dealer_units" ADD CONSTRAINT "dealer_units_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dealer_units" ADD CONSTRAINT "dealer_units_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "warehouses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
