-- CreateEnum
CREATE TYPE "CaseType" AS ENUM ('SALE_COMPLAINT', 'WORKSHOP_COMPLAINT', 'PARTS_COMPLAINT', 'WARRANTY', 'GENERAL_INQUIRY', 'SUGGESTION', 'INCIDENT', 'SERVICE_COMPLAINT');

-- CreateEnum
CREATE TYPE "CasePriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "CaseStatus" AS ENUM ('OPEN', 'IN_ANALYSIS', 'IN_PROGRESS', 'WAITING_CLIENT', 'ESCALATED', 'RESOLVED', 'CLOSED', 'REJECTED');

-- CreateTable
CREATE TABLE "crm_cases" (
    "id" TEXT NOT NULL,
    "caseNumber" TEXT NOT NULL,
    "type" "CaseType" NOT NULL,
    "priority" "CasePriority" NOT NULL DEFAULT 'MEDIUM',
    "status" "CaseStatus" NOT NULL DEFAULT 'OPEN',
    "customerId" TEXT NOT NULL,
    "customerVehicleId" TEXT,
    "leadId" TEXT,
    "refDocType" TEXT,
    "refDocId" TEXT,
    "refDocNumber" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "resolution" TEXT,
    "rootCause" TEXT,
    "slaDeadline" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "assignedTo" TEXT,
    "createdBy" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crm_cases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm_case_comments" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "comment" TEXT NOT NULL,
    "isInternal" BOOLEAN NOT NULL DEFAULT false,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "crm_case_comments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "crm_cases_empresaId_idx" ON "crm_cases"("empresaId");

-- CreateIndex
CREATE INDEX "crm_cases_customerId_idx" ON "crm_cases"("customerId");

-- CreateIndex
CREATE INDEX "crm_cases_status_idx" ON "crm_cases"("status");

-- CreateIndex
CREATE INDEX "crm_cases_assignedTo_idx" ON "crm_cases"("assignedTo");

-- CreateIndex
CREATE INDEX "crm_cases_priority_idx" ON "crm_cases"("priority");

-- CreateIndex
CREATE UNIQUE INDEX "crm_cases_empresaId_caseNumber_key" ON "crm_cases"("empresaId", "caseNumber");

-- CreateIndex
CREATE INDEX "crm_case_comments_caseId_idx" ON "crm_case_comments"("caseId");

-- AddForeignKey
ALTER TABLE "crm_cases" ADD CONSTRAINT "crm_cases_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_cases" ADD CONSTRAINT "crm_cases_customerVehicleId_fkey" FOREIGN KEY ("customerVehicleId") REFERENCES "customer_vehicles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_cases" ADD CONSTRAINT "crm_cases_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "crm_leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_cases" ADD CONSTRAINT "crm_cases_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id_empresa") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_case_comments" ADD CONSTRAINT "crm_case_comments_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "crm_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;
