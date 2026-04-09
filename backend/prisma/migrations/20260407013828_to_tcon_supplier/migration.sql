/*
  Warnings:

  - You are about to drop the column `providerId` on the `workshop_tot` table. All the data in the column will be lost.
  - You are about to drop the `workshop_tot_providers` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "workshop_tot" DROP CONSTRAINT "workshop_tot_providerId_fkey";

-- DropForeignKey
ALTER TABLE "workshop_tot_providers" DROP CONSTRAINT "workshop_tot_providers_empresaId_fkey";

-- DropIndex
DROP INDEX "workshop_tot_providerId_idx";

-- AlterTable
ALTER TABLE "suppliers" ADD COLUMN     "specialty" TEXT;

-- AlterTable
ALTER TABLE "workshop_tot" DROP COLUMN "providerId",
ADD COLUMN     "supplierId" TEXT;

-- DropTable
DROP TABLE "workshop_tot_providers";

-- CreateIndex
CREATE INDEX "workshop_tot_supplierId_idx" ON "workshop_tot"("supplierId");

-- AddForeignKey
ALTER TABLE "workshop_tot" ADD CONSTRAINT "workshop_tot_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
