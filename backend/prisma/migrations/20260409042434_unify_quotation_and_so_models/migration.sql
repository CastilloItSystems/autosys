/*
  Warnings:

  - You are about to drop the column `discount` on the `workshop_quotation_items` table. All the data in the column will be lost.
  - You are about to drop the column `tax` on the `workshop_quotation_items` table. All the data in the column will be lost.
  - You are about to drop the column `tax` on the `workshop_quotations` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "service_orders" ADD COLUMN     "discount" DECIMAL(12,2) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "workshop_quotation_items" DROP COLUMN "discount",
DROP COLUMN "tax",
ADD COLUMN     "discountPct" DECIMAL(5,2) NOT NULL DEFAULT 0,
ADD COLUMN     "taxAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "taxRate" DECIMAL(5,2) NOT NULL DEFAULT 0.16,
ADD COLUMN     "taxType" "TaxType" NOT NULL DEFAULT 'IVA';

-- AlterTable
ALTER TABLE "workshop_quotations" DROP COLUMN "tax",
ADD COLUMN     "laborTotal" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "otherTotal" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "partsTotal" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "taxAmt" DECIMAL(12,2) NOT NULL DEFAULT 0;
