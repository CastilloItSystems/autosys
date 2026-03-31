-- DropForeignKey
ALTER TABLE "invoice_items" DROP CONSTRAINT "invoice_items_itemId_fkey";

-- DropForeignKey
ALTER TABLE "pre_invoice_items" DROP CONSTRAINT "pre_invoice_items_itemId_fkey";

-- AlterTable
ALTER TABLE "invoice_items" ALTER COLUMN "itemId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "pre_invoice_items" ALTER COLUMN "itemId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pre_invoice_items" ADD CONSTRAINT "pre_invoice_items_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "items"("id") ON DELETE SET NULL ON UPDATE CASCADE;
