-- CreateEnum
CREATE TYPE "ServiceOrderStatus" AS ENUM ('RECEIVED', 'IN_PROGRESS', 'DONE', 'DELIVERED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ServiceOrderItemType" AS ENUM ('LABOR', 'PART', 'OTHER');

-- CreateTable
CREATE TABLE "service_orders" (
    "id" TEXT NOT NULL,
    "folio" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "customerVehicleId" TEXT,
    "vehiclePlate" TEXT,
    "vehicleDesc" TEXT,
    "mileageIn" INTEGER,
    "mileageOut" INTEGER,
    "diagnosisNotes" TEXT,
    "observations" TEXT,
    "status" "ServiceOrderStatus" NOT NULL DEFAULT 'RECEIVED',
    "assignedTechnicianId" TEXT,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "estimatedDelivery" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "laborTotal" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "partsTotal" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "empresaId" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_order_items" (
    "id" TEXT NOT NULL,
    "serviceOrderId" TEXT NOT NULL,
    "type" "ServiceOrderItemType" NOT NULL DEFAULT 'LABOR',
    "description" TEXT NOT NULL,
    "quantity" DECIMAL(10,2) NOT NULL DEFAULT 1,
    "unitPrice" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(12,2) NOT NULL DEFAULT 0,

    CONSTRAINT "service_order_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "service_orders_empresaId_idx" ON "service_orders"("empresaId");

-- CreateIndex
CREATE INDEX "service_orders_customerId_idx" ON "service_orders"("customerId");

-- CreateIndex
CREATE INDEX "service_orders_customerVehicleId_idx" ON "service_orders"("customerVehicleId");

-- CreateIndex
CREATE INDEX "service_orders_status_idx" ON "service_orders"("status");

-- CreateIndex
CREATE INDEX "service_orders_assignedTechnicianId_idx" ON "service_orders"("assignedTechnicianId");

-- CreateIndex
CREATE INDEX "service_orders_receivedAt_idx" ON "service_orders"("receivedAt");

-- CreateIndex
CREATE UNIQUE INDEX "service_orders_empresaId_folio_key" ON "service_orders"("empresaId", "folio");

-- CreateIndex
CREATE INDEX "service_order_items_serviceOrderId_idx" ON "service_order_items"("serviceOrderId");

-- AddForeignKey
ALTER TABLE "service_orders" ADD CONSTRAINT "service_orders_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id_empresa") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_orders" ADD CONSTRAINT "service_orders_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_orders" ADD CONSTRAINT "service_orders_customerVehicleId_fkey" FOREIGN KEY ("customerVehicleId") REFERENCES "customer_vehicles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_order_items" ADD CONSTRAINT "service_order_items_serviceOrderId_fkey" FOREIGN KEY ("serviceOrderId") REFERENCES "service_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
