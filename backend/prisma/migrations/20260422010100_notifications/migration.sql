-- CreateEnum
CREATE TYPE "NotificationPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "NotificationSeverity" AS ENUM ('INFO', 'WARNING', 'ERROR', 'SUCCESS');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('IN_APP');

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "eventCode" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "channel" "NotificationChannel" NOT NULL DEFAULT 'IN_APP',
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'info',
    "entityType" TEXT,
    "entityId" TEXT,
    "priority" "NotificationPriority" NOT NULL DEFAULT 'MEDIUM',
    "severity" "NotificationSeverity" NOT NULL DEFAULT 'INFO',
    "link" TEXT,
    "source" TEXT,
    "dedupKey" TEXT,
    "isMandatory" BOOLEAN NOT NULL DEFAULT false,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "readBy" TEXT,
    "eliminado" BOOLEAN NOT NULL DEFAULT false,
    "createdBy" TEXT,
    "createdByName" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_company_policies" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "eventCode" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "mandatory" BOOLEAN NOT NULL DEFAULT false,
    "requiredPermissionsAny" TEXT[],
    "dedupWindowSec" INTEGER NOT NULL DEFAULT 300,
    "updatedBy" TEXT,
    "updatedByName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_company_policies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_membership_preferences" (
    "id" TEXT NOT NULL,
    "membershipId" TEXT NOT NULL,
    "eventCode" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "updatedBy" TEXT,
    "updatedByName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_membership_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "notifications_empresaId_userId_createdAt_idx" ON "notifications"("empresaId", "userId", "createdAt");

-- CreateIndex
CREATE INDEX "notifications_empresaId_userId_read_eliminado_idx" ON "notifications"("empresaId", "userId", "read", "eliminado");

-- CreateIndex
CREATE INDEX "notifications_userId_read_eliminado_idx" ON "notifications"("userId", "read", "eliminado");

-- CreateIndex
CREATE INDEX "notifications_empresaId_eventCode_createdAt_idx" ON "notifications"("empresaId", "eventCode", "createdAt");

-- CreateIndex
CREATE INDEX "notifications_empresaId_module_createdAt_idx" ON "notifications"("empresaId", "module", "createdAt");

-- CreateIndex
CREATE INDEX "notifications_empresaId_userId_dedupKey_createdAt_idx" ON "notifications"("empresaId", "userId", "dedupKey", "createdAt");

-- CreateIndex
CREATE INDEX "notifications_empresaId_entityType_entityId_idx" ON "notifications"("empresaId", "entityType", "entityId");

-- CreateIndex
CREATE UNIQUE INDEX "notification_company_policies_empresaId_eventCode_key" ON "notification_company_policies"("empresaId", "eventCode");

-- CreateIndex
CREATE INDEX "notification_company_policies_empresaId_enabled_idx" ON "notification_company_policies"("empresaId", "enabled");

-- CreateIndex
CREATE UNIQUE INDEX "notification_membership_preferences_membershipId_eventCode_key" ON "notification_membership_preferences"("membershipId", "eventCode");

-- CreateIndex
CREATE INDEX "notification_membership_preferences_eventCode_idx" ON "notification_membership_preferences"("eventCode");

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id_empresa") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_company_policies" ADD CONSTRAINT "notification_company_policies_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id_empresa") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_membership_preferences" ADD CONSTRAINT "notification_membership_preferences_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "memberships"("id") ON DELETE CASCADE ON UPDATE CASCADE;
