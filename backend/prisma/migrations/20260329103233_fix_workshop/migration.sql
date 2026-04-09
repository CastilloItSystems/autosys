-- DropForeignKey
ALTER TABLE "pre_invoices" DROP CONSTRAINT "pre_invoices_warehouseId_fkey";

-- AlterTable
ALTER TABLE "crm_quotes" ADD COLUMN     "convertedToSOId" TEXT,
ADD COLUMN     "diagnosisRecommendation" TEXT,
ADD COLUMN     "estimatedLaborHours" DECIMAL(10,2),
ADD COLUMN     "isWorkshopQuote" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "vehicleReceptionNotes" TEXT,
ADD COLUMN     "workshopApprovalFlow" TEXT;

-- AlterTable
ALTER TABLE "pre_invoices" ALTER COLUMN "orderId" DROP NOT NULL,
ALTER COLUMN "warehouseId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "service_order_items" ADD COLUMN     "notes" TEXT,
ADD COLUMN     "taxAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "taxRate" DECIMAL(5,2) NOT NULL DEFAULT 0.16,
ADD COLUMN     "taxType" "TaxType" NOT NULL DEFAULT 'IVA';

-- AddForeignKey
ALTER TABLE "pre_invoices" ADD CONSTRAINT "pre_invoices_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "warehouses"("id") ON DELETE SET NULL ON UPDATE CASCADE;
