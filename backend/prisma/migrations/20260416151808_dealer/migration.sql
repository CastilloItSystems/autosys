-- CreateEnum
CREATE TYPE "DealerAfterSaleType" AS ENUM ('WARRANTY_CHECK', 'FIRST_SERVICE', 'SATISFACTION_CALL', 'CLAIM');

-- CreateEnum
CREATE TYPE "DealerAfterSaleStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "DealerApprovalType" AS ENUM ('DISCOUNT_EXCEPTION', 'TRADE_IN_APPROVAL', 'FINANCING_OVERRIDE', 'DELIVERY_EXCEPTION', 'DOCUMENT_EXCEPTION');

-- CreateEnum
CREATE TYPE "DealerApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "DealerDeliveryStatus" AS ENUM ('SCHEDULED', 'READY', 'DELIVERED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "DealerDocumentReferenceType" AS ENUM ('UNIT', 'RESERVATION', 'QUOTE', 'TEST_DRIVE', 'TRADE_IN', 'FINANCING', 'DELIVERY', 'CUSTOMER');

-- CreateEnum
CREATE TYPE "DealerDocumentStatus" AS ENUM ('PENDING', 'VALID', 'EXPIRED', 'REJECTED');

-- CreateEnum
CREATE TYPE "DealerFinancingStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'CANCELLED', 'DISBURSED');

-- CreateEnum
CREATE TYPE "DealerQuoteStatus" AS ENUM ('DRAFT', 'SENT', 'NEGOTIATING', 'APPROVED', 'REJECTED', 'EXPIRED', 'CONVERTED');

-- CreateEnum
CREATE TYPE "DealerReservationStatus" AS ENUM ('PENDING', 'CONFIRMED', 'EXPIRED', 'CANCELLED', 'CONVERTED');

-- CreateEnum
CREATE TYPE "DealerTestDriveStatus" AS ENUM ('SCHEDULED', 'CONFIRMED', 'COMPLETED', 'NO_SHOW', 'CANCELLED');

-- CreateEnum
CREATE TYPE "DealerTradeInStatus" AS ENUM ('PENDING', 'INSPECTED', 'VALUED', 'APPROVED', 'REJECTED', 'APPLIED');

-- CreateEnum
CREATE TYPE "DealerUnitCondition" AS ENUM ('NEW', 'USED', 'DEMO', 'CONSIGNMENT');

-- CreateEnum
CREATE TYPE "DealerUnitStatus" AS ENUM ('AVAILABLE', 'RESERVED', 'IN_DOCUMENTATION', 'INVOICED', 'READY_FOR_DELIVERY', 'DELIVERED', 'BLOCKED');

