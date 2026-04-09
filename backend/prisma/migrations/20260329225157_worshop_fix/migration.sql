/*
  Warnings:

  - You are about to drop the `AppointmentStatusHistory` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ChecklistItem` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ChecklistResponse` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ChecklistTemplate` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `DiagnosisEvidence` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `DiagnosisFinding` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `DiagnosisSuggestedOperation` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `DiagnosisSuggestedPart` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ServiceDiagnosis` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ServiceOrderStatusHistory` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `VehicleDelivery` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "ServiceOrderItemStatus" AS ENUM ('PENDING', 'ASSIGNED', 'IN_PROGRESS', 'PAUSED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ReceptionStatus" AS ENUM ('OPEN', 'DIAGNOSING', 'QUOTED', 'CONVERTED_TO_SO', 'CANCELLED');

-- DropForeignKey
ALTER TABLE "AppointmentStatusHistory" DROP CONSTRAINT "AppointmentStatusHistory_appointmentId_fkey";

-- DropForeignKey
ALTER TABLE "AppointmentStatusHistory" DROP CONSTRAINT "AppointmentStatusHistory_empresaId_fkey";

-- DropForeignKey
ALTER TABLE "ChecklistItem" DROP CONSTRAINT "ChecklistItem_checklistTemplateId_fkey";

-- DropForeignKey
ALTER TABLE "ChecklistItem" DROP CONSTRAINT "ChecklistItem_empresaId_fkey";

-- DropForeignKey
ALTER TABLE "ChecklistResponse" DROP CONSTRAINT "ChecklistResponse_checklistItemId_fkey";

-- DropForeignKey
ALTER TABLE "ChecklistResponse" DROP CONSTRAINT "ChecklistResponse_empresaId_fkey";

-- DropForeignKey
ALTER TABLE "ChecklistResponse" DROP CONSTRAINT "ChecklistResponse_qualityCheckId_fkey";

-- DropForeignKey
ALTER TABLE "ChecklistResponse" DROP CONSTRAINT "ChecklistResponse_receptionId_fkey";

-- DropForeignKey
ALTER TABLE "ChecklistTemplate" DROP CONSTRAINT "ChecklistTemplate_empresaId_fkey";

-- DropForeignKey
ALTER TABLE "DiagnosisEvidence" DROP CONSTRAINT "DiagnosisEvidence_diagnosisId_fkey";

-- DropForeignKey
ALTER TABLE "DiagnosisEvidence" DROP CONSTRAINT "DiagnosisEvidence_empresaId_fkey";

-- DropForeignKey
ALTER TABLE "DiagnosisFinding" DROP CONSTRAINT "DiagnosisFinding_diagnosisId_fkey";

-- DropForeignKey
ALTER TABLE "DiagnosisFinding" DROP CONSTRAINT "DiagnosisFinding_empresaId_fkey";

-- DropForeignKey
ALTER TABLE "DiagnosisSuggestedOperation" DROP CONSTRAINT "DiagnosisSuggestedOperation_diagnosisId_fkey";

-- DropForeignKey
ALTER TABLE "DiagnosisSuggestedOperation" DROP CONSTRAINT "DiagnosisSuggestedOperation_empresaId_fkey";

-- DropForeignKey
ALTER TABLE "DiagnosisSuggestedOperation" DROP CONSTRAINT "DiagnosisSuggestedOperation_operationId_fkey";

-- DropForeignKey
ALTER TABLE "DiagnosisSuggestedPart" DROP CONSTRAINT "DiagnosisSuggestedPart_diagnosisId_fkey";

-- DropForeignKey
ALTER TABLE "DiagnosisSuggestedPart" DROP CONSTRAINT "DiagnosisSuggestedPart_empresaId_fkey";

-- DropForeignKey
ALTER TABLE "DiagnosisSuggestedPart" DROP CONSTRAINT "DiagnosisSuggestedPart_itemId_fkey";

-- DropForeignKey
ALTER TABLE "ServiceDiagnosis" DROP CONSTRAINT "ServiceDiagnosis_empresaId_fkey";

-- DropForeignKey
ALTER TABLE "ServiceDiagnosis" DROP CONSTRAINT "ServiceDiagnosis_receptionId_fkey";

-- DropForeignKey
ALTER TABLE "ServiceDiagnosis" DROP CONSTRAINT "ServiceDiagnosis_serviceOrderId_fkey";

-- DropForeignKey
ALTER TABLE "ServiceOrderStatusHistory" DROP CONSTRAINT "ServiceOrderStatusHistory_empresaId_fkey";

-- DropForeignKey
ALTER TABLE "ServiceOrderStatusHistory" DROP CONSTRAINT "ServiceOrderStatusHistory_serviceOrderId_fkey";

-- DropForeignKey
ALTER TABLE "VehicleDelivery" DROP CONSTRAINT "VehicleDelivery_empresaId_fkey";

-- DropForeignKey
ALTER TABLE "VehicleDelivery" DROP CONSTRAINT "VehicleDelivery_serviceOrderId_fkey";

-- DropForeignKey
ALTER TABLE "service_order_additionals" DROP CONSTRAINT "service_order_additionals_diagnosisFindingId_fkey";

-- DropForeignKey
ALTER TABLE "workshop_quality_checks" DROP CONSTRAINT "workshop_quality_checks_checklistTemplateId_fkey";

-- DropForeignKey
ALTER TABLE "workshop_receptions" DROP CONSTRAINT "workshop_receptions_checklistTemplateId_fkey";

-- AlterTable
ALTER TABLE "service_order_items" ADD COLUMN     "itemName" TEXT,
ADD COLUMN     "operationName" TEXT,
ADD COLUMN     "status" "ServiceOrderItemStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "workshop_receptions" ADD COLUMN     "clientSignature" TEXT,
ADD COLUMN     "diagnosticAuthorized" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "status" "ReceptionStatus" NOT NULL DEFAULT 'OPEN';

-- DropTable
DROP TABLE "AppointmentStatusHistory";

-- DropTable
DROP TABLE "ChecklistItem";

-- DropTable
DROP TABLE "ChecklistResponse";

-- DropTable
DROP TABLE "ChecklistTemplate";

-- DropTable
DROP TABLE "DiagnosisEvidence";

-- DropTable
DROP TABLE "DiagnosisFinding";

-- DropTable
DROP TABLE "DiagnosisSuggestedOperation";

-- DropTable
DROP TABLE "DiagnosisSuggestedPart";

-- DropTable
DROP TABLE "ServiceDiagnosis";

-- DropTable
DROP TABLE "ServiceOrderStatusHistory";

-- DropTable
DROP TABLE "VehicleDelivery";

-- CreateTable
CREATE TABLE "workshop_checklist_templates" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" "ChecklistCategory" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "conditionalRules" JSONB,
    "empresaId" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workshop_checklist_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workshop_checklist_items" (
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

    CONSTRAINT "workshop_checklist_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workshop_checklist_responses" (
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

    CONSTRAINT "workshop_checklist_responses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workshop_diagnoses" (
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

    CONSTRAINT "workshop_diagnoses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workshop_diagnosis_findings" (
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

    CONSTRAINT "workshop_diagnosis_findings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workshop_diagnosis_suggested_operations" (
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

    CONSTRAINT "workshop_diagnosis_suggested_operations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workshop_diagnosis_suggested_parts" (
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

    CONSTRAINT "workshop_diagnosis_suggested_parts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workshop_diagnosis_evidences" (
    "id" TEXT NOT NULL,
    "diagnosisId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "description" TEXT,
    "empresaId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workshop_diagnosis_evidences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workshop_so_status_history" (
    "id" TEXT NOT NULL,
    "serviceOrderId" TEXT NOT NULL,
    "previousStatus" "ServiceOrderStatus",
    "newStatus" "ServiceOrderStatus" NOT NULL,
    "comment" TEXT,
    "userId" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workshop_so_status_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workshop_appointment_status_history" (
    "id" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "previousStatus" "AppointmentStatus",
    "newStatus" "AppointmentStatus" NOT NULL,
    "comment" TEXT,
    "userId" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workshop_appointment_status_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workshop_vehicle_deliveries" (
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

    CONSTRAINT "workshop_vehicle_deliveries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "workshop_checklist_templates_empresaId_idx" ON "workshop_checklist_templates"("empresaId");

-- CreateIndex
CREATE UNIQUE INDEX "workshop_checklist_templates_empresaId_code_key" ON "workshop_checklist_templates"("empresaId", "code");

-- CreateIndex
CREATE INDEX "workshop_checklist_items_empresaId_idx" ON "workshop_checklist_items"("empresaId");

-- CreateIndex
CREATE UNIQUE INDEX "workshop_checklist_items_checklistTemplateId_code_key" ON "workshop_checklist_items"("checklistTemplateId", "code");

-- CreateIndex
CREATE INDEX "workshop_checklist_responses_empresaId_idx" ON "workshop_checklist_responses"("empresaId");

-- CreateIndex
CREATE INDEX "workshop_checklist_responses_receptionId_idx" ON "workshop_checklist_responses"("receptionId");

-- CreateIndex
CREATE INDEX "workshop_checklist_responses_qualityCheckId_idx" ON "workshop_checklist_responses"("qualityCheckId");

-- CreateIndex
CREATE UNIQUE INDEX "workshop_diagnoses_receptionId_key" ON "workshop_diagnoses"("receptionId");

-- CreateIndex
CREATE UNIQUE INDEX "workshop_diagnoses_serviceOrderId_key" ON "workshop_diagnoses"("serviceOrderId");

-- CreateIndex
CREATE INDEX "workshop_diagnoses_empresaId_idx" ON "workshop_diagnoses"("empresaId");

-- CreateIndex
CREATE INDEX "workshop_diagnosis_findings_empresaId_idx" ON "workshop_diagnosis_findings"("empresaId");

-- CreateIndex
CREATE INDEX "workshop_diagnosis_suggested_operations_empresaId_idx" ON "workshop_diagnosis_suggested_operations"("empresaId");

-- CreateIndex
CREATE INDEX "workshop_diagnosis_suggested_parts_empresaId_idx" ON "workshop_diagnosis_suggested_parts"("empresaId");

-- CreateIndex
CREATE INDEX "workshop_diagnosis_evidences_empresaId_idx" ON "workshop_diagnosis_evidences"("empresaId");

-- CreateIndex
CREATE INDEX "workshop_so_status_history_serviceOrderId_idx" ON "workshop_so_status_history"("serviceOrderId");

-- CreateIndex
CREATE INDEX "workshop_so_status_history_empresaId_idx" ON "workshop_so_status_history"("empresaId");

-- CreateIndex
CREATE INDEX "workshop_appointment_status_history_appointmentId_idx" ON "workshop_appointment_status_history"("appointmentId");

-- CreateIndex
CREATE INDEX "workshop_appointment_status_history_empresaId_idx" ON "workshop_appointment_status_history"("empresaId");

-- CreateIndex
CREATE UNIQUE INDEX "workshop_vehicle_deliveries_serviceOrderId_key" ON "workshop_vehicle_deliveries"("serviceOrderId");

-- CreateIndex
CREATE INDEX "workshop_vehicle_deliveries_empresaId_idx" ON "workshop_vehicle_deliveries"("empresaId");

-- CreateIndex
CREATE INDEX "service_order_items_serviceOrderId_status_idx" ON "service_order_items"("serviceOrderId", "status");

-- CreateIndex
CREATE INDEX "service_order_materials_serviceOrderId_status_idx" ON "service_order_materials"("serviceOrderId", "status");

-- CreateIndex
CREATE INDEX "service_orders_empresaId_status_receivedAt_idx" ON "service_orders"("empresaId", "status", "receivedAt");

-- CreateIndex
CREATE INDEX "workshop_appointments_empresaId_scheduledDate_status_idx" ON "workshop_appointments"("empresaId", "scheduledDate", "status");

-- CreateIndex
CREATE INDEX "workshop_labor_times_technicianId_status_idx" ON "workshop_labor_times"("technicianId", "status");

-- AddForeignKey
ALTER TABLE "workshop_checklist_templates" ADD CONSTRAINT "workshop_checklist_templates_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id_empresa") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workshop_checklist_items" ADD CONSTRAINT "workshop_checklist_items_checklistTemplateId_fkey" FOREIGN KEY ("checklistTemplateId") REFERENCES "workshop_checklist_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workshop_checklist_items" ADD CONSTRAINT "workshop_checklist_items_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id_empresa") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workshop_checklist_responses" ADD CONSTRAINT "workshop_checklist_responses_checklistItemId_fkey" FOREIGN KEY ("checklistItemId") REFERENCES "workshop_checklist_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workshop_checklist_responses" ADD CONSTRAINT "workshop_checklist_responses_receptionId_fkey" FOREIGN KEY ("receptionId") REFERENCES "workshop_receptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workshop_checklist_responses" ADD CONSTRAINT "workshop_checklist_responses_qualityCheckId_fkey" FOREIGN KEY ("qualityCheckId") REFERENCES "workshop_quality_checks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workshop_checklist_responses" ADD CONSTRAINT "workshop_checklist_responses_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id_empresa") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workshop_quality_checks" ADD CONSTRAINT "workshop_quality_checks_checklistTemplateId_fkey" FOREIGN KEY ("checklistTemplateId") REFERENCES "workshop_checklist_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workshop_diagnoses" ADD CONSTRAINT "workshop_diagnoses_receptionId_fkey" FOREIGN KEY ("receptionId") REFERENCES "workshop_receptions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workshop_diagnoses" ADD CONSTRAINT "workshop_diagnoses_serviceOrderId_fkey" FOREIGN KEY ("serviceOrderId") REFERENCES "service_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workshop_diagnoses" ADD CONSTRAINT "workshop_diagnoses_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id_empresa") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workshop_diagnosis_findings" ADD CONSTRAINT "workshop_diagnosis_findings_diagnosisId_fkey" FOREIGN KEY ("diagnosisId") REFERENCES "workshop_diagnoses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workshop_diagnosis_findings" ADD CONSTRAINT "workshop_diagnosis_findings_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id_empresa") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workshop_diagnosis_suggested_operations" ADD CONSTRAINT "workshop_diagnosis_suggested_operations_diagnosisId_fkey" FOREIGN KEY ("diagnosisId") REFERENCES "workshop_diagnoses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workshop_diagnosis_suggested_operations" ADD CONSTRAINT "workshop_diagnosis_suggested_operations_operationId_fkey" FOREIGN KEY ("operationId") REFERENCES "workshop_operations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workshop_diagnosis_suggested_operations" ADD CONSTRAINT "workshop_diagnosis_suggested_operations_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id_empresa") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workshop_diagnosis_suggested_parts" ADD CONSTRAINT "workshop_diagnosis_suggested_parts_diagnosisId_fkey" FOREIGN KEY ("diagnosisId") REFERENCES "workshop_diagnoses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workshop_diagnosis_suggested_parts" ADD CONSTRAINT "workshop_diagnosis_suggested_parts_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workshop_diagnosis_suggested_parts" ADD CONSTRAINT "workshop_diagnosis_suggested_parts_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id_empresa") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workshop_diagnosis_evidences" ADD CONSTRAINT "workshop_diagnosis_evidences_diagnosisId_fkey" FOREIGN KEY ("diagnosisId") REFERENCES "workshop_diagnoses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workshop_diagnosis_evidences" ADD CONSTRAINT "workshop_diagnosis_evidences_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id_empresa") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_order_additionals" ADD CONSTRAINT "service_order_additionals_diagnosisFindingId_fkey" FOREIGN KEY ("diagnosisFindingId") REFERENCES "workshop_diagnosis_findings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workshop_so_status_history" ADD CONSTRAINT "workshop_so_status_history_serviceOrderId_fkey" FOREIGN KEY ("serviceOrderId") REFERENCES "service_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workshop_so_status_history" ADD CONSTRAINT "workshop_so_status_history_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id_empresa") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workshop_appointment_status_history" ADD CONSTRAINT "workshop_appointment_status_history_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "workshop_appointments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workshop_appointment_status_history" ADD CONSTRAINT "workshop_appointment_status_history_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id_empresa") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workshop_vehicle_deliveries" ADD CONSTRAINT "workshop_vehicle_deliveries_serviceOrderId_fkey" FOREIGN KEY ("serviceOrderId") REFERENCES "service_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workshop_vehicle_deliveries" ADD CONSTRAINT "workshop_vehicle_deliveries_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id_empresa") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workshop_receptions" ADD CONSTRAINT "workshop_receptions_checklistTemplateId_fkey" FOREIGN KEY ("checklistTemplateId") REFERENCES "workshop_checklist_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;
