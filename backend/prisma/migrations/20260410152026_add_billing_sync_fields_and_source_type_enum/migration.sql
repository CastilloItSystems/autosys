-- AlterTable
ALTER TABLE "service_order_materials" ADD COLUMN     "quantity" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "total" DECIMAL(12,2) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "workshop_tot" ADD COLUMN     "quantity" DECIMAL(12,2) NOT NULL DEFAULT 1,
ADD COLUMN     "total" DECIMAL(12,2) NOT NULL DEFAULT 0;
