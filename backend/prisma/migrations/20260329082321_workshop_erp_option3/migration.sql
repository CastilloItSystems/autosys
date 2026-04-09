-- CreateEnum
CREATE TYPE "ChecklistCategory" AS ENUM ('RECEPTION', 'DIAGNOSIS', 'QUALITY_CONTROL');

-- CreateEnum
CREATE TYPE "ChecklistItemType" AS ENUM ('BOOLEAN', 'TEXT', 'NUMBER', 'SELECTION');

-- CreateEnum
CREATE TYPE "DiagnosisStatus" AS ENUM ('DRAFT', 'COMPLETED', 'APPROVED_INTERNAL');

-- CreateEnum
CREATE TYPE "DiagnosisFindingSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- AlterTable
ALTER TABLE "workshop_quality_checks" ADD COLUMN     "checklistTemplateId" TEXT;

-- AlterTable
ALTER TABLE "workshop_receptions" ADD COLUMN     "checklistTemplateId" TEXT;

-- CreateTable
CREATE TABLE "ChecklistTemplate" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" "ChecklistCategory" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "empresaId" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChecklistTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChecklistItem" (
    "id" TEXT NOT NULL,
    "checklistTemplateId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "responseType" "ChecklistItemType" NOT NULL DEFAULT 'BOOLEAN',
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "options" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "empresaId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChecklistItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChecklistResponse" (
    "id" TEXT NOT NULL,
    "checklistItemId" TEXT NOT NULL,
    "receptionId" TEXT,
    "qualityCheckId" TEXT,
    "boolValue" BOOLEAN,
    "textValue" TEXT,
    "numValue" DECIMAL(12,2),
    "selectionValue" TEXT,
    "observation" TEXT,
    "empresaId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChecklistResponse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceDiagnosis" (
    "id" TEXT NOT NULL,
    "receptionId" TEXT,
    "serviceOrderId" TEXT,
    "technicianId" TEXT,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "generalNotes" TEXT,
    "severity" "DiagnosisFindingSeverity" NOT NULL DEFAULT 'LOW',
    "status" "DiagnosisStatus" NOT NULL DEFAULT 'DRAFT',
    "empresaId" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceDiagnosis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiagnosisFinding" (
    "id" TEXT NOT NULL,
    "diagnosisId" TEXT NOT NULL,
    "category" TEXT,
    "description" TEXT NOT NULL,
    "severity" "DiagnosisFindingSeverity" NOT NULL DEFAULT 'MEDIUM',
    "requiresClientAuth" BOOLEAN NOT NULL DEFAULT true,
    "clientApproved" BOOLEAN,
    "observation" TEXT,
    "empresaId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DiagnosisFinding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiagnosisSuggestedOperation" (
    "id" TEXT NOT NULL,
    "diagnosisId" TEXT NOT NULL,
    "operationId" TEXT,
    "description" TEXT NOT NULL,
    "estimatedMins" INTEGER NOT NULL DEFAULT 0,
    "estimatedPrice" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "approved" BOOLEAN NOT NULL DEFAULT false,
    "empresaId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DiagnosisSuggestedOperation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiagnosisSuggestedPart" (
    "id" TEXT NOT NULL,
    "diagnosisId" TEXT NOT NULL,
    "itemId" TEXT,
    "description" TEXT NOT NULL,
    "quantity" DECIMAL(12,2) NOT NULL DEFAULT 1,
    "estimatedCost" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "estimatedPrice" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "approved" BOOLEAN NOT NULL DEFAULT false,
    "empresaId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DiagnosisSuggestedPart_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiagnosisEvidence" (
    "id" TEXT NOT NULL,
    "diagnosisId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "description" TEXT,
    "empresaId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DiagnosisEvidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceOrderStatusHistory" (
    "id" TEXT NOT NULL,
    "serviceOrderId" TEXT NOT NULL,
    "previousStatus" "ServiceOrderStatus",
    "newStatus" "ServiceOrderStatus" NOT NULL,
    "comment" TEXT,
    "userId" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ServiceOrderStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppointmentStatusHistory" (
    "id" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "previousStatus" "AppointmentStatus",
    "newStatus" "AppointmentStatus" NOT NULL,
    "comment" TEXT,
    "userId" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AppointmentStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VehicleDelivery" (
    "id" TEXT NOT NULL,
    "serviceOrderId" TEXT NOT NULL,
    "deliveredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deliveredBy" TEXT NOT NULL,
    "receivedByName" TEXT,
    "clientConformity" BOOLEAN NOT NULL DEFAULT true,
    "clientSignature" TEXT,
    "observations" TEXT,
    "nextVisitDate" TIMESTAMP(3),
    "empresaId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VehicleDelivery_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ChecklistTemplate_empresaId_idx" ON "ChecklistTemplate"("empresaId");

-- CreateIndex
CREATE UNIQUE INDEX "ChecklistTemplate_empresaId_code_key" ON "ChecklistTemplate"("empresaId", "code");

-- CreateIndex
CREATE INDEX "ChecklistItem_empresaId_idx" ON "ChecklistItem"("empresaId");

-- CreateIndex
CREATE UNIQUE INDEX "ChecklistItem_checklistTemplateId_code_key" ON "ChecklistItem"("checklistTemplateId", "code");

-- CreateIndex
CREATE INDEX "ChecklistResponse_empresaId_idx" ON "ChecklistResponse"("empresaId");

-- CreateIndex
CREATE INDEX "ChecklistResponse_receptionId_idx" ON "ChecklistResponse"("receptionId");

-- CreateIndex
CREATE INDEX "ChecklistResponse_qualityCheckId_idx" ON "ChecklistResponse"("qualityCheckId");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceDiagnosis_receptionId_key" ON "ServiceDiagnosis"("receptionId");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceDiagnosis_serviceOrderId_key" ON "ServiceDiagnosis"("serviceOrderId");

-- CreateIndex
CREATE INDEX "ServiceDiagnosis_empresaId_idx" ON "ServiceDiagnosis"("empresaId");

-- CreateIndex
CREATE INDEX "DiagnosisFinding_empresaId_idx" ON "DiagnosisFinding"("empresaId");

-- CreateIndex
CREATE INDEX "DiagnosisSuggestedOperation_empresaId_idx" ON "DiagnosisSuggestedOperation"("empresaId");

-- CreateIndex
CREATE INDEX "DiagnosisSuggestedPart_empresaId_idx" ON "DiagnosisSuggestedPart"("empresaId");

-- CreateIndex
CREATE INDEX "DiagnosisEvidence_empresaId_idx" ON "DiagnosisEvidence"("empresaId");

-- CreateIndex
CREATE INDEX "ServiceOrderStatusHistory_serviceOrderId_idx" ON "ServiceOrderStatusHistory"("serviceOrderId");

-- CreateIndex
CREATE INDEX "ServiceOrderStatusHistory_empresaId_idx" ON "ServiceOrderStatusHistory"("empresaId");

-- CreateIndex
CREATE INDEX "AppointmentStatusHistory_appointmentId_idx" ON "AppointmentStatusHistory"("appointmentId");

-- CreateIndex
CREATE INDEX "AppointmentStatusHistory_empresaId_idx" ON "AppointmentStatusHistory"("empresaId");

-- CreateIndex
CREATE UNIQUE INDEX "VehicleDelivery_serviceOrderId_key" ON "VehicleDelivery"("serviceOrderId");

-- CreateIndex
CREATE INDEX "VehicleDelivery_empresaId_idx" ON "VehicleDelivery"("empresaId");

-- AddForeignKey
ALTER TABLE "ChecklistTemplate" ADD CONSTRAINT "ChecklistTemplate_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id_empresa") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChecklistItem" ADD CONSTRAINT "ChecklistItem_checklistTemplateId_fkey" FOREIGN KEY ("checklistTemplateId") REFERENCES "ChecklistTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChecklistItem" ADD CONSTRAINT "ChecklistItem_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id_empresa") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChecklistResponse" ADD CONSTRAINT "ChecklistResponse_checklistItemId_fkey" FOREIGN KEY ("checklistItemId") REFERENCES "ChecklistItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChecklistResponse" ADD CONSTRAINT "ChecklistResponse_receptionId_fkey" FOREIGN KEY ("receptionId") REFERENCES "workshop_receptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChecklistResponse" ADD CONSTRAINT "ChecklistResponse_qualityCheckId_fkey" FOREIGN KEY ("qualityCheckId") REFERENCES "workshop_quality_checks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChecklistResponse" ADD CONSTRAINT "ChecklistResponse_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id_empresa") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workshop_quality_checks" ADD CONSTRAINT "workshop_quality_checks_checklistTemplateId_fkey" FOREIGN KEY ("checklistTemplateId") REFERENCES "ChecklistTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceDiagnosis" ADD CONSTRAINT "ServiceDiagnosis_receptionId_fkey" FOREIGN KEY ("receptionId") REFERENCES "workshop_receptions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceDiagnosis" ADD CONSTRAINT "ServiceDiagnosis_serviceOrderId_fkey" FOREIGN KEY ("serviceOrderId") REFERENCES "service_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceDiagnosis" ADD CONSTRAINT "ServiceDiagnosis_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id_empresa") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiagnosisFinding" ADD CONSTRAINT "DiagnosisFinding_diagnosisId_fkey" FOREIGN KEY ("diagnosisId") REFERENCES "ServiceDiagnosis"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiagnosisFinding" ADD CONSTRAINT "DiagnosisFinding_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id_empresa") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiagnosisSuggestedOperation" ADD CONSTRAINT "DiagnosisSuggestedOperation_diagnosisId_fkey" FOREIGN KEY ("diagnosisId") REFERENCES "ServiceDiagnosis"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiagnosisSuggestedOperation" ADD CONSTRAINT "DiagnosisSuggestedOperation_operationId_fkey" FOREIGN KEY ("operationId") REFERENCES "workshop_operations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiagnosisSuggestedOperation" ADD CONSTRAINT "DiagnosisSuggestedOperation_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id_empresa") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiagnosisSuggestedPart" ADD CONSTRAINT "DiagnosisSuggestedPart_diagnosisId_fkey" FOREIGN KEY ("diagnosisId") REFERENCES "ServiceDiagnosis"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiagnosisSuggestedPart" ADD CONSTRAINT "DiagnosisSuggestedPart_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiagnosisSuggestedPart" ADD CONSTRAINT "DiagnosisSuggestedPart_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id_empresa") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiagnosisEvidence" ADD CONSTRAINT "DiagnosisEvidence_diagnosisId_fkey" FOREIGN KEY ("diagnosisId") REFERENCES "ServiceDiagnosis"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiagnosisEvidence" ADD CONSTRAINT "DiagnosisEvidence_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id_empresa") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceOrderStatusHistory" ADD CONSTRAINT "ServiceOrderStatusHistory_serviceOrderId_fkey" FOREIGN KEY ("serviceOrderId") REFERENCES "service_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceOrderStatusHistory" ADD CONSTRAINT "ServiceOrderStatusHistory_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id_empresa") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppointmentStatusHistory" ADD CONSTRAINT "AppointmentStatusHistory_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "workshop_appointments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppointmentStatusHistory" ADD CONSTRAINT "AppointmentStatusHistory_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id_empresa") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehicleDelivery" ADD CONSTRAINT "VehicleDelivery_serviceOrderId_fkey" FOREIGN KEY ("serviceOrderId") REFERENCES "service_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehicleDelivery" ADD CONSTRAINT "VehicleDelivery_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id_empresa") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workshop_receptions" ADD CONSTRAINT "workshop_receptions_checklistTemplateId_fkey" FOREIGN KEY ("checklistTemplateId") REFERENCES "ChecklistTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;
