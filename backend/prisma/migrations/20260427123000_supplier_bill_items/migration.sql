-- CreateTable
CREATE TABLE "supplier_bill_items" (
    "id" TEXT NOT NULL,
    "supplierBillId" TEXT NOT NULL,
    "itemId" TEXT,
    "itemName" VARCHAR(255),
    "quantity" INTEGER NOT NULL,
    "unitCost" DECIMAL(12,2) NOT NULL,
    "discountPercent" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "discountAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "taxType" "TaxType" NOT NULL DEFAULT 'IVA',
    "taxRate" DECIMAL(5,2) NOT NULL DEFAULT 16,
    "taxAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "subtotal" DECIMAL(12,2) NOT NULL,
    "totalLine" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "supplier_bill_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "supplier_bill_items_supplierBillId_idx" ON "supplier_bill_items"("supplierBillId");

-- CreateIndex
CREATE INDEX "supplier_bill_items_itemId_idx" ON "supplier_bill_items"("itemId");

-- AddForeignKey
ALTER TABLE "supplier_bill_items" ADD CONSTRAINT "supplier_bill_items_supplierBillId_fkey" FOREIGN KEY ("supplierBillId") REFERENCES "supplier_bills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_bill_items" ADD CONSTRAINT "supplier_bill_items_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "items"("id") ON DELETE SET NULL ON UPDATE CASCADE;
