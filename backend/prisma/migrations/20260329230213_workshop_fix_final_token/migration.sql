-- CreateEnum
CREATE TYPE "MaterialMovementType" AS ENUM ('RESERVATION', 'DISPATCH', 'CONSUMPTION', 'RETURN', 'ADJUSTMENT', 'CANCELLATION');

-- CreateEnum
CREATE TYPE "DamageSeverity" AS ENUM ('MINOR', 'MODERATE', 'SEVERE');

-- CreateEnum
CREATE TYPE "ReceptionPhotoType" AS ENUM ('FRONTAL', 'REAR', 'LEFT', 'RIGHT', 'INTERIOR', 'DAMAGE', 'DOCUMENT', 'OTHER');

-- CreateEnum
CREATE TYPE "AttachmentEntityType" AS ENUM ('SERVICE_ORDER', 'VEHICLE_RECEPTION', 'SERVICE_DIAGNOSIS', 'WORKSHOP_WARRANTY', 'SERVICE_APPOINTMENT', 'QUALITY_CHECK');

-- CreateEnum
CREATE TYPE "AttachmentFileType" AS ENUM ('IMAGE', 'VIDEO', 'PDF', 'DOCUMENT', 'OTHER');

-- CreateEnum
CREATE TYPE "WarrantyResponsibleCost" AS ENUM ('COMPANY', 'SUPPLIER', 'MANUFACTURER', 'INSURER', 'CLIENT');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "WarrantyType" ADD VALUE 'FACTORY';
ALTER TYPE "WarrantyType" ADD VALUE 'SUPPLIER';
ALTER TYPE "WarrantyType" ADD VALUE 'CAMPAIGN';

-- AlterTable
ALTER TABLE "workshop_warranties" ADD COLUMN     "responsibleForCost" "WarrantyResponsibleCost" NOT NULL DEFAULT 'COMPANY';

-- CreateTable
CREATE TABLE "workshop_material_movements" (
    "id" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "type" "MaterialMovementType" NOT NULL,
    "quantity" DECIMAL(12,2) NOT NULL,
    "previousQuantity" DECIMAL(12,2),
    "warehouseId" TEXT,
    "warehouseName" TEXT,
    "userId" TEXT NOT NULL,
    "notes" TEXT,
    "referenceId" TEXT,
    "empresaId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workshop_material_movements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workshop_reception_damages" (
    "id" TEXT NOT NULL,
    "receptionId" TEXT NOT NULL,
    "zone" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "severity" "DamageSeverity" NOT NULL DEFAULT 'MINOR',
    "photoUrl" TEXT,
    "empresaId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workshop_reception_damages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workshop_reception_photos" (
    "id" TEXT NOT NULL,
    "receptionId" TEXT NOT NULL,
    "type" "ReceptionPhotoType" NOT NULL DEFAULT 'OTHER',
    "url" TEXT NOT NULL,
    "description" TEXT,
    "empresaId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workshop_reception_photos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workshop_attachments" (
    "id" TEXT NOT NULL,
    "entityType" "AttachmentEntityType" NOT NULL,
    "entityId" TEXT NOT NULL,
    "fileType" "AttachmentFileType" NOT NULL DEFAULT 'OTHER',
    "url" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "mimeType" TEXT,
    "sizeBytes" INTEGER,
    "uploadedBy" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workshop_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "workshop_material_movements_materialId_idx" ON "workshop_material_movements"("materialId");

-- CreateIndex
CREATE INDEX "workshop_material_movements_empresaId_idx" ON "workshop_material_movements"("empresaId");

-- CreateIndex
CREATE INDEX "workshop_material_movements_materialId_type_idx" ON "workshop_material_movements"("materialId", "type");

-- CreateIndex
CREATE INDEX "workshop_reception_damages_receptionId_idx" ON "workshop_reception_damages"("receptionId");

-- CreateIndex
CREATE INDEX "workshop_reception_damages_empresaId_idx" ON "workshop_reception_damages"("empresaId");

-- CreateIndex
CREATE INDEX "workshop_reception_photos_receptionId_idx" ON "workshop_reception_photos"("receptionId");

-- CreateIndex
CREATE INDEX "workshop_reception_photos_empresaId_idx" ON "workshop_reception_photos"("empresaId");

-- CreateIndex
CREATE INDEX "workshop_attachments_entityType_entityId_idx" ON "workshop_attachments"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "workshop_attachments_empresaId_idx" ON "workshop_attachments"("empresaId");

-- AddForeignKey
ALTER TABLE "workshop_material_movements" ADD CONSTRAINT "workshop_material_movements_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "service_order_materials"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workshop_material_movements" ADD CONSTRAINT "workshop_material_movements_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id_empresa") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workshop_reception_damages" ADD CONSTRAINT "workshop_reception_damages_receptionId_fkey" FOREIGN KEY ("receptionId") REFERENCES "workshop_receptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workshop_reception_damages" ADD CONSTRAINT "workshop_reception_damages_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id_empresa") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workshop_reception_photos" ADD CONSTRAINT "workshop_reception_photos_receptionId_fkey" FOREIGN KEY ("receptionId") REFERENCES "workshop_receptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workshop_reception_photos" ADD CONSTRAINT "workshop_reception_photos_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id_empresa") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workshop_attachments" ADD CONSTRAINT "workshop_attachments_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id_empresa") ON DELETE RESTRICT ON UPDATE CASCADE;
