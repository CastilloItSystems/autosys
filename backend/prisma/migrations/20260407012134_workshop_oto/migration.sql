-- CreateEnum
CREATE TYPE "TOTStatus" AS ENUM ('REQUESTED', 'APPROVED', 'DEPARTED', 'IN_PROGRESS', 'RETURNED', 'INVOICED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TOTDocumentType" AS ENUM ('PROVIDER_QUOTE', 'DELIVERY_ACT', 'RETURN_ACT', 'PROVIDER_INVOICE', 'OTHER');

-- CreateTable
CREATE TABLE "workshop_tot_providers" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "taxId" TEXT,
    "address" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "specialty" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "empresaId" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workshop_tot_providers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workshop_tot" (
    "id" TEXT NOT NULL,
    "totNumber" TEXT NOT NULL,
    "status" "TOTStatus" NOT NULL DEFAULT 'REQUESTED',
    "serviceOrderId" TEXT NOT NULL,
    "providerId" TEXT,
    "providerName" TEXT,
    "partDescription" TEXT NOT NULL,
    "partSerial" TEXT,
    "photoUrls" JSONB,
    "requestedWork" TEXT NOT NULL,
    "technicalInstruction" TEXT,
    "approvedById" TEXT,
    "departureRef" TEXT,
    "departedAt" TIMESTAMP(3),
    "estimatedReturnAt" TIMESTAMP(3),
    "returnedAt" TIMESTAMP(3),
    "providerQuote" DECIMAL(12,2),
    "finalCost" DECIMAL(12,2),
    "providerInvoiceRef" TEXT,
    "notes" TEXT,
    "empresaId" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workshop_tot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workshop_tot_documents" (
    "id" TEXT NOT NULL,
    "totId" TEXT NOT NULL,
    "type" "TOTDocumentType" NOT NULL,
    "url" TEXT NOT NULL,
    "description" TEXT,
    "uploadedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workshop_tot_documents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "workshop_tot_providers_empresaId_idx" ON "workshop_tot_providers"("empresaId");

-- CreateIndex
CREATE INDEX "workshop_tot_providers_isActive_idx" ON "workshop_tot_providers"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "workshop_tot_providers_empresaId_code_key" ON "workshop_tot_providers"("empresaId", "code");

-- CreateIndex
CREATE INDEX "workshop_tot_empresaId_idx" ON "workshop_tot"("empresaId");

-- CreateIndex
CREATE INDEX "workshop_tot_serviceOrderId_idx" ON "workshop_tot"("serviceOrderId");

-- CreateIndex
CREATE INDEX "workshop_tot_status_idx" ON "workshop_tot"("status");

-- CreateIndex
CREATE INDEX "workshop_tot_providerId_idx" ON "workshop_tot"("providerId");

-- CreateIndex
CREATE INDEX "workshop_tot_empresaId_createdAt_idx" ON "workshop_tot"("empresaId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "workshop_tot_empresaId_totNumber_key" ON "workshop_tot"("empresaId", "totNumber");

-- CreateIndex
CREATE INDEX "workshop_tot_documents_totId_idx" ON "workshop_tot_documents"("totId");

-- AddForeignKey
ALTER TABLE "workshop_tot_providers" ADD CONSTRAINT "workshop_tot_providers_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id_empresa") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workshop_tot" ADD CONSTRAINT "workshop_tot_serviceOrderId_fkey" FOREIGN KEY ("serviceOrderId") REFERENCES "service_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workshop_tot" ADD CONSTRAINT "workshop_tot_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "workshop_tot_providers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workshop_tot" ADD CONSTRAINT "workshop_tot_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id_empresa") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workshop_tot_documents" ADD CONSTRAINT "workshop_tot_documents_totId_fkey" FOREIGN KEY ("totId") REFERENCES "workshop_tot"("id") ON DELETE CASCADE ON UPDATE CASCADE;
