-- AlterTable
ALTER TABLE "items" ADD COLUMN     "lastSupplierId" TEXT;

-- AlterTable
ALTER TABLE "suppliers" ADD COLUMN     "isGenericDefault" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "item_suppliers" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "lastPurchasedAt" TIMESTAMP(3),
    "lastUnitCost" DECIMAL(12,2),
    "purchaseCount" INTEGER NOT NULL DEFAULT 0,
    "isPreferred" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "item_suppliers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "item_suppliers_empresaId_idx" ON "item_suppliers"("empresaId");

-- CreateIndex
CREATE INDEX "item_suppliers_itemId_idx" ON "item_suppliers"("itemId");

-- CreateIndex
CREATE INDEX "item_suppliers_supplierId_idx" ON "item_suppliers"("supplierId");

-- CreateIndex
CREATE INDEX "item_suppliers_isPreferred_idx" ON "item_suppliers"("isPreferred");

-- CreateIndex
CREATE INDEX "item_suppliers_lastPurchasedAt_idx" ON "item_suppliers"("lastPurchasedAt");

-- CreateIndex
CREATE UNIQUE INDEX "item_supplier_empresa_unique" ON "item_suppliers"("itemId", "supplierId", "empresaId");

-- CreateIndex
CREATE INDEX "items_lastSupplierId_idx" ON "items"("lastSupplierId");

-- CreateIndex
CREATE INDEX "suppliers_isGenericDefault_idx" ON "suppliers"("isGenericDefault");

-- CreateIndex
CREATE INDEX "suppliers_empresaId_isGenericDefault_idx" ON "suppliers"("empresaId", "isGenericDefault");

-- AddForeignKey
ALTER TABLE "items" ADD CONSTRAINT "items_lastSupplierId_fkey" FOREIGN KEY ("lastSupplierId") REFERENCES "suppliers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_suppliers" ADD CONSTRAINT "item_suppliers_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_suppliers" ADD CONSTRAINT "item_suppliers_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_suppliers" ADD CONSTRAINT "item_suppliers_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id_empresa") ON DELETE RESTRICT ON UPDATE CASCADE;
