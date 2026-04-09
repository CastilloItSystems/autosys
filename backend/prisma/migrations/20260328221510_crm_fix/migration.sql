-- CreateEnum
CREATE TYPE "QuoteStatus" AS ENUM ('DRAFT', 'ISSUED', 'SENT', 'NEGOTIATING', 'APPROVED', 'REJECTED', 'EXPIRED', 'CONVERTED');

-- CreateEnum
CREATE TYPE "QuoteType" AS ENUM ('VEHICLE', 'PARTS', 'SERVICE', 'CORPORATE');

-- CreateTable
CREATE TABLE "crm_quotes" (
    "id" TEXT NOT NULL,
    "quoteNumber" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "parentId" TEXT,
    "type" "QuoteType" NOT NULL,
    "status" "QuoteStatus" NOT NULL DEFAULT 'DRAFT',
    "customerId" TEXT NOT NULL,
    "leadId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "subtotal" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "discountPct" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "discountAmt" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "taxPct" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "taxAmt" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "issuedAt" TIMESTAMP(3),
    "validUntil" TIMESTAMP(3),
    "paymentTerms" TEXT,
    "deliveryTerms" TEXT,
    "notes" TEXT,
    "convertedAt" TIMESTAMP(3),
    "convertedTo" TEXT,
    "convertedRefId" TEXT,
    "assignedTo" TEXT,
    "createdBy" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crm_quotes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm_quote_items" (
    "id" TEXT NOT NULL,
    "quoteId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" DECIMAL(10,3) NOT NULL,
    "unitPrice" DECIMAL(12,2) NOT NULL,
    "discountPct" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "taxPct" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(12,2) NOT NULL,
    "itemId" TEXT,
    "notes" TEXT,

    CONSTRAINT "crm_quote_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "crm_quotes_empresaId_idx" ON "crm_quotes"("empresaId");

-- CreateIndex
CREATE INDEX "crm_quotes_customerId_idx" ON "crm_quotes"("customerId");

-- CreateIndex
CREATE INDEX "crm_quotes_leadId_idx" ON "crm_quotes"("leadId");

-- CreateIndex
CREATE INDEX "crm_quotes_status_idx" ON "crm_quotes"("status");

-- CreateIndex
CREATE INDEX "crm_quotes_assignedTo_idx" ON "crm_quotes"("assignedTo");

-- CreateIndex
CREATE UNIQUE INDEX "crm_quotes_empresaId_quoteNumber_version_key" ON "crm_quotes"("empresaId", "quoteNumber", "version");

-- AddForeignKey
ALTER TABLE "crm_quotes" ADD CONSTRAINT "crm_quotes_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_quotes" ADD CONSTRAINT "crm_quotes_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "crm_leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_quotes" ADD CONSTRAINT "crm_quotes_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id_empresa") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_quotes" ADD CONSTRAINT "crm_quotes_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "crm_quotes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_quote_items" ADD CONSTRAINT "crm_quote_items_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "crm_quotes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
