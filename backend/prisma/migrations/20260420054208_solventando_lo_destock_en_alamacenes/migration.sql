-- AlterTable
ALTER TABLE "transfers" ADD COLUMN     "preInvoiceId" TEXT;

-- AlterTable
ALTER TABLE "warehouses" ADD COLUMN     "isSalesDefault" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "transfers_preInvoiceId_idx" ON "transfers"("preInvoiceId");

-- CreateIndex
CREATE INDEX "warehouses_isSalesDefault_idx" ON "warehouses"("isSalesDefault");

-- AddForeignKey
ALTER TABLE "transfers" ADD CONSTRAINT "transfers_preInvoiceId_fkey" FOREIGN KEY ("preInvoiceId") REFERENCES "pre_invoices"("id") ON DELETE SET NULL ON UPDATE CASCADE;
