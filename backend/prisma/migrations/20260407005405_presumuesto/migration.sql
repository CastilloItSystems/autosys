-- CreateEnum
CREATE TYPE "QuotationStatus" AS ENUM ('DRAFT', 'ISSUED', 'SENT', 'PENDING_APPROVAL', 'APPROVED_TOTAL', 'APPROVED_PARTIAL', 'REJECTED', 'EXPIRED', 'CONVERTED');

-- CreateEnum
CREATE TYPE "QuotationItemType" AS ENUM ('LABOR', 'PART', 'CONSUMABLE', 'EXTERNAL_SERVICE', 'COURTESY');

-- CreateEnum
CREATE TYPE "ApprovalChannel" AS ENUM ('PRESENTIAL', 'WHATSAPP', 'EMAIL', 'CALL', 'DIGITAL_SIGNATURE');

-- CreateEnum
CREATE TYPE "ApprovalType" AS ENUM ('TOTAL', 'PARTIAL', 'REJECTION');

-- CreateTable
CREATE TABLE "workshop_quotations" (
    "id" TEXT NOT NULL,
    "quotationNumber" TEXT NOT NULL,
    "status" "QuotationStatus" NOT NULL DEFAULT 'DRAFT',
    "version" INTEGER NOT NULL DEFAULT 1,
    "isSupplementary" BOOLEAN NOT NULL DEFAULT false,
    "parentQuotationId" TEXT,
    "receptionId" TEXT,
    "diagnosisId" TEXT,
    "serviceOrderId" TEXT,
    "customerId" TEXT NOT NULL,
    "customerVehicleId" TEXT,
    "validUntil" TIMESTAMP(3),
    "expiredAt" TIMESTAMP(3),
    "convertedAt" TIMESTAMP(3),
    "subtotal" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "discount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "tax" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "internalNotes" TEXT,
    "empresaId" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workshop_quotations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workshop_quotation_items" (
    "id" TEXT NOT NULL,
    "quotationId" TEXT NOT NULL,
    "type" "QuotationItemType" NOT NULL,
    "referenceId" TEXT,
    "description" TEXT NOT NULL,
    "quantity" DECIMAL(10,2) NOT NULL DEFAULT 1,
    "unitPrice" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "unitCost" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "discount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "tax" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "subtotal" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "approved" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workshop_quotation_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workshop_quotation_approvals" (
    "id" TEXT NOT NULL,
    "quotationId" TEXT NOT NULL,
    "type" "ApprovalType" NOT NULL,
    "channel" "ApprovalChannel" NOT NULL,
    "approvedByName" TEXT NOT NULL,
    "notes" TEXT,
    "rejectionReason" TEXT,
    "approvedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workshop_quotation_approvals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "workshop_quotations_empresaId_idx" ON "workshop_quotations"("empresaId");

-- CreateIndex
CREATE INDEX "workshop_quotations_customerId_idx" ON "workshop_quotations"("customerId");

-- CreateIndex
CREATE INDEX "workshop_quotations_receptionId_idx" ON "workshop_quotations"("receptionId");

-- CreateIndex
CREATE INDEX "workshop_quotations_status_idx" ON "workshop_quotations"("status");

-- CreateIndex
CREATE INDEX "workshop_quotations_empresaId_createdAt_idx" ON "workshop_quotations"("empresaId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "workshop_quotations_empresaId_quotationNumber_key" ON "workshop_quotations"("empresaId", "quotationNumber");

-- CreateIndex
CREATE INDEX "workshop_quotation_items_quotationId_idx" ON "workshop_quotation_items"("quotationId");

-- CreateIndex
CREATE INDEX "workshop_quotation_approvals_quotationId_idx" ON "workshop_quotation_approvals"("quotationId");

-- AddForeignKey
ALTER TABLE "workshop_quotations" ADD CONSTRAINT "workshop_quotations_parentQuotationId_fkey" FOREIGN KEY ("parentQuotationId") REFERENCES "workshop_quotations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workshop_quotations" ADD CONSTRAINT "workshop_quotations_receptionId_fkey" FOREIGN KEY ("receptionId") REFERENCES "workshop_receptions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workshop_quotations" ADD CONSTRAINT "workshop_quotations_diagnosisId_fkey" FOREIGN KEY ("diagnosisId") REFERENCES "workshop_diagnoses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workshop_quotations" ADD CONSTRAINT "workshop_quotations_serviceOrderId_fkey" FOREIGN KEY ("serviceOrderId") REFERENCES "service_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workshop_quotations" ADD CONSTRAINT "workshop_quotations_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workshop_quotations" ADD CONSTRAINT "workshop_quotations_customerVehicleId_fkey" FOREIGN KEY ("customerVehicleId") REFERENCES "customer_vehicles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workshop_quotations" ADD CONSTRAINT "workshop_quotations_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id_empresa") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workshop_quotation_items" ADD CONSTRAINT "workshop_quotation_items_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "workshop_quotations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workshop_quotation_approvals" ADD CONSTRAINT "workshop_quotation_approvals_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "workshop_quotations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
