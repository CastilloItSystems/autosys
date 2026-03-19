/*
  Warnings:

  - You are about to drop the column `subtotal` on the `purchase_orders` table. All the data in the column will be lost.
  - You are about to drop the column `tax` on the `purchase_orders` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "PurchaseOrderCurrency" AS ENUM ('USD', 'VES', 'EUR');

-- CreateEnum
CREATE TYPE "TaxType" AS ENUM ('IVA', 'EXEMPT', 'REDUCED');

-- AlterTable
ALTER TABLE "purchase_order_items" ADD COLUMN     "discountAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "discountPercent" DECIMAL(5,2) NOT NULL DEFAULT 0,
ADD COLUMN     "taxAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "taxRate" DECIMAL(5,2) NOT NULL DEFAULT 16,
ADD COLUMN     "taxType" "TaxType" NOT NULL DEFAULT 'IVA',
ADD COLUMN     "totalLine" DECIMAL(12,2) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "purchase_orders" DROP COLUMN "subtotal",
DROP COLUMN "tax",
ADD COLUMN     "baseExenta" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "baseImponible" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "creditDays" INTEGER,
ADD COLUMN     "currency" "PurchaseOrderCurrency" NOT NULL DEFAULT 'USD',
ADD COLUMN     "deliveryTerms" TEXT,
ADD COLUMN     "discountAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "exchangeRate" DECIMAL(14,4),
ADD COLUMN     "igtfAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "igtfApplies" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "igtfRate" DECIMAL(5,2) NOT NULL DEFAULT 3,
ADD COLUMN     "paymentTerms" TEXT,
ADD COLUMN     "subtotalBruto" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "taxAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "taxRate" DECIMAL(5,2) NOT NULL DEFAULT 16;
