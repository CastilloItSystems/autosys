-- FASE 2: Add ServiceOrder-PreInvoice bridge for workshop invoicing
-- This migration adds the ability to link PreInvoices directly to ServiceOrders (not just Orders)

-- Step 1: Add serviceOrderId column to pre_invoices table
ALTER TABLE "pre_invoices" ADD COLUMN "serviceOrderId" TEXT;

-- Step 2: Add unique constraint on serviceOrderId (1:1 relationship between PreInvoice and ServiceOrder)
ALTER TABLE "pre_invoices" ADD CONSTRAINT "pre_invoices_serviceOrderId_key" UNIQUE ("serviceOrderId");

-- Step 3: Add foreign key constraint from pre_invoices.serviceOrderId to service_orders.id
ALTER TABLE "pre_invoices" ADD CONSTRAINT "pre_invoices_serviceOrderId_fkey" FOREIGN KEY ("serviceOrderId") REFERENCES "service_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Note: The orderId column in pre_invoices remains as is (nullable), but now EITHER orderId OR serviceOrderId must be set (application-level XOR validation)
