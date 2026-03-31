-- CreateEnum
CREATE TYPE "QuoteApprovalChannel" AS ENUM ('IN_PERSON', 'WHATSAPP', 'EMAIL', 'PHONE', 'DIGITAL_SIGNATURE');

-- CreateEnum
CREATE TYPE "AdditionalItemType" AS ENUM ('LABOR', 'PART', 'OTHER');

-- CreateEnum
CREATE TYPE "AuditEntityType" AS ENUM ('SERVICE_ORDER', 'VEHICLE_RECEPTION', 'SERVICE_APPOINTMENT', 'WORKSHOP_WARRANTY', 'WORKSHOP_REWORK', 'QUALITY_CHECK', 'LABOR_TIME', 'SERVICE_ORDER_MATERIAL', 'VEHICLE_DELIVERY');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'STATUS_CHANGE', 'REOPEN', 'APPROVE', 'REJECT', 'CANCEL', 'ASSIGN', 'DELIVER');

-- CreateEnum
CREATE TYPE "ReworkStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');

-- AlterTable
ALTER TABLE "crm_quote_items" ADD COLUMN     "clientApproved" BOOLEAN;

-- AlterTable
ALTER TABLE "crm_quotes" ADD COLUMN     "approvalChannel" "QuoteApprovalChannel",
ADD COLUMN     "approvedAt" TIMESTAMP(3),
ADD COLUMN     "approvedByName" TEXT,
ADD COLUMN     "rejectedReason" TEXT;

-- AlterTable
ALTER TABLE "service_orders" ADD COLUMN     "branchId" TEXT;

-- AlterTable
ALTER TABLE "workshop_appointments" ADD COLUMN     "branchId" TEXT;

-- AlterTable
ALTER TABLE "workshop_bays" ADD COLUMN     "branchId" TEXT;

-- AlterTable
ALTER TABLE "workshop_receptions" ADD COLUMN     "branchId" TEXT;

-- CreateTable
CREATE TABLE "service_order_additional_items" (
    "id" TEXT NOT NULL,
    "additionalId" TEXT NOT NULL,
    "type" "AdditionalItemType" NOT NULL DEFAULT 'LABOR',
    "description" TEXT NOT NULL,
    "referenceId" TEXT,
    "quantity" DECIMAL(10,2) NOT NULL DEFAULT 1,
    "unitPrice" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "unitCost" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "clientApproved" BOOLEAN,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_order_additional_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workshop_audit_logs" (
    "id" TEXT NOT NULL,
    "entityType" "AuditEntityType" NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" "AuditAction" NOT NULL,
    "previousValue" JSONB,
    "newValue" JSONB,
    "description" TEXT,
    "userId" TEXT NOT NULL,
    "userIp" TEXT,
    "empresaId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workshop_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workshop_branches" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "phone" TEXT,
    "managerUserId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "empresaId" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workshop_branches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workshop_reworks" (
    "id" TEXT NOT NULL,
    "originalOrderId" TEXT NOT NULL,
    "reworkOrderId" TEXT,
    "motive" TEXT NOT NULL,
    "rootCause" TEXT,
    "technicianId" TEXT,
    "estimatedCost" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "realCost" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "status" "ReworkStatus" NOT NULL DEFAULT 'OPEN',
    "resolvedAt" TIMESTAMP(3),
    "notes" TEXT,
    "empresaId" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workshop_reworks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workshop_shifts" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "workDays" JSONB NOT NULL DEFAULT '[1,2,3,4,5]',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "empresaId" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workshop_shifts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "service_order_additional_items_additionalId_idx" ON "service_order_additional_items"("additionalId");

-- CreateIndex
CREATE INDEX "workshop_audit_logs_entityType_entityId_idx" ON "workshop_audit_logs"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "workshop_audit_logs_empresaId_createdAt_idx" ON "workshop_audit_logs"("empresaId", "createdAt");

-- CreateIndex
CREATE INDEX "workshop_audit_logs_userId_idx" ON "workshop_audit_logs"("userId");

-- CreateIndex
CREATE INDEX "workshop_branches_empresaId_idx" ON "workshop_branches"("empresaId");

-- CreateIndex
CREATE INDEX "workshop_branches_isActive_idx" ON "workshop_branches"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "workshop_branches_empresaId_code_key" ON "workshop_branches"("empresaId", "code");

-- CreateIndex
CREATE INDEX "workshop_reworks_empresaId_idx" ON "workshop_reworks"("empresaId");

-- CreateIndex
CREATE INDEX "workshop_reworks_originalOrderId_idx" ON "workshop_reworks"("originalOrderId");

-- CreateIndex
CREATE INDEX "workshop_reworks_technicianId_idx" ON "workshop_reworks"("technicianId");

-- CreateIndex
CREATE INDEX "workshop_reworks_status_idx" ON "workshop_reworks"("status");

-- CreateIndex
CREATE INDEX "workshop_shifts_empresaId_idx" ON "workshop_shifts"("empresaId");

-- CreateIndex
CREATE INDEX "workshop_shifts_isActive_idx" ON "workshop_shifts"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "workshop_shifts_empresaId_code_key" ON "workshop_shifts"("empresaId", "code");

-- AddForeignKey
ALTER TABLE "workshop_appointments" ADD CONSTRAINT "workshop_appointments_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "workshop_branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_orders" ADD CONSTRAINT "service_orders_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "workshop_branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_order_additional_items" ADD CONSTRAINT "service_order_additional_items_additionalId_fkey" FOREIGN KEY ("additionalId") REFERENCES "service_order_additionals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workshop_receptions" ADD CONSTRAINT "workshop_receptions_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "workshop_branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workshop_audit_logs" ADD CONSTRAINT "workshop_audit_logs_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id_empresa") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workshop_bays" ADD CONSTRAINT "workshop_bays_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "workshop_branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workshop_branches" ADD CONSTRAINT "workshop_branches_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id_empresa") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workshop_reworks" ADD CONSTRAINT "workshop_reworks_originalOrderId_fkey" FOREIGN KEY ("originalOrderId") REFERENCES "service_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workshop_reworks" ADD CONSTRAINT "workshop_reworks_reworkOrderId_fkey" FOREIGN KEY ("reworkOrderId") REFERENCES "service_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workshop_reworks" ADD CONSTRAINT "workshop_reworks_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id_empresa") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workshop_shifts" ADD CONSTRAINT "workshop_shifts_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id_empresa") ON DELETE RESTRICT ON UPDATE CASCADE;
