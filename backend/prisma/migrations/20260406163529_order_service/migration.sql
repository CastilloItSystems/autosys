-- AlterTable
ALTER TABLE "service_order_items" ADD COLUMN     "technicianId" TEXT,
ADD COLUMN     "unitCost" DECIMAL(12,2) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "service_orders" ADD COLUMN     "consolidatedPreInvoiceId" TEXT;

-- AddForeignKey
ALTER TABLE "service_orders" ADD CONSTRAINT "service_orders_consolidatedPreInvoiceId_fkey" FOREIGN KEY ("consolidatedPreInvoiceId") REFERENCES "pre_invoices"("id") ON DELETE SET NULL ON UPDATE CASCADE;
