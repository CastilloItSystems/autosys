/*
  Warnings:

  - You are about to drop the column `branchId` on the `service_orders` table. All the data in the column will be lost.
  - You are about to drop the column `branchId` on the `workshop_appointments` table. All the data in the column will be lost.
  - You are about to drop the column `branchId` on the `workshop_bays` table. All the data in the column will be lost.
  - You are about to drop the column `branchId` on the `workshop_receptions` table. All the data in the column will be lost.
  - You are about to drop the column `standardLaborPrice` on the `workshop_service_types` table. All the data in the column will be lost.
  - You are about to drop the column `standardMinutes` on the `workshop_service_types` table. All the data in the column will be lost.
  - You are about to drop the `workshop_branches` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `updatedAt` to the `workshop_operations` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "OperationDifficulty" AS ENUM ('BASIC', 'STANDARD', 'ADVANCED', 'SPECIALIST');

-- DropForeignKey
ALTER TABLE "service_orders" DROP CONSTRAINT "service_orders_branchId_fkey";

-- DropForeignKey
ALTER TABLE "workshop_appointments" DROP CONSTRAINT "workshop_appointments_branchId_fkey";

-- DropForeignKey
ALTER TABLE "workshop_bays" DROP CONSTRAINT "workshop_bays_branchId_fkey";

-- DropForeignKey
ALTER TABLE "workshop_branches" DROP CONSTRAINT "workshop_branches_empresaId_fkey";

-- DropForeignKey
ALTER TABLE "workshop_receptions" DROP CONSTRAINT "workshop_receptions_branchId_fkey";

-- AlterTable
ALTER TABLE "service_orders" DROP COLUMN "branchId";

-- AlterTable
ALTER TABLE "workshop_appointments" DROP COLUMN "branchId";

-- AlterTable
ALTER TABLE "workshop_bays" DROP COLUMN "branchId";

-- AlterTable
ALTER TABLE "workshop_operations" ADD COLUMN     "costPrice" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "createdBy" TEXT,
ADD COLUMN     "difficulty" "OperationDifficulty" NOT NULL DEFAULT 'STANDARD',
ADD COLUMN     "isExternalService" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "maxMinutes" INTEGER,
ADD COLUMN     "minMinutes" INTEGER,
ADD COLUMN     "procedure" TEXT,
ADD COLUMN     "requiredEquipment" TEXT,
ADD COLUMN     "requiredSpecialtyId" TEXT,
ADD COLUMN     "tags" TEXT[],
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "warrantyDays" INTEGER,
ADD COLUMN     "warrantyKm" INTEGER;

-- AlterTable
ALTER TABLE "workshop_receptions" DROP COLUMN "branchId";

-- AlterTable
ALTER TABLE "workshop_service_types" DROP COLUMN "standardLaborPrice",
DROP COLUMN "standardMinutes";

-- DropTable
DROP TABLE "workshop_branches";

-- CreateTable
CREATE TABLE "workshop_operation_suggested_materials" (
    "id" TEXT NOT NULL,
    "operationId" TEXT NOT NULL,
    "itemId" TEXT,
    "description" TEXT NOT NULL,
    "quantity" DECIMAL(10,2) NOT NULL DEFAULT 1,
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,

    CONSTRAINT "workshop_operation_suggested_materials_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "workshop_operation_suggested_materials_operationId_idx" ON "workshop_operation_suggested_materials"("operationId");

-- CreateIndex
CREATE INDEX "workshop_operation_suggested_materials_itemId_idx" ON "workshop_operation_suggested_materials"("itemId");

-- CreateIndex
CREATE INDEX "workshop_operations_requiredSpecialtyId_idx" ON "workshop_operations"("requiredSpecialtyId");

-- CreateIndex
CREATE INDEX "workshop_operations_difficulty_idx" ON "workshop_operations"("difficulty");

-- AddForeignKey
ALTER TABLE "workshop_operations" ADD CONSTRAINT "workshop_operations_requiredSpecialtyId_fkey" FOREIGN KEY ("requiredSpecialtyId") REFERENCES "workshop_technician_specialties"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workshop_operation_suggested_materials" ADD CONSTRAINT "workshop_operation_suggested_materials_operationId_fkey" FOREIGN KEY ("operationId") REFERENCES "workshop_operations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workshop_operation_suggested_materials" ADD CONSTRAINT "workshop_operation_suggested_materials_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "items"("id") ON DELETE SET NULL ON UPDATE CASCADE;