-- CreateTable
CREATE TABLE "dealer_after_sales" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "dealerUnitId" TEXT,
    "referenceType" TEXT,
    "referenceId" TEXT,
    "caseNumber" TEXT NOT NULL,
    "type" "DealerAfterSaleType" NOT NULL,
    "status" "DealerAfterSaleStatus" NOT NULL DEFAULT 'OPEN',
    "customerName" TEXT NOT NULL,
    "customerPhone" TEXT,
    "customerEmail" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "assignedTo" TEXT,
    "resolutionNotes" TEXT,
    "satisfactionScore" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dealer_after_sales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dealer_approvals" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "dealerUnitId" TEXT,
    "referenceType" TEXT,
    "referenceId" TEXT,
    "approvalNumber" TEXT NOT NULL,
    "type" "DealerApprovalType" NOT NULL,
    "status" "DealerApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "title" TEXT NOT NULL,
    "reason" TEXT,
    "requestedBy" TEXT,
    "requestedAmount" DECIMAL(14,2),
    "requestedPct" DECIMAL(6,2),
    "resolvedBy" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "resolutionNotes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dealer_approvals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dealer_deliveries" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "dealerUnitId" TEXT NOT NULL,
    "deliveryNumber" TEXT NOT NULL,
    "status" "DealerDeliveryStatus" NOT NULL DEFAULT 'SCHEDULED',
    "customerName" TEXT NOT NULL,
    "customerDocument" TEXT,
    "customerPhone" TEXT,
    "customerEmail" TEXT,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "deliveredAt" TIMESTAMP(3),
    "advisorName" TEXT,
    "checklistCompleted" BOOLEAN NOT NULL DEFAULT false,
    "documentsSigned" BOOLEAN NOT NULL DEFAULT false,
    "accessoriesDelivered" BOOLEAN NOT NULL DEFAULT false,
    "observations" TEXT,
    "actNumber" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dealer_deliveries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dealer_documents" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "dealerUnitId" TEXT,
    "referenceType" "DealerDocumentReferenceType" NOT NULL,
    "referenceId" TEXT,
    "documentType" TEXT NOT NULL,
    "documentNumber" TEXT,
    "name" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "mimeType" TEXT,
    "sizeBytes" INTEGER,
    "issuedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "status" "DealerDocumentStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dealer_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dealer_financing" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "dealerUnitId" TEXT NOT NULL,
    "financingNumber" TEXT NOT NULL,
    "status" "DealerFinancingStatus" NOT NULL DEFAULT 'DRAFT',
    "customerName" TEXT NOT NULL,
    "customerDocument" TEXT,
    "customerPhone" TEXT,
    "customerEmail" TEXT,
    "bankName" TEXT,
    "planName" TEXT,
    "requestedAmount" DECIMAL(14,2),
    "downPaymentAmount" DECIMAL(14,2),
    "approvedAmount" DECIMAL(14,2),
    "termMonths" INTEGER,
    "annualRatePct" DECIMAL(6,2),
    "installmentAmount" DECIMAL(14,2),
    "currency" TEXT DEFAULT 'USD',
    "submittedAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "disbursedAt" TIMESTAMP(3),
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dealer_financing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dealer_quotes" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "dealerUnitId" TEXT NOT NULL,
    "quoteNumber" TEXT NOT NULL,
    "status" "DealerQuoteStatus" NOT NULL DEFAULT 'DRAFT',
    "customerName" TEXT NOT NULL,
    "customerDocument" TEXT,
    "customerPhone" TEXT,
    "customerEmail" TEXT,
    "listPrice" DECIMAL(14,2),
    "discountPct" DECIMAL(6,2),
    "discountAmount" DECIMAL(14,2),
    "offeredPrice" DECIMAL(14,2),
    "taxPct" DECIMAL(6,2),
    "taxAmount" DECIMAL(14,2),
    "totalAmount" DECIMAL(14,2),
    "currency" TEXT DEFAULT 'USD',
    "validUntil" TIMESTAMP(3),
    "paymentTerms" TEXT,
    "financingRequired" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sentAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "convertedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dealer_quotes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dealer_reservations" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "dealerUnitId" TEXT NOT NULL,
    "reservationNumber" TEXT NOT NULL,
    "status" "DealerReservationStatus" NOT NULL DEFAULT 'PENDING',
    "customerName" TEXT NOT NULL,
    "customerDocument" TEXT,
    "customerPhone" TEXT,
    "customerEmail" TEXT,
    "offeredPrice" DECIMAL(14,2),
    "depositAmount" DECIMAL(14,2),
    "currency" TEXT DEFAULT 'USD',
    "reservedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "confirmedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "convertedAt" TIMESTAMP(3),
    "notes" TEXT,
    "sourceChannel" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dealer_reservations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dealer_test_drives" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "dealerUnitId" TEXT NOT NULL,
    "testDriveNumber" TEXT NOT NULL,
    "status" "DealerTestDriveStatus" NOT NULL DEFAULT 'SCHEDULED',
    "customerName" TEXT NOT NULL,
    "customerDocument" TEXT,
    "customerPhone" TEXT,
    "customerEmail" TEXT,
    "driverLicense" TEXT,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "advisorName" TEXT,
    "routeDescription" TEXT,
    "observations" TEXT,
    "customerFeedback" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dealer_test_drives_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dealer_trade_ins" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "targetDealerUnitId" TEXT,
    "tradeInNumber" TEXT NOT NULL,
    "status" "DealerTradeInStatus" NOT NULL DEFAULT 'PENDING',
    "customerName" TEXT NOT NULL,
    "customerDocument" TEXT,
    "customerPhone" TEXT,
    "customerEmail" TEXT,
    "vehicleBrand" TEXT NOT NULL,
    "vehicleModel" TEXT,
    "vehicleYear" INTEGER,
    "vehicleVersion" TEXT,
    "vehicleVin" TEXT,
    "vehiclePlate" TEXT,
    "mileage" INTEGER,
    "conditionSummary" TEXT,
    "requestedValue" DECIMAL(14,2),
    "appraisedValue" DECIMAL(14,2),
    "approvedValue" DECIMAL(14,2),
    "appraisalDate" TIMESTAMP(3),
    "appraiserName" TEXT,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dealer_trade_ins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dealer_units" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "modelId" TEXT,
    "code" TEXT,
    "version" TEXT,
    "year" INTEGER,
    "vin" TEXT,
    "engineSerial" TEXT,
    "plate" TEXT,
    "condition" "DealerUnitCondition" NOT NULL DEFAULT 'NEW',
    "status" "DealerUnitStatus" NOT NULL DEFAULT 'AVAILABLE',
    "mileage" INTEGER,
    "colorExterior" TEXT,
    "colorInterior" TEXT,
    "fuelType" TEXT,
    "transmission" TEXT,
    "listPrice" DECIMAL(14,2),
    "promoPrice" DECIMAL(14,2),
    "location" TEXT,
    "description" TEXT,
    "specifications" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dealer_units_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "dealer_after_sales_empresaId_idx" ON "dealer_after_sales"("empresaId");

