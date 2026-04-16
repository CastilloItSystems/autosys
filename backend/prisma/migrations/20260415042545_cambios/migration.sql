/*
  Warnings:

  - A unique constraint covering the columns `[serviceOrderMaterialId]` on the table `exit_notes` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
ALTER TYPE "ExitType" ADD VALUE 'WORKSHOP_SUPPLY';

-- AlterTable
ALTER TABLE "exit_notes" ADD COLUMN     "serviceOrderMaterialId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "exit_notes_serviceOrderMaterialId_key" ON "exit_notes"("serviceOrderMaterialId");

-- CreateIndex
CREATE INDEX "exit_notes_serviceOrderMaterialId_idx" ON "exit_notes"("serviceOrderMaterialId");

-- AddForeignKey
ALTER TABLE "exit_notes" ADD CONSTRAINT "exit_notes_serviceOrderMaterialId_fkey" FOREIGN KEY ("serviceOrderMaterialId") REFERENCES "service_order_materials"("id") ON DELETE SET NULL ON UPDATE CASCADE;
