-- CreateEnum
CREATE TYPE "GaritaEventType" AS ENUM ('VEHICLE_IN', 'VEHICLE_OUT', 'PART_OUT', 'PART_IN', 'ROAD_TEST_OUT', 'ROAD_TEST_IN', 'OTHER');

-- CreateEnum
CREATE TYPE "GaritaEventStatus" AS ENUM ('PENDING', 'AUTHORIZED', 'COMPLETED', 'FLAGGED', 'CANCELLED');

-- CreateTable
CREATE TABLE "workshop_garita" (
    "id" TEXT NOT NULL,
    "type" "GaritaEventType" NOT NULL,
    "status" "GaritaEventStatus" NOT NULL DEFAULT 'PENDING',
    "serviceOrderId" TEXT,
    "totId" TEXT,
    "plateNumber" TEXT,
    "vehicleDesc" TEXT,
    "serialMotor" TEXT,
    "serialBody" TEXT,
    "kmIn" INTEGER,
    "kmOut" INTEGER,
    "driverName" TEXT,
    "driverId" TEXT,
    "exitPassRef" TEXT,
    "authorizedById" TEXT,
    "authorizedAt" TIMESTAMP(3),
    "photoUrls" JSONB,
    "hasIrregularity" BOOLEAN NOT NULL DEFAULT false,
    "irregularityNotes" TEXT,
    "eventAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "notes" TEXT,
    "empresaId" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workshop_garita_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "workshop_garita_empresaId_idx" ON "workshop_garita"("empresaId");

-- CreateIndex
CREATE INDEX "workshop_garita_serviceOrderId_idx" ON "workshop_garita"("serviceOrderId");

-- CreateIndex
CREATE INDEX "workshop_garita_totId_idx" ON "workshop_garita"("totId");

-- CreateIndex
CREATE INDEX "workshop_garita_type_idx" ON "workshop_garita"("type");

-- CreateIndex
CREATE INDEX "workshop_garita_status_idx" ON "workshop_garita"("status");

-- CreateIndex
CREATE INDEX "workshop_garita_plateNumber_idx" ON "workshop_garita"("plateNumber");

-- CreateIndex
CREATE INDEX "workshop_garita_empresaId_eventAt_idx" ON "workshop_garita"("empresaId", "eventAt");

-- AddForeignKey
ALTER TABLE "workshop_garita" ADD CONSTRAINT "workshop_garita_serviceOrderId_fkey" FOREIGN KEY ("serviceOrderId") REFERENCES "service_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workshop_garita" ADD CONSTRAINT "workshop_garita_totId_fkey" FOREIGN KEY ("totId") REFERENCES "workshop_tot"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workshop_garita" ADD CONSTRAINT "workshop_garita_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id_empresa") ON DELETE RESTRICT ON UPDATE CASCADE;
