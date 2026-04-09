/*
  Warnings:

  - You are about to drop the column `observations` on the `service_orders` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "MaterialStatus" AS ENUM ('REQUESTED', 'RESERVED', 'DISPATCHED', 'CONSUMED', 'RETURNED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AdditionalStatus" AS ENUM ('PROPOSED', 'QUOTED', 'APPROVED', 'REJECTED', 'EXECUTED');

-- CreateEnum
CREATE TYPE "ObservationType" AS ENUM ('INTERNAL', 'CLIENT', 'TECHNICAL', 'QUALITY');

-- AlterTable
ALTER TABLE "service_orders" DROP COLUMN "observations",
ADD COLUMN     "internalNotes" TEXT;

-- AlterTable
ALTER TABLE "workshop_receptions" ADD COLUMN     "ingressMotiveId" TEXT;

-- CreateTable
CREATE TABLE "workshop_ingress_motives" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "empresaId" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workshop_ingress_motives_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workshop_labor_time_pauses" (
    "id" TEXT NOT NULL,
    "laborTimeId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "endedAt" TIMESTAMP(3),
    "durationMinutes" INTEGER,
    "reason" TEXT,
    "empresaId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workshop_labor_time_pauses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_order_materials" (
    "id" TEXT NOT NULL,
    "serviceOrderId" TEXT NOT NULL,
    "itemId" TEXT,
    "description" TEXT NOT NULL,
    "quantityRequested" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "quantityReserved" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "quantityDispatched" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "quantityConsumed" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "quantityReturned" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "unitCost" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "unitPrice" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "status" "MaterialStatus" NOT NULL DEFAULT 'REQUESTED',
    "empresaId" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_order_materials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_order_additionals" (
    "id" TEXT NOT NULL,
    "serviceOrderId" TEXT NOT NULL,
    "diagnosisFindingId" TEXT,
    "description" TEXT NOT NULL,
    "technicianId" TEXT,
    "status" "AdditionalStatus" NOT NULL DEFAULT 'PROPOSED',
    "estimatedPrice" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "estimatedTimeMins" INTEGER NOT NULL DEFAULT 0,
    "empresaId" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_order_additionals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_order_observations" (
    "id" TEXT NOT NULL,
    "serviceOrderId" TEXT NOT NULL,
    "type" "ObservationType" NOT NULL DEFAULT 'INTERNAL',
    "observation" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "service_order_observations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workshop_technician_specialties" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "empresaId" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workshop_technician_specialties_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "workshop_ingress_motives_empresaId_idx" ON "workshop_ingress_motives"("empresaId");

-- CreateIndex
CREATE INDEX "workshop_ingress_motives_isActive_idx" ON "workshop_ingress_motives"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "workshop_ingress_motives_empresaId_code_key" ON "workshop_ingress_motives"("empresaId", "code");

-- CreateIndex
CREATE INDEX "workshop_labor_time_pauses_laborTimeId_idx" ON "workshop_labor_time_pauses"("laborTimeId");

-- CreateIndex
CREATE INDEX "workshop_labor_time_pauses_empresaId_idx" ON "workshop_labor_time_pauses"("empresaId");

-- CreateIndex
CREATE INDEX "service_order_materials_serviceOrderId_idx" ON "service_order_materials"("serviceOrderId");

-- CreateIndex
CREATE INDEX "service_order_materials_itemId_idx" ON "service_order_materials"("itemId");

-- CreateIndex
CREATE INDEX "service_order_materials_empresaId_idx" ON "service_order_materials"("empresaId");

-- CreateIndex
CREATE INDEX "service_order_additionals_serviceOrderId_idx" ON "service_order_additionals"("serviceOrderId");

-- CreateIndex
CREATE INDEX "service_order_additionals_empresaId_idx" ON "service_order_additionals"("empresaId");

-- CreateIndex
CREATE INDEX "service_order_observations_serviceOrderId_idx" ON "service_order_observations"("serviceOrderId");

-- CreateIndex
CREATE INDEX "service_order_observations_empresaId_idx" ON "service_order_observations"("empresaId");

-- CreateIndex
CREATE INDEX "workshop_technician_specialties_empresaId_idx" ON "workshop_technician_specialties"("empresaId");

-- CreateIndex
CREATE INDEX "workshop_technician_specialties_isActive_idx" ON "workshop_technician_specialties"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "workshop_technician_specialties_empresaId_code_key" ON "workshop_technician_specialties"("empresaId", "code");

-- AddForeignKey
ALTER TABLE "workshop_ingress_motives" ADD CONSTRAINT "workshop_ingress_motives_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id_empresa") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workshop_labor_time_pauses" ADD CONSTRAINT "workshop_labor_time_pauses_laborTimeId_fkey" FOREIGN KEY ("laborTimeId") REFERENCES "workshop_labor_times"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workshop_labor_time_pauses" ADD CONSTRAINT "workshop_labor_time_pauses_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id_empresa") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_order_materials" ADD CONSTRAINT "service_order_materials_serviceOrderId_fkey" FOREIGN KEY ("serviceOrderId") REFERENCES "service_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_order_materials" ADD CONSTRAINT "service_order_materials_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_order_materials" ADD CONSTRAINT "service_order_materials_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id_empresa") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_order_additionals" ADD CONSTRAINT "service_order_additionals_serviceOrderId_fkey" FOREIGN KEY ("serviceOrderId") REFERENCES "service_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_order_additionals" ADD CONSTRAINT "service_order_additionals_diagnosisFindingId_fkey" FOREIGN KEY ("diagnosisFindingId") REFERENCES "DiagnosisFinding"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_order_additionals" ADD CONSTRAINT "service_order_additionals_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id_empresa") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_order_observations" ADD CONSTRAINT "service_order_observations_serviceOrderId_fkey" FOREIGN KEY ("serviceOrderId") REFERENCES "service_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_order_observations" ADD CONSTRAINT "service_order_observations_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id_empresa") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workshop_technician_specialties" ADD CONSTRAINT "workshop_technician_specialties_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id_empresa") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workshop_receptions" ADD CONSTRAINT "workshop_receptions_ingressMotiveId_fkey" FOREIGN KEY ("ingressMotiveId") REFERENCES "workshop_ingress_motives"("id") ON DELETE SET NULL ON UPDATE CASCADE;
