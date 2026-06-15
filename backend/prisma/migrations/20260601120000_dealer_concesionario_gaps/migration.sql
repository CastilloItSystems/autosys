-- Concesionario: cierre de brechas del Documento Funcional v1
-- (políticas comerciales, comisiones, accesorios de cotización, historial de versiones).

-- CreateEnum
CREATE TYPE "DealerCommissionStatus" AS ENUM ('PENDING', 'APPROVED', 'PAID', 'CANCELLED');

-- CreateEnum
CREATE TYPE "DealerAccessoryType" AS ENUM ('FACTURABLE', 'BONIFICADO', 'PROMOCIONAL');

-- AlterTable: nuevos componentes del negocio en la cotización (Doc §10.2 / §10.6)
ALTER TABLE "dealer_quotes"
  ADD COLUMN "accessoriesTotal" DECIMAL(14,2),
  ADD COLUMN "adminFees" DECIMAL(14,2),
  ADD COLUMN "tradeInValue" DECIMAL(14,2),
  ADD COLUMN "requiredDeposit" DECIMAL(14,2),
  ADD COLUMN "grandTotal" DECIMAL(14,2),
  ADD COLUMN "currentVersion" INTEGER NOT NULL DEFAULT 1;

-- CreateTable: política / configuración comercial (Doc §6)
CREATE TABLE "dealer_policies" (
  "id" TEXT NOT NULL,
  "empresaId" TEXT NOT NULL,
  "quoteValidityDays" INTEGER NOT NULL DEFAULT 15,
  "reservationValidityDays" INTEGER NOT NULL DEFAULT 7,
  "minDepositAmount" DECIMAL(14,2),
  "minDepositPct" DECIMAL(6,2),
  "maxDiscountPctAdvisor" DECIMAL(6,2) NOT NULL DEFAULT 0,
  "maxDiscountPctSupervisor" DECIMAL(6,2) NOT NULL DEFAULT 5,
  "maxDiscountPctManager" DECIMAL(6,2) NOT NULL DEFAULT 10,
  "requireTestDrive" BOOLEAN NOT NULL DEFAULT false,
  "requireAppraisalForTradeIn" BOOLEAN NOT NULL DEFAULT true,
  "requireDepositForReservation" BOOLEAN NOT NULL DEFAULT true,
  "leadFollowUpSlaHours" INTEGER NOT NULL DEFAULT 48,
  "commissionPctDefault" DECIMAL(6,2) NOT NULL DEFAULT 0,
  "alertWindowHours" INTEGER NOT NULL DEFAULT 48,
  "notes" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "dealer_policies_pkey" PRIMARY KEY ("id")
);

-- CreateTable: comisiones comerciales (Doc §23.2 / §27)
CREATE TABLE "dealer_commissions" (
  "id" TEXT NOT NULL,
  "empresaId" TEXT NOT NULL,
  "dealerQuoteId" TEXT,
  "salesOrderId" TEXT,
  "sellerId" TEXT,
  "sellerName" TEXT,
  "baseAmount" DECIMAL(14,2) NOT NULL,
  "commissionPct" DECIMAL(6,2) NOT NULL,
  "commissionAmount" DECIMAL(14,2) NOT NULL,
  "currency" "OrderCurrency" NOT NULL DEFAULT 'USD',
  "status" "DealerCommissionStatus" NOT NULL DEFAULT 'PENDING',
  "paidAt" TIMESTAMP(3),
  "notes" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "dealer_commissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable: líneas de accesorios de cotización (Doc §10.2 / §15)
CREATE TABLE "dealer_quote_accessories" (
  "id" TEXT NOT NULL,
  "dealerQuoteId" TEXT NOT NULL,
  "itemId" TEXT,
  "name" TEXT NOT NULL,
  "type" "DealerAccessoryType" NOT NULL DEFAULT 'FACTURABLE',
  "quantity" INTEGER NOT NULL DEFAULT 1,
  "unitPrice" DECIMAL(14,2) NOT NULL DEFAULT 0,
  "totalPrice" DECIMAL(14,2) NOT NULL DEFAULT 0,
  "installed" BOOLEAN NOT NULL DEFAULT false,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "dealer_quote_accessories_pkey" PRIMARY KEY ("id")
);

-- CreateTable: historial de versiones de cotización (Doc §10.6)
CREATE TABLE "dealer_quote_versions" (
  "id" TEXT NOT NULL,
  "dealerQuoteId" TEXT NOT NULL,
  "version" INTEGER NOT NULL,
  "snapshot" JSONB NOT NULL,
  "totalAmount" DECIMAL(14,2),
  "grandTotal" DECIMAL(14,2),
  "createdById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "dealer_quote_versions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "dealer_policies_empresaId_key" ON "dealer_policies"("empresaId");
CREATE INDEX "dealer_policies_empresaId_idx" ON "dealer_policies"("empresaId");

CREATE INDEX "dealer_commissions_empresaId_idx" ON "dealer_commissions"("empresaId");
CREATE INDEX "dealer_commissions_dealerQuoteId_idx" ON "dealer_commissions"("dealerQuoteId");
CREATE INDEX "dealer_commissions_sellerId_idx" ON "dealer_commissions"("sellerId");
CREATE INDEX "dealer_commissions_status_idx" ON "dealer_commissions"("status");
CREATE INDEX "dealer_commissions_isActive_idx" ON "dealer_commissions"("isActive");

CREATE INDEX "dealer_quote_accessories_dealerQuoteId_idx" ON "dealer_quote_accessories"("dealerQuoteId");
CREATE INDEX "dealer_quote_accessories_type_idx" ON "dealer_quote_accessories"("type");

CREATE INDEX "dealer_quote_versions_dealerQuoteId_idx" ON "dealer_quote_versions"("dealerQuoteId");
CREATE UNIQUE INDEX "dealer_quote_versions_dealerQuoteId_version_key" ON "dealer_quote_versions"("dealerQuoteId", "version");

-- AddForeignKey
ALTER TABLE "dealer_policies" ADD CONSTRAINT "dealer_policies_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id_empresa") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "dealer_commissions" ADD CONSTRAINT "dealer_commissions_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id_empresa") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "dealer_commissions" ADD CONSTRAINT "dealer_commissions_dealerQuoteId_fkey" FOREIGN KEY ("dealerQuoteId") REFERENCES "dealer_quotes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "dealer_quote_accessories" ADD CONSTRAINT "dealer_quote_accessories_dealerQuoteId_fkey" FOREIGN KEY ("dealerQuoteId") REFERENCES "dealer_quotes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "dealer_quote_versions" ADD CONSTRAINT "dealer_quote_versions_dealerQuoteId_fkey" FOREIGN KEY ("dealerQuoteId") REFERENCES "dealer_quotes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