-- CreateIndex
CREATE INDEX "dealer_after_sales_dealerUnitId_idx" ON "dealer_after_sales"("dealerUnitId");

-- CreateIndex
CREATE INDEX "dealer_after_sales_status_idx" ON "dealer_after_sales"("status");

-- CreateIndex
CREATE INDEX "dealer_after_sales_type_idx" ON "dealer_after_sales"("type");

-- CreateIndex
CREATE INDEX "dealer_after_sales_isActive_idx" ON "dealer_after_sales"("isActive");

-- CreateIndex
CREATE INDEX "dealer_after_sales_openedAt_idx" ON "dealer_after_sales"("openedAt");

-- CreateIndex
CREATE UNIQUE INDEX "dealer_after_sales_empresaId_caseNumber_key" ON "dealer_after_sales"("empresaId", "caseNumber");

-- CreateIndex
CREATE INDEX "dealer_approvals_empresaId_idx" ON "dealer_approvals"("empresaId");

-- CreateIndex
CREATE INDEX "dealer_approvals_dealerUnitId_idx" ON "dealer_approvals"("dealerUnitId");

-- CreateIndex
CREATE INDEX "dealer_approvals_status_idx" ON "dealer_approvals"("status");

-- CreateIndex
CREATE INDEX "dealer_approvals_type_idx" ON "dealer_approvals"("type");

-- CreateIndex
CREATE INDEX "dealer_approvals_isActive_idx" ON "dealer_approvals"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "dealer_approvals_empresaId_approvalNumber_key" ON "dealer_approvals"("empresaId", "approvalNumber");

-- CreateIndex
CREATE INDEX "dealer_deliveries_empresaId_idx" ON "dealer_deliveries"("empresaId");

-- CreateIndex
CREATE INDEX "dealer_deliveries_dealerUnitId_idx" ON "dealer_deliveries"("dealerUnitId");

-- CreateIndex
CREATE INDEX "dealer_deliveries_status_idx" ON "dealer_deliveries"("status");

-- CreateIndex
CREATE INDEX "dealer_deliveries_isActive_idx" ON "dealer_deliveries"("isActive");

-- CreateIndex
CREATE INDEX "dealer_deliveries_scheduledAt_idx" ON "dealer_deliveries"("scheduledAt");

-- CreateIndex
CREATE UNIQUE INDEX "dealer_deliveries_empresaId_deliveryNumber_key" ON "dealer_deliveries"("empresaId", "deliveryNumber");

