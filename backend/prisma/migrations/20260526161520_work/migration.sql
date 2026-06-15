-- CreateEnum
CREATE TYPE "ReturnedPartCondition" AS ENUM ('WHOLE', 'DAMAGED', 'IN_PIECES', 'REPLACED', 'OTHER');

-- CreateEnum
CREATE TYPE "MaterialSignerRole" AS ENUM ('STOREKEEPER', 'SHOP_FOREMAN', 'ADVISOR', 'TECHNICIAN');

-- CreateEnum
CREATE TYPE "PostRepairScanResult" AS ENUM ('PASS', 'FAIL', 'WITH_OBSERVATIONS');

-- CreateEnum
CREATE TYPE "RoadTestStatus" AS ENUM ('DRAFT', 'AUTHORIZED', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "RoadTestResult" AS ENUM ('PASS', 'FAIL', 'WITH_OBSERVATIONS');

-- AlterTable
ALTER TABLE "workshop_attachments" ADD COLUMN     "isPhysicalFile" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "workshop_audit_logs" ADD COLUMN     "authorizationLevel" INTEGER;

-- AlterTable
ALTER TABLE "workshop_bays" ADD COLUMN     "bayType" TEXT;

-- AlterTable
ALTER TABLE "workshop_service_types" ADD COLUMN     "requiresElectronicScan" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "requiresQualityCheck" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "workshop_so_status_history" ADD COLUMN     "authorizationLevel" INTEGER;

-- AlterTable
ALTER TABLE "workshop_vehicle_deliveries" ADD COLUMN     "substitutedPartsReturned" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "workshop_delivery_returned_parts" (
    "id" TEXT NOT NULL,
    "deliveryId" TEXT NOT NULL,
    "materialId" TEXT,
    "description" TEXT NOT NULL,
    "quantity" DECIMAL(12,2) NOT NULL DEFAULT 1,
    "condition" "ReturnedPartCondition" NOT NULL DEFAULT 'WHOLE',
    "clientAcknowledged" BOOLEAN NOT NULL DEFAULT false,
    "clientAcknowledgedAt" TIMESTAMP(3),
    "clientSignature" TEXT,
    "photoUrl" TEXT,
    "notes" TEXT,
    "empresaId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workshop_delivery_returned_parts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workshop_material_signatures" (
    "id" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "signerRole" "MaterialSignerRole" NOT NULL,
    "signerId" TEXT NOT NULL,
    "signerName" TEXT,
    "signatureUrl" TEXT,
    "signedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "empresaId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workshop_material_signatures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workshop_post_repair_scans" (
    "id" TEXT NOT NULL,
    "serviceOrderId" TEXT NOT NULL,
    "technicianId" TEXT NOT NULL,
    "technicianName" TEXT,
    "performedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dtcCodesCleared" JSONB,
    "parametersVerified" JSONB,
    "result" "PostRepairScanResult" NOT NULL,
    "reportUrl" TEXT,
    "reportPrinted" BOOLEAN NOT NULL DEFAULT false,
    "observations" TEXT,
    "empresaId" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workshop_post_repair_scans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workshop_road_tests" (
    "id" TEXT NOT NULL,
    "serviceOrderId" TEXT NOT NULL,
    "exitPassRef" TEXT,
    "motive" TEXT NOT NULL,
    "notes" TEXT,
    "driverId" TEXT NOT NULL,
    "driverName" TEXT,
    "technicianId" TEXT NOT NULL,
    "technicianName" TEXT,
    "authManagerId" TEXT,
    "authManagerAt" TIMESTAMP(3),
    "authAdvisorId" TEXT,
    "authAdvisorAt" TIMESTAMP(3),
    "authShopForemanId" TEXT,
    "authShopForemanAt" TIMESTAMP(3),
    "clientAuthorized" BOOLEAN NOT NULL DEFAULT false,
    "clientAuthorizedAt" TIMESTAMP(3),
    "clientAuthName" TEXT,
    "clientAuthSignature" TEXT,
    "kmDeparture" INTEGER,
    "kmReturn" INTEGER,
    "departedAt" TIMESTAMP(3),
    "returnedAt" TIMESTAMP(3),
    "result" "RoadTestResult",
    "leaksDetected" BOOLEAN DEFAULT false,
    "integrityVerified" BOOLEAN DEFAULT false,
    "observations" TEXT,
    "status" "RoadTestStatus" NOT NULL DEFAULT 'DRAFT',
    "garitaOutId" TEXT,
    "garitaInId" TEXT,
    "empresaId" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workshop_road_tests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "workshop_delivery_returned_parts_deliveryId_idx" ON "workshop_delivery_returned_parts"("deliveryId");

-- CreateIndex
CREATE INDEX "workshop_delivery_returned_parts_empresaId_idx" ON "workshop_delivery_returned_parts"("empresaId");

-- CreateIndex
CREATE INDEX "workshop_material_signatures_materialId_idx" ON "workshop_material_signatures"("materialId");

-- CreateIndex
CREATE INDEX "workshop_material_signatures_empresaId_idx" ON "workshop_material_signatures"("empresaId");

-- CreateIndex
CREATE UNIQUE INDEX "workshop_material_signatures_materialId_signerRole_key" ON "workshop_material_signatures"("materialId", "signerRole");

-- CreateIndex
CREATE INDEX "workshop_post_repair_scans_serviceOrderId_idx" ON "workshop_post_repair_scans"("serviceOrderId");

-- CreateIndex
CREATE INDEX "workshop_post_repair_scans_empresaId_idx" ON "workshop_post_repair_scans"("empresaId");

-- CreateIndex
CREATE INDEX "workshop_post_repair_scans_result_idx" ON "workshop_post_repair_scans"("result");

-- CreateIndex
CREATE INDEX "workshop_road_tests_serviceOrderId_idx" ON "workshop_road_tests"("serviceOrderId");

-- CreateIndex
CREATE INDEX "workshop_road_tests_empresaId_idx" ON "workshop_road_tests"("empresaId");

-- CreateIndex
CREATE INDEX "workshop_road_tests_status_idx" ON "workshop_road_tests"("status");

-- AddForeignKey
ALTER TABLE "workshop_delivery_returned_parts" ADD CONSTRAINT "workshop_delivery_returned_parts_deliveryId_fkey" FOREIGN KEY ("deliveryId") REFERENCES "workshop_vehicle_deliveries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workshop_delivery_returned_parts" ADD CONSTRAINT "workshop_delivery_returned_parts_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id_empresa") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workshop_material_signatures" ADD CONSTRAINT "workshop_material_signatures_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "service_order_materials"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workshop_material_signatures" ADD CONSTRAINT "workshop_material_signatures_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id_empresa") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workshop_post_repair_scans" ADD CONSTRAINT "workshop_post_repair_scans_serviceOrderId_fkey" FOREIGN KEY ("serviceOrderId") REFERENCES "service_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workshop_post_repair_scans" ADD CONSTRAINT "workshop_post_repair_scans_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id_empresa") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workshop_road_tests" ADD CONSTRAINT "workshop_road_tests_serviceOrderId_fkey" FOREIGN KEY ("serviceOrderId") REFERENCES "service_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workshop_road_tests" ADD CONSTRAINT "workshop_road_tests_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id_empresa") ON DELETE RESTRICT ON UPDATE CASCADE;
