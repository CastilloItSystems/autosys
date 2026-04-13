-- AlterTable
ALTER TABLE "items" ADD COLUMN     "taxRate" DECIMAL(5,2) NOT NULL DEFAULT 0.16,
ADD COLUMN     "taxType" "TaxType" NOT NULL DEFAULT 'IVA';

-- AlterTable
ALTER TABLE "workshop_operations" ADD COLUMN     "taxRate" DECIMAL(5,2) NOT NULL DEFAULT 0.16,
ADD COLUMN     "taxType" "TaxType" NOT NULL DEFAULT 'IVA';