-- CreateIndex
CREATE INDEX "dealer_documents_empresaId_idx" ON "dealer_documents"("empresaId");

-- CreateIndex
CREATE INDEX "dealer_documents_dealerUnitId_idx" ON "dealer_documents"("dealerUnitId");

-- CreateIndex
CREATE INDEX "dealer_documents_referenceType_referenceId_idx" ON "dealer_documents"("referenceType", "referenceId");

-- CreateIndex
CREATE INDEX "dealer_documents_status_idx" ON "dealer_documents"("status");

-- CreateIndex
CREATE INDEX "dealer_documents_isActive_idx" ON "dealer_documents"("isActive");

-- CreateIndex
CREATE INDEX "dealer_financing_empresaId_idx" ON "dealer_financing"("empresaId");

-- CreateIndex
CREATE INDEX "dealer_financing_dealerUnitId_idx" ON "dealer_financing"("dealerUnitId");

-- CreateIndex
CREATE INDEX "dealer_financing_status_idx" ON "dealer_financing"("status");

-- CreateIndex
CREATE INDEX "dealer_financing_isActive_idx" ON "dealer_financing"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "dealer_financing_empresaId_financingNumber_key" ON "dealer_financing"("empresaId", "financingNumber");

-- CreateIndex
CREATE INDEX "dealer_quotes_empresaId_idx" ON "dealer_quotes"("empresaId");

-- CreateIndex
CREATE INDEX "dealer_quotes_dealerUnitId_idx" ON "dealer_quotes"("dealerUnitId");

-- CreateIndex
CREATE INDEX "dealer_quotes_status_idx" ON "dealer_quotes"("status");

-- CreateIndex
CREATE INDEX "dealer_quotes_isActive_idx" ON "dealer_quotes"("isActive");

-- CreateIndex
CREATE INDEX "dealer_quotes_createdAt_idx" ON "dealer_quotes"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "dealer_quotes_empresaId_quoteNumber_key" ON "dealer_quotes"("empresaId", "quoteNumber");

-- CreateIndex
CREATE INDEX "dealer_reservations_empresaId_idx" ON "dealer_reservations"("empresaId");

-- CreateIndex
CREATE INDEX "dealer_reservations_dealerUnitId_idx" ON "dealer_reservations"("dealerUnitId");

-- CreateIndex
CREATE INDEX "dealer_reservations_status_idx" ON "dealer_reservations"("status");

-- CreateIndex
CREATE INDEX "dealer_reservations_isActive_idx" ON "dealer_reservations"("isActive");

-- CreateIndex
CREATE INDEX "dealer_reservations_reservedAt_idx" ON "dealer_reservations"("reservedAt");

-- CreateIndex
CREATE INDEX "dealer_reservations_expiresAt_idx" ON "dealer_reservations"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "dealer_reservations_empresaId_reservationNumber_key" ON "dealer_reservations"("empresaId", "reservationNumber");

-- CreateIndex
CREATE INDEX "dealer_test_drives_empresaId_idx" ON "dealer_test_drives"("empresaId");

-- CreateIndex
CREATE INDEX "dealer_test_drives_dealerUnitId_idx" ON "dealer_test_drives"("dealerUnitId");

-- CreateIndex
CREATE INDEX "dealer_test_drives_status_idx" ON "dealer_test_drives"("status");

-- CreateIndex
CREATE INDEX "dealer_test_drives_isActive_idx" ON "dealer_test_drives"("isActive");

-- CreateIndex
CREATE INDEX "dealer_test_drives_scheduledAt_idx" ON "dealer_test_drives"("scheduledAt");

-- CreateIndex
CREATE UNIQUE INDEX "dealer_test_drives_empresaId_testDriveNumber_key" ON "dealer_test_drives"("empresaId", "testDriveNumber");

-- CreateIndex
CREATE INDEX "dealer_trade_ins_empresaId_idx" ON "dealer_trade_ins"("empresaId");

-- CreateIndex
CREATE INDEX "dealer_trade_ins_targetDealerUnitId_idx" ON "dealer_trade_ins"("targetDealerUnitId");

