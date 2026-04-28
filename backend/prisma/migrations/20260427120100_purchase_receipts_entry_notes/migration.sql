-- AlterTable
ALTER TABLE "supplier_bills" ALTER COLUMN "billNumber" DROP NOT NULL;
ALTER TABLE "supplier_bills" ALTER COLUMN "status" SET DEFAULT 'PENDING_INVOICE';
ALTER TABLE "supplier_bills" ALTER COLUMN "issueDate" DROP NOT NULL;

-- AlterTable
ALTER TABLE "entry_notes" ADD COLUMN "supplierBillId" TEXT;

-- CreateIndex
CREATE INDEX "entry_notes_supplierBillId_idx" ON "entry_notes"("supplierBillId");

-- CreateIndex
CREATE INDEX "supplier_bills_purchaseOrderId_status_idx" ON "supplier_bills"("purchaseOrderId", "status");

-- AddForeignKey
ALTER TABLE "entry_notes" ADD CONSTRAINT "entry_notes_supplierBillId_fkey" FOREIGN KEY ("supplierBillId") REFERENCES "supplier_bills"("id") ON DELETE SET NULL ON UPDATE CASCADE;
