-- CreateEnum
CREATE TYPE "BankAccountType" AS ENUM ('CHECKING', 'SAVINGS', 'CASH', 'CRYPTO');

-- CreateEnum
CREATE TYPE "CashTransactionType" AS ENUM ('INCOME', 'OUTCOME', 'TRANSFER_IN', 'TRANSFER_OUT', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "CashTransactionSource" AS ENUM ('SALES_PAYMENT', 'SUPPLIER_PAYMENT', 'EXPENSE', 'MANUAL', 'TRANSFER');

-- CreateEnum
CREATE TYPE "ExpenseCategory" AS ENUM ('UTILITIES', 'RENT', 'PAYROLL', 'SERVICES', 'MAINTENANCE', 'SUPPLIES', 'MARKETING', 'TAXES', 'BANK_FEES', 'TRANSPORT', 'OTHER');

-- CreateEnum
CREATE TYPE "ExpenseStatus" AS ENUM ('DRAFT', 'PENDING', 'PAID', 'CANCELLED');

-- CreateEnum
CREATE TYPE "RecurringFrequency" AS ENUM ('WEEKLY', 'BIWEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY');

-- CreateEnum
CREATE TYPE "SupplierBillStatus" AS ENUM ('PENDING', 'PARTIAL', 'PAID', 'CANCELLED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "PurchaseOrderStatus" ADD VALUE 'PARTIALLY_PAID';
ALTER TYPE "PurchaseOrderStatus" ADD VALUE 'PAID';

-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "bankAccountId" TEXT;

-- CreateTable
CREATE TABLE "bank_accounts" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "BankAccountType" NOT NULL,
    "bankName" TEXT,
    "accountNumber" TEXT,
    "currency" "PurchaseOrderCurrency" NOT NULL,
    "initialBalance" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "currentBalance" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "empresaId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bank_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cash_transactions" (
    "id" TEXT NOT NULL,
    "bankAccountId" TEXT NOT NULL,
    "type" "CashTransactionType" NOT NULL,
    "source" "CashTransactionSource" NOT NULL,
    "sourceId" TEXT,
    "amount" DECIMAL(14,2) NOT NULL,
    "currency" "PurchaseOrderCurrency" NOT NULL,
    "exchangeRate" DECIMAL(14,4),
    "description" TEXT NOT NULL,
    "transactionDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "empresaId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cash_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expenses" (
    "id" TEXT NOT NULL,
    "expenseNumber" TEXT NOT NULL,
    "category" "ExpenseCategory" NOT NULL,
    "status" "ExpenseStatus" NOT NULL DEFAULT 'PENDING',
    "description" TEXT NOT NULL,
    "supplierId" TEXT,
    "bankAccountId" TEXT,
    "currency" "PurchaseOrderCurrency" NOT NULL DEFAULT 'USD',
    "exchangeRate" DECIMAL(14,4),
    "amount" DECIMAL(12,2) NOT NULL,
    "taxAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(12,2) NOT NULL,
    "paidAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "pendingAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "expenseDate" TIMESTAMP(3) NOT NULL,
    "attachmentUrl" TEXT,
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "recurringRuleId" TEXT,
    "notes" TEXT,
    "empresaId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "expenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expense_recurring_rules" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "ExpenseCategory" NOT NULL,
    "description" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "supplierId" TEXT,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" "PurchaseOrderCurrency" NOT NULL DEFAULT 'USD',
    "frequency" "RecurringFrequency" NOT NULL,
    "dayOfMonth" INTEGER,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "nextRunDate" TIMESTAMP(3) NOT NULL,
    "empresaId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "expense_recurring_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supplier_bills" (
    "id" TEXT NOT NULL,
    "billNumber" TEXT NOT NULL,
    "internalNumber" TEXT NOT NULL,
    "status" "SupplierBillStatus" NOT NULL DEFAULT 'PENDING',
    "supplierId" TEXT NOT NULL,
    "purchaseOrderId" TEXT,
    "currency" "PurchaseOrderCurrency" NOT NULL DEFAULT 'USD',
    "exchangeRate" DECIMAL(14,4),
    "subtotal" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "taxAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "paidAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "pendingAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "issueDate" TIMESTAMP(3) NOT NULL,
    "dueDate" TIMESTAMP(3),
    "attachmentUrl" TEXT,
    "notes" TEXT,
    "empresaId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "supplier_bills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supplier_payments" (
    "id" TEXT NOT NULL,
    "paymentNumber" TEXT NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "supplierId" TEXT NOT NULL,
    "supplierBillId" TEXT,
    "expenseId" TEXT,
    "bankAccountId" TEXT NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" "PurchaseOrderCurrency" NOT NULL DEFAULT 'USD',
    "exchangeRate" DECIMAL(14,4),
    "igtfApplies" BOOLEAN NOT NULL DEFAULT false,
    "igtfAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "totalWithIgtf" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "details" JSONB,
    "reference" TEXT,
    "notes" TEXT,
    "processedBy" TEXT,
    "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "empresaId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "supplier_payments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "bank_accounts_empresaId_isActive_idx" ON "bank_accounts"("empresaId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "bank_accounts_empresaId_name_key" ON "bank_accounts"("empresaId", "name");

-- CreateIndex
CREATE INDEX "cash_transactions_empresaId_bankAccountId_transactionDate_idx" ON "cash_transactions"("empresaId", "bankAccountId", "transactionDate");

-- CreateIndex
CREATE INDEX "cash_transactions_source_sourceId_idx" ON "cash_transactions"("source", "sourceId");

-- CreateIndex
CREATE UNIQUE INDEX "expenses_expenseNumber_key" ON "expenses"("expenseNumber");

-- CreateIndex
CREATE INDEX "expenses_empresaId_status_idx" ON "expenses"("empresaId", "status");

-- CreateIndex
CREATE INDEX "expenses_category_expenseDate_idx" ON "expenses"("category", "expenseDate");

-- CreateIndex
CREATE INDEX "expenses_supplierId_idx" ON "expenses"("supplierId");

-- CreateIndex
CREATE INDEX "expenses_recurringRuleId_idx" ON "expenses"("recurringRuleId");

-- CreateIndex
CREATE INDEX "expense_recurring_rules_empresaId_isActive_nextRunDate_idx" ON "expense_recurring_rules"("empresaId", "isActive", "nextRunDate");

-- CreateIndex
CREATE UNIQUE INDEX "supplier_bills_internalNumber_key" ON "supplier_bills"("internalNumber");

-- CreateIndex
CREATE INDEX "supplier_bills_empresaId_status_idx" ON "supplier_bills"("empresaId", "status");

-- CreateIndex
CREATE INDEX "supplier_bills_supplierId_status_idx" ON "supplier_bills"("supplierId", "status");

-- CreateIndex
CREATE INDEX "supplier_bills_dueDate_idx" ON "supplier_bills"("dueDate");

-- CreateIndex
CREATE UNIQUE INDEX "supplier_bills_empresaId_supplierId_billNumber_key" ON "supplier_bills"("empresaId", "supplierId", "billNumber");

-- CreateIndex
CREATE UNIQUE INDEX "supplier_payments_paymentNumber_key" ON "supplier_payments"("paymentNumber");

-- CreateIndex
CREATE INDEX "supplier_payments_empresaId_status_idx" ON "supplier_payments"("empresaId", "status");

-- CreateIndex
CREATE INDEX "supplier_payments_supplierId_idx" ON "supplier_payments"("supplierId");

-- CreateIndex
CREATE INDEX "supplier_payments_supplierBillId_idx" ON "supplier_payments"("supplierBillId");

-- CreateIndex
CREATE INDEX "supplier_payments_expenseId_idx" ON "supplier_payments"("expenseId");

-- CreateIndex
CREATE INDEX "supplier_payments_processedAt_idx" ON "supplier_payments"("processedAt");

-- AddForeignKey
ALTER TABLE "bank_accounts" ADD CONSTRAINT "bank_accounts_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id_empresa") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cash_transactions" ADD CONSTRAINT "cash_transactions_bankAccountId_fkey" FOREIGN KEY ("bankAccountId") REFERENCES "bank_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cash_transactions" ADD CONSTRAINT "cash_transactions_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id_empresa") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_bankAccountId_fkey" FOREIGN KEY ("bankAccountId") REFERENCES "bank_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_recurringRuleId_fkey" FOREIGN KEY ("recurringRuleId") REFERENCES "expense_recurring_rules"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id_empresa") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense_recurring_rules" ADD CONSTRAINT "expense_recurring_rules_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense_recurring_rules" ADD CONSTRAINT "expense_recurring_rules_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id_empresa") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_bills" ADD CONSTRAINT "supplier_bills_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_bills" ADD CONSTRAINT "supplier_bills_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "purchase_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_bills" ADD CONSTRAINT "supplier_bills_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id_empresa") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_payments" ADD CONSTRAINT "supplier_payments_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_payments" ADD CONSTRAINT "supplier_payments_supplierBillId_fkey" FOREIGN KEY ("supplierBillId") REFERENCES "supplier_bills"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_payments" ADD CONSTRAINT "supplier_payments_expenseId_fkey" FOREIGN KEY ("expenseId") REFERENCES "expenses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_payments" ADD CONSTRAINT "supplier_payments_bankAccountId_fkey" FOREIGN KEY ("bankAccountId") REFERENCES "bank_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_payments" ADD CONSTRAINT "supplier_payments_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id_empresa") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_bankAccountId_fkey" FOREIGN KEY ("bankAccountId") REFERENCES "bank_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