-- CreateIndex
CREATE INDEX "dealer_trade_ins_status_idx" ON "dealer_trade_ins"("status");

-- CreateIndex
CREATE INDEX "dealer_trade_ins_isActive_idx" ON "dealer_trade_ins"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "dealer_trade_ins_empresaId_tradeInNumber_key" ON "dealer_trade_ins"("empresaId", "tradeInNumber");

-- CreateIndex
CREATE INDEX "dealer_units_empresaId_idx" ON "dealer_units"("empresaId");

-- CreateIndex
CREATE INDEX "dealer_units_brandId_idx" ON "dealer_units"("brandId");

-- CreateIndex
CREATE INDEX "dealer_units_modelId_idx" ON "dealer_units"("modelId");

-- CreateIndex
CREATE INDEX "dealer_units_status_idx" ON "dealer_units"("status");

-- CreateIndex
CREATE INDEX "dealer_units_condition_idx" ON "dealer_units"("condition");

-- CreateIndex
CREATE INDEX "dealer_units_isActive_idx" ON "dealer_units"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "dealer_units_empresaId_vin_key" ON "dealer_units"("empresaId", "vin");

-- AddForeignKey
ALTER TABLE "dealer_after_sales" ADD CONSTRAINT "dealer_after_sales_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id_empresa") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dealer_after_sales" ADD CONSTRAINT "dealer_after_sales_dealerUnitId_fkey" FOREIGN KEY ("dealerUnitId") REFERENCES "dealer_units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dealer_approvals" ADD CONSTRAINT "dealer_approvals_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id_empresa") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dealer_approvals" ADD CONSTRAINT "dealer_approvals_dealerUnitId_fkey" FOREIGN KEY ("dealerUnitId") REFERENCES "dealer_units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dealer_deliveries" ADD CONSTRAINT "dealer_deliveries_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id_empresa") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dealer_deliveries" ADD CONSTRAINT "dealer_deliveries_dealerUnitId_fkey" FOREIGN KEY ("dealerUnitId") REFERENCES "dealer_units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dealer_documents" ADD CONSTRAINT "dealer_documents_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id_empresa") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dealer_documents" ADD CONSTRAINT "dealer_documents_dealerUnitId_fkey" FOREIGN KEY ("dealerUnitId") REFERENCES "dealer_units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dealer_financing" ADD CONSTRAINT "dealer_financing_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id_empresa") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dealer_financing" ADD CONSTRAINT "dealer_financing_dealerUnitId_fkey" FOREIGN KEY ("dealerUnitId") REFERENCES "dealer_units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dealer_quotes" ADD CONSTRAINT "dealer_quotes_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id_empresa") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dealer_quotes" ADD CONSTRAINT "dealer_quotes_dealerUnitId_fkey" FOREIGN KEY ("dealerUnitId") REFERENCES "dealer_units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dealer_reservations" ADD CONSTRAINT "dealer_reservations_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id_empresa") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dealer_reservations" ADD CONSTRAINT "dealer_reservations_dealerUnitId_fkey" FOREIGN KEY ("dealerUnitId") REFERENCES "dealer_units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dealer_test_drives" ADD CONSTRAINT "dealer_test_drives_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id_empresa") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dealer_test_drives" ADD CONSTRAINT "dealer_test_drives_dealerUnitId_fkey" FOREIGN KEY ("dealerUnitId") REFERENCES "dealer_units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dealer_trade_ins" ADD CONSTRAINT "dealer_trade_ins_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id_empresa") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dealer_trade_ins" ADD CONSTRAINT "dealer_trade_ins_targetDealerUnitId_fkey" FOREIGN KEY ("targetDealerUnitId") REFERENCES "dealer_units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dealer_units" ADD CONSTRAINT "dealer_units_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id_empresa") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dealer_units" ADD CONSTRAINT "dealer_units_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "brands"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dealer_units" ADD CONSTRAINT "dealer_units_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "models"("id") ON DELETE SET NULL ON UPDATE CASCADE;
