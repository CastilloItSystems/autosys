/*
  Warnings:

  - The values [RECEIVED,DONE] on the enum `ServiceOrderStatus` will be removed. If these variants are still used in the database, this will fail.
  - A unique constraint covering the columns `[serviceOrderId]` on the table `crm_leads` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[appointmentId]` on the table `service_orders` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[receptionId]` on the table `service_orders` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[invoiceId]` on the table `service_orders` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "LaborTimeStatus" AS ENUM ('ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "QualityCheckStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'PASSED', 'FAILED');

-- CreateEnum
CREATE TYPE "AppointmentStatus" AS ENUM ('SCHEDULED', 'CONFIRMED', 'ARRIVED', 'COMPLETED', 'NO_SHOW', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ServiceOrderPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'ASAP');

-- CreateEnum
CREATE TYPE "FuelLevel" AS ENUM ('EMPTY', 'QUARTER', 'HALF', 'THREE_QUARTERS', 'FULL');

-- CreateEnum
CREATE TYPE "WarrantyType" AS ENUM ('LABOR', 'PARTS', 'MIXED', 'COMMERCIAL');

-- CreateEnum
CREATE TYPE "WarrantyStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'REJECTED', 'CLOSED');

-- AlterEnum
BEGIN;
CREATE TYPE "ServiceOrderStatus_new" AS ENUM ('DRAFT', 'OPEN', 'DIAGNOSING', 'PENDING_APPROVAL', 'APPROVED', 'IN_PROGRESS', 'PAUSED', 'WAITING_PARTS', 'WAITING_AUTH', 'QUALITY_CHECK', 'READY', 'DELIVERED', 'INVOICED', 'CLOSED', 'CANCELLED');
ALTER TABLE "public"."service_orders" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "service_orders" ALTER COLUMN "status" TYPE "ServiceOrderStatus_new" USING ("status"::text::"ServiceOrderStatus_new");
ALTER TYPE "ServiceOrderStatus" RENAME TO "ServiceOrderStatus_old";
ALTER TYPE "ServiceOrderStatus_new" RENAME TO "ServiceOrderStatus";
DROP TYPE "public"."ServiceOrderStatus_old";
ALTER TABLE "service_orders" ALTER COLUMN "status" SET DEFAULT 'DRAFT';
COMMIT;

-- AlterTable
ALTER TABLE "crm_leads" ADD COLUMN     "serviceOrderId" TEXT;

-- AlterTable
ALTER TABLE "service_order_items" ADD COLUMN     "discountPct" DECIMAL(5,2) NOT NULL DEFAULT 0,
ADD COLUMN     "itemId" TEXT,
ADD COLUMN     "operationId" TEXT,
ADD COLUMN     "stockDeducted" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "service_orders" ADD COLUMN     "appointmentId" TEXT,
ADD COLUMN     "assignedAdvisorId" TEXT,
ADD COLUMN     "bayId" TEXT,
ADD COLUMN     "closedAt" TIMESTAMP(3),
ADD COLUMN     "invoiceId" TEXT,
ADD COLUMN     "otherTotal" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "priority" "ServiceOrderPriority" NOT NULL DEFAULT 'NORMAL',
ADD COLUMN     "receptionId" TEXT,
ADD COLUMN     "serviceTypeId" TEXT,
ADD COLUMN     "subtotal" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "taxAmt" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "workshopQuoteId" TEXT,
ALTER COLUMN "status" SET DEFAULT 'DRAFT';

-- CreateTable
CREATE TABLE "workshop_labor_times" (
    "id" TEXT NOT NULL,
    "serviceOrderId" TEXT NOT NULL,
    "serviceOrderItemId" TEXT,
    "operationId" TEXT,
    "technicianId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "pausedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "pausedMinutes" INTEGER NOT NULL DEFAULT 0,
    "realMinutes" INTEGER,
    "standardMinutes" INTEGER,
    "status" "LaborTimeStatus" NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workshop_labor_times_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workshop_quality_checks" (
    "id" TEXT NOT NULL,
    "serviceOrderId" TEXT NOT NULL,
    "inspectorId" TEXT NOT NULL,
    "status" "QualityCheckStatus" NOT NULL DEFAULT 'PENDING',
    "checklistItems" JSONB,
    "failureNotes" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workshop_quality_checks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workshop_appointments" (
    "id" TEXT NOT NULL,
    "folio" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "customerVehicleId" TEXT,
    "vehiclePlate" TEXT,
    "vehicleDesc" TEXT,
    "serviceTypeId" TEXT,
    "scheduledDate" TIMESTAMP(3) NOT NULL,
    "estimatedMinutes" INTEGER,
    "assignedAdvisorId" TEXT,
    "status" "AppointmentStatus" NOT NULL DEFAULT 'SCHEDULED',
    "clientNotes" TEXT,
    "internalNotes" TEXT,
    "empresaId" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workshop_appointments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workshop_service_types" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "standardMinutes" INTEGER,
    "standardLaborPrice" DECIMAL(12,2),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "empresaId" TEXT NOT NULL,

    CONSTRAINT "workshop_service_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workshop_receptions" (
    "id" TEXT NOT NULL,
    "folio" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "customerVehicleId" TEXT,
    "vehiclePlate" TEXT,
    "vehicleDesc" TEXT,
    "mileageIn" INTEGER,
    "fuelLevel" "FuelLevel",
    "accessories" JSONB,
    "hasPreExistingDamage" BOOLEAN NOT NULL DEFAULT false,
    "damageNotes" TEXT,
    "clientDescription" TEXT,
    "authorizationName" TEXT,
    "authorizationPhone" TEXT,
    "estimatedDelivery" TIMESTAMP(3),
    "advisorId" TEXT,
    "appointmentId" TEXT,
    "empresaId" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workshop_receptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workshop_bays" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "empresaId" TEXT NOT NULL,

    CONSTRAINT "workshop_bays_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workshop_operations" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "serviceTypeId" TEXT,
    "standardMinutes" INTEGER,
    "listPrice" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "empresaId" TEXT NOT NULL,

    CONSTRAINT "workshop_operations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workshop_warranties" (
    "id" TEXT NOT NULL,
    "warrantyNumber" TEXT NOT NULL,
    "type" "WarrantyType" NOT NULL,
    "status" "WarrantyStatus" NOT NULL DEFAULT 'OPEN',
    "originalOrderId" TEXT NOT NULL,
    "reworkOrderId" TEXT,
    "customerId" TEXT NOT NULL,
    "customerVehicleId" TEXT,
    "description" TEXT NOT NULL,
    "rootCause" TEXT,
    "resolution" TEXT,
    "technicianId" TEXT,
    "expiresAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "empresaId" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workshop_warranties_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "workshop_labor_times_serviceOrderId_idx" ON "workshop_labor_times"("serviceOrderId");

-- CreateIndex
CREATE INDEX "workshop_labor_times_serviceOrderItemId_idx" ON "workshop_labor_times"("serviceOrderItemId");

-- CreateIndex
CREATE INDEX "workshop_labor_times_technicianId_idx" ON "workshop_labor_times"("technicianId");

-- CreateIndex
CREATE INDEX "workshop_labor_times_status_idx" ON "workshop_labor_times"("status");

-- CreateIndex
CREATE INDEX "workshop_labor_times_startedAt_idx" ON "workshop_labor_times"("startedAt");

-- CreateIndex
CREATE UNIQUE INDEX "workshop_quality_checks_serviceOrderId_key" ON "workshop_quality_checks"("serviceOrderId");

-- CreateIndex
CREATE INDEX "workshop_quality_checks_serviceOrderId_idx" ON "workshop_quality_checks"("serviceOrderId");

-- CreateIndex
CREATE INDEX "workshop_quality_checks_inspectorId_idx" ON "workshop_quality_checks"("inspectorId");

-- CreateIndex
CREATE INDEX "workshop_quality_checks_status_idx" ON "workshop_quality_checks"("status");

-- CreateIndex
CREATE INDEX "workshop_appointments_empresaId_idx" ON "workshop_appointments"("empresaId");

-- CreateIndex
CREATE INDEX "workshop_appointments_customerId_idx" ON "workshop_appointments"("customerId");

-- CreateIndex
CREATE INDEX "workshop_appointments_customerVehicleId_idx" ON "workshop_appointments"("customerVehicleId");

-- CreateIndex
CREATE INDEX "workshop_appointments_scheduledDate_idx" ON "workshop_appointments"("scheduledDate");

-- CreateIndex
CREATE INDEX "workshop_appointments_status_idx" ON "workshop_appointments"("status");

-- CreateIndex
CREATE INDEX "workshop_appointments_assignedAdvisorId_idx" ON "workshop_appointments"("assignedAdvisorId");

-- CreateIndex
CREATE UNIQUE INDEX "workshop_appointments_empresaId_folio_key" ON "workshop_appointments"("empresaId", "folio");

-- CreateIndex
CREATE INDEX "workshop_service_types_empresaId_idx" ON "workshop_service_types"("empresaId");

-- CreateIndex
CREATE INDEX "workshop_service_types_isActive_idx" ON "workshop_service_types"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "workshop_service_types_empresaId_code_key" ON "workshop_service_types"("empresaId", "code");

-- CreateIndex
CREATE INDEX "workshop_receptions_empresaId_idx" ON "workshop_receptions"("empresaId");

-- CreateIndex
CREATE INDEX "workshop_receptions_customerId_idx" ON "workshop_receptions"("customerId");

-- CreateIndex
CREATE INDEX "workshop_receptions_customerVehicleId_idx" ON "workshop_receptions"("customerVehicleId");

-- CreateIndex
CREATE INDEX "workshop_receptions_appointmentId_idx" ON "workshop_receptions"("appointmentId");

-- CreateIndex
CREATE INDEX "workshop_receptions_createdAt_idx" ON "workshop_receptions"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "workshop_receptions_empresaId_folio_key" ON "workshop_receptions"("empresaId", "folio");

-- CreateIndex
CREATE INDEX "workshop_bays_empresaId_idx" ON "workshop_bays"("empresaId");

-- CreateIndex
CREATE INDEX "workshop_bays_isActive_idx" ON "workshop_bays"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "workshop_bays_empresaId_code_key" ON "workshop_bays"("empresaId", "code");

-- CreateIndex
CREATE INDEX "workshop_operations_empresaId_idx" ON "workshop_operations"("empresaId");

-- CreateIndex
CREATE INDEX "workshop_operations_serviceTypeId_idx" ON "workshop_operations"("serviceTypeId");

-- CreateIndex
CREATE INDEX "workshop_operations_isActive_idx" ON "workshop_operations"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "workshop_operations_empresaId_code_key" ON "workshop_operations"("empresaId", "code");

-- CreateIndex
CREATE INDEX "workshop_warranties_empresaId_idx" ON "workshop_warranties"("empresaId");

-- CreateIndex
CREATE INDEX "workshop_warranties_originalOrderId_idx" ON "workshop_warranties"("originalOrderId");

-- CreateIndex
CREATE INDEX "workshop_warranties_customerId_idx" ON "workshop_warranties"("customerId");

-- CreateIndex
CREATE INDEX "workshop_warranties_status_idx" ON "workshop_warranties"("status");

-- CreateIndex
CREATE INDEX "workshop_warranties_technicianId_idx" ON "workshop_warranties"("technicianId");

-- CreateIndex
CREATE UNIQUE INDEX "workshop_warranties_empresaId_warrantyNumber_key" ON "workshop_warranties"("empresaId", "warrantyNumber");

-- CreateIndex
CREATE UNIQUE INDEX "crm_leads_serviceOrderId_key" ON "crm_leads"("serviceOrderId");

-- CreateIndex
CREATE INDEX "service_order_items_operationId_idx" ON "service_order_items"("operationId");

-- CreateIndex
CREATE INDEX "service_order_items_itemId_idx" ON "service_order_items"("itemId");

-- CreateIndex
CREATE UNIQUE INDEX "service_orders_appointmentId_key" ON "service_orders"("appointmentId");

-- CreateIndex
CREATE UNIQUE INDEX "service_orders_receptionId_key" ON "service_orders"("receptionId");

-- CreateIndex
CREATE UNIQUE INDEX "service_orders_invoiceId_key" ON "service_orders"("invoiceId");

-- CreateIndex
CREATE INDEX "service_orders_priority_idx" ON "service_orders"("priority");

-- CreateIndex
CREATE INDEX "service_orders_assignedAdvisorId_idx" ON "service_orders"("assignedAdvisorId");

-- CreateIndex
CREATE INDEX "service_orders_estimatedDelivery_idx" ON "service_orders"("estimatedDelivery");

-- AddForeignKey
ALTER TABLE "crm_leads" ADD CONSTRAINT "crm_leads_serviceOrderId_fkey" FOREIGN KEY ("serviceOrderId") REFERENCES "service_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workshop_labor_times" ADD CONSTRAINT "workshop_labor_times_serviceOrderId_fkey" FOREIGN KEY ("serviceOrderId") REFERENCES "service_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workshop_labor_times" ADD CONSTRAINT "workshop_labor_times_serviceOrderItemId_fkey" FOREIGN KEY ("serviceOrderItemId") REFERENCES "service_order_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workshop_labor_times" ADD CONSTRAINT "workshop_labor_times_operationId_fkey" FOREIGN KEY ("operationId") REFERENCES "workshop_operations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workshop_quality_checks" ADD CONSTRAINT "workshop_quality_checks_serviceOrderId_fkey" FOREIGN KEY ("serviceOrderId") REFERENCES "service_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workshop_appointments" ADD CONSTRAINT "workshop_appointments_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workshop_appointments" ADD CONSTRAINT "workshop_appointments_customerVehicleId_fkey" FOREIGN KEY ("customerVehicleId") REFERENCES "customer_vehicles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workshop_appointments" ADD CONSTRAINT "workshop_appointments_serviceTypeId_fkey" FOREIGN KEY ("serviceTypeId") REFERENCES "workshop_service_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workshop_appointments" ADD CONSTRAINT "workshop_appointments_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id_empresa") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_orders" ADD CONSTRAINT "service_orders_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "workshop_appointments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_orders" ADD CONSTRAINT "service_orders_receptionId_fkey" FOREIGN KEY ("receptionId") REFERENCES "workshop_receptions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_orders" ADD CONSTRAINT "service_orders_serviceTypeId_fkey" FOREIGN KEY ("serviceTypeId") REFERENCES "workshop_service_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_orders" ADD CONSTRAINT "service_orders_bayId_fkey" FOREIGN KEY ("bayId") REFERENCES "workshop_bays"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_orders" ADD CONSTRAINT "service_orders_workshopQuoteId_fkey" FOREIGN KEY ("workshopQuoteId") REFERENCES "crm_quotes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_orders" ADD CONSTRAINT "service_orders_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "invoices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_order_items" ADD CONSTRAINT "service_order_items_operationId_fkey" FOREIGN KEY ("operationId") REFERENCES "workshop_operations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_order_items" ADD CONSTRAINT "service_order_items_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workshop_service_types" ADD CONSTRAINT "workshop_service_types_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id_empresa") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workshop_receptions" ADD CONSTRAINT "workshop_receptions_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workshop_receptions" ADD CONSTRAINT "workshop_receptions_customerVehicleId_fkey" FOREIGN KEY ("customerVehicleId") REFERENCES "customer_vehicles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workshop_receptions" ADD CONSTRAINT "workshop_receptions_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "workshop_appointments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workshop_receptions" ADD CONSTRAINT "workshop_receptions_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id_empresa") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workshop_bays" ADD CONSTRAINT "workshop_bays_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id_empresa") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workshop_operations" ADD CONSTRAINT "workshop_operations_serviceTypeId_fkey" FOREIGN KEY ("serviceTypeId") REFERENCES "workshop_service_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workshop_operations" ADD CONSTRAINT "workshop_operations_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id_empresa") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workshop_warranties" ADD CONSTRAINT "workshop_warranties_originalOrderId_fkey" FOREIGN KEY ("originalOrderId") REFERENCES "service_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workshop_warranties" ADD CONSTRAINT "workshop_warranties_reworkOrderId_fkey" FOREIGN KEY ("reworkOrderId") REFERENCES "service_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workshop_warranties" ADD CONSTRAINT "workshop_warranties_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workshop_warranties" ADD CONSTRAINT "workshop_warranties_customerVehicleId_fkey" FOREIGN KEY ("customerVehicleId") REFERENCES "customer_vehicles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workshop_warranties" ADD CONSTRAINT "workshop_warranties_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id_empresa") ON DELETE RESTRICT ON UPDATE CASCADE;
