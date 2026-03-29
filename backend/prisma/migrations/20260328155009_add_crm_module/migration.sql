/*
  Warnings:

  - You are about to drop the column `sellerId` on the `customers` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('CALL', 'EMAIL', 'WHATSAPP', 'MEETING', 'QUOTE', 'TASK');

-- CreateEnum
CREATE TYPE "ActivityStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'DONE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "CustomerSegment" AS ENUM ('PROSPECT', 'REGULAR', 'VIP', 'WHOLESALE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "CustomerChannel" AS ENUM ('REPUESTOS', 'TALLER', 'VEHICULOS', 'ALL');

-- CreateEnum
CREATE TYPE "FuelType" AS ENUM ('GASOLINE', 'DIESEL', 'ELECTRIC', 'HYBRID', 'GAS');

-- CreateEnum
CREATE TYPE "TransmissionType" AS ENUM ('MANUAL', 'AUTOMATIC', 'CVT');

-- CreateEnum
CREATE TYPE "InteractionType" AS ENUM ('CALL', 'WHATSAPP', 'EMAIL', 'VISIT', 'NOTE', 'QUOTE', 'FOLLOW_UP', 'MEETING');

-- CreateEnum
CREATE TYPE "InteractionChannel" AS ENUM ('REPUESTOS', 'TALLER', 'VEHICULOS', 'GENERAL');

-- CreateEnum
CREATE TYPE "InteractionDirection" AS ENUM ('INBOUND', 'OUTBOUND');

-- CreateEnum
CREATE TYPE "LeadSource" AS ENUM ('WALK_IN', 'REFERRAL', 'PHONE', 'WHATSAPP', 'SOCIAL_MEDIA', 'WEBSITE', 'EMAIL', 'OTHER');

-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST');

-- CreateEnum
CREATE TYPE "LeadChannel" AS ENUM ('REPUESTOS', 'TALLER', 'VEHICULOS');

-- AlterTable
ALTER TABLE "customers" DROP COLUMN "sellerId",
ADD COLUMN     "assignedSellerId" TEXT,
ADD COLUMN     "customerSince" TIMESTAMP(3),
ADD COLUMN     "preferredChannel" "CustomerChannel" NOT NULL DEFAULT 'ALL',
ADD COLUMN     "referredById" TEXT,
ADD COLUMN     "segment" "CustomerSegment" NOT NULL DEFAULT 'PROSPECT';

-- CreateTable
CREATE TABLE "crm_activities" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "leadId" TEXT,
    "type" "ActivityType" NOT NULL,
    "status" "ActivityStatus" NOT NULL DEFAULT 'PENDING',
    "title" TEXT NOT NULL,
    "description" TEXT,
    "assignedTo" TEXT NOT NULL,
    "dueAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "completedBy" TEXT,
    "outcome" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crm_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_contacts" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT,
    "phone" TEXT,
    "mobile" TEXT,
    "email" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customer_contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_vehicles" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "plate" TEXT NOT NULL,
    "vin" TEXT,
    "brand" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "year" INTEGER,
    "color" TEXT,
    "fuelType" "FuelType",
    "transmission" "TransmissionType",
    "mileage" INTEGER,
    "purchasedHere" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customer_vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm_interactions" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "leadId" TEXT,
    "type" "InteractionType" NOT NULL,
    "channel" "InteractionChannel" NOT NULL DEFAULT 'GENERAL',
    "direction" "InteractionDirection" NOT NULL DEFAULT 'OUTBOUND',
    "subject" TEXT,
    "notes" TEXT NOT NULL,
    "outcome" TEXT,
    "nextAction" TEXT,
    "nextActionAt" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crm_interactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm_leads" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "customerId" TEXT,
    "channel" "LeadChannel" NOT NULL,
    "source" "LeadSource" NOT NULL DEFAULT 'WALK_IN',
    "status" "LeadStatus" NOT NULL DEFAULT 'NEW',
    "title" TEXT NOT NULL,
    "description" TEXT,
    "estimatedValue" DECIMAL(12,2),
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "assignedTo" TEXT,
    "expectedCloseAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "lostReason" TEXT,
    "orderId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crm_leads_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "crm_activities_empresaId_idx" ON "crm_activities"("empresaId");

-- CreateIndex
CREATE INDEX "crm_activities_customerId_idx" ON "crm_activities"("customerId");

-- CreateIndex
CREATE INDEX "crm_activities_leadId_idx" ON "crm_activities"("leadId");

-- CreateIndex
CREATE INDEX "crm_activities_assignedTo_idx" ON "crm_activities"("assignedTo");

-- CreateIndex
CREATE INDEX "crm_activities_status_idx" ON "crm_activities"("status");

-- CreateIndex
CREATE INDEX "crm_activities_dueAt_idx" ON "crm_activities"("dueAt");

-- CreateIndex
CREATE INDEX "customer_contacts_customerId_idx" ON "customer_contacts"("customerId");

-- CreateIndex
CREATE INDEX "customer_contacts_empresaId_idx" ON "customer_contacts"("empresaId");

-- CreateIndex
CREATE UNIQUE INDEX "customer_contacts_customerId_email_key" ON "customer_contacts"("customerId", "email");

-- CreateIndex
CREATE INDEX "customer_vehicles_customerId_idx" ON "customer_vehicles"("customerId");

-- CreateIndex
CREATE INDEX "customer_vehicles_vin_idx" ON "customer_vehicles"("vin");

-- CreateIndex
CREATE INDEX "customer_vehicles_empresaId_idx" ON "customer_vehicles"("empresaId");

-- CreateIndex
CREATE UNIQUE INDEX "customer_vehicles_empresaId_plate_key" ON "customer_vehicles"("empresaId", "plate");

-- CreateIndex
CREATE INDEX "crm_interactions_empresaId_idx" ON "crm_interactions"("empresaId");

-- CreateIndex
CREATE INDEX "crm_interactions_customerId_idx" ON "crm_interactions"("customerId");

-- CreateIndex
CREATE INDEX "crm_interactions_leadId_idx" ON "crm_interactions"("leadId");

-- CreateIndex
CREATE INDEX "crm_interactions_type_idx" ON "crm_interactions"("type");

-- CreateIndex
CREATE INDEX "crm_interactions_channel_idx" ON "crm_interactions"("channel");

-- CreateIndex
CREATE INDEX "crm_interactions_createdAt_idx" ON "crm_interactions"("createdAt");

-- CreateIndex
CREATE INDEX "crm_interactions_nextActionAt_idx" ON "crm_interactions"("nextActionAt");

-- CreateIndex
CREATE UNIQUE INDEX "crm_leads_orderId_key" ON "crm_leads"("orderId");

-- CreateIndex
CREATE INDEX "crm_leads_empresaId_idx" ON "crm_leads"("empresaId");

-- CreateIndex
CREATE INDEX "crm_leads_customerId_idx" ON "crm_leads"("customerId");

-- CreateIndex
CREATE INDEX "crm_leads_channel_idx" ON "crm_leads"("channel");

-- CreateIndex
CREATE INDEX "crm_leads_status_idx" ON "crm_leads"("status");

-- CreateIndex
CREATE INDEX "crm_leads_assignedTo_idx" ON "crm_leads"("assignedTo");

-- CreateIndex
CREATE INDEX "crm_leads_expectedCloseAt_idx" ON "crm_leads"("expectedCloseAt");

-- CreateIndex
CREATE INDEX "customers_segment_idx" ON "customers"("segment");

-- CreateIndex
CREATE INDEX "customers_assignedSellerId_idx" ON "customers"("assignedSellerId");

-- AddForeignKey
ALTER TABLE "crm_activities" ADD CONSTRAINT "crm_activities_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id_empresa") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_activities" ADD CONSTRAINT "crm_activities_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_activities" ADD CONSTRAINT "crm_activities_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "crm_leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_referredById_fkey" FOREIGN KEY ("referredById") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_contacts" ADD CONSTRAINT "customer_contacts_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_contacts" ADD CONSTRAINT "customer_contacts_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id_empresa") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_vehicles" ADD CONSTRAINT "customer_vehicles_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_vehicles" ADD CONSTRAINT "customer_vehicles_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id_empresa") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_interactions" ADD CONSTRAINT "crm_interactions_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id_empresa") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_interactions" ADD CONSTRAINT "crm_interactions_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_interactions" ADD CONSTRAINT "crm_interactions_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "crm_leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_leads" ADD CONSTRAINT "crm_leads_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id_empresa") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_leads" ADD CONSTRAINT "crm_leads_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
