/*
  Warnings:

  - Added the required column `empresaId` to the `payments` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "currency" "OrderCurrency" NOT NULL DEFAULT 'USD',
ADD COLUMN     "empresaId" TEXT NOT NULL,
ADD COLUMN     "exchangeRate" DECIMAL(14,4),
ADD COLUMN     "igtfAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "igtfApplies" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "totalWithIgtf" DECIMAL(12,2) NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "payments_preInvoiceId_idx" ON "payments"("preInvoiceId");

-- CreateIndex
CREATE INDEX "payments_empresaId_idx" ON "payments"("empresaId");

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id_empresa") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_preInvoiceId_fkey" FOREIGN KEY ("preInvoiceId") REFERENCES "pre_invoices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
