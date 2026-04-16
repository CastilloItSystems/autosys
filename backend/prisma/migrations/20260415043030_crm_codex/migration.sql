-- CreateEnum
CREATE TYPE "CampaignStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "CampaignChannel" AS ENUM ('EMAIL', 'WHATSAPP', 'PHONE', 'SOCIAL_MEDIA', 'WEB', 'OTHER');

-- CreateEnum
CREATE TYPE "LoyaltyEventType" AS ENUM ('NPS_SENT', 'NPS_RECEIVED', 'MAINTENANCE_REMINDER', 'REACTIVATION_CONTACT', 'FOLLOW_UP');

-- CreateEnum
CREATE TYPE "LoyaltyEventStatus" AS ENUM ('PENDING', 'DONE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "OpportunityStatus" AS ENUM ('OPEN', 'WON', 'LOST');

-- CreateEnum
CREATE TYPE "AlertSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "CrmAlertStatus" AS ENUM ('OPEN', 'RESOLVED', 'DISMISSED');

-- CreateEnum
CREATE TYPE "CrmAlertType" AS ENUM ('STALE_OPPORTUNITY', 'OVERDUE_ACTIVITY', 'OVERDUE_CASE', 'CLOSE_DATE_REMINDER');

-- AlterTable
ALTER TABLE "crm_leads" ADD COLUMN     "campaignId" TEXT;

-- CreateTable
CREATE TABLE "crm_campaigns" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "CampaignStatus" NOT NULL DEFAULT 'DRAFT',
    "channel" "CampaignChannel" NOT NULL DEFAULT 'OTHER',
    "budget" DECIMAL(12,2),
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "sentCount" INTEGER NOT NULL DEFAULT 0,
    "responseCount" INTEGER NOT NULL DEFAULT 0,
    "leadsCreatedCount" INTEGER NOT NULL DEFAULT 0,
    "opportunitiesCount" INTEGER NOT NULL DEFAULT 0,
    "opportunitiesWonCount" INTEGER NOT NULL DEFAULT 0,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crm_campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm_campaign_audiences" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "segment" TEXT NOT NULL,
    "filters" JSONB,
    "audienceSize" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "crm_campaign_audiences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm_campaign_results" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "reportedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sent" INTEGER NOT NULL DEFAULT 0,
    "responses" INTEGER NOT NULL DEFAULT 0,
    "leadsCreated" INTEGER NOT NULL DEFAULT 0,
    "opportunitiesCreated" INTEGER NOT NULL DEFAULT 0,
    "opportunitiesWon" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,

    CONSTRAINT "crm_campaign_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm_loyalty_events" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "type" "LoyaltyEventType" NOT NULL,
    "status" "LoyaltyEventStatus" NOT NULL DEFAULT 'PENDING',
    "title" TEXT NOT NULL,
    "description" TEXT,
    "suggestedAction" TEXT,
    "dueAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crm_loyalty_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm_customer_surveys" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'NPS',
    "score" INTEGER,
    "feedback" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,

    CONSTRAINT "crm_customer_surveys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm_opportunities" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "leadId" TEXT,
    "customerId" TEXT,
    "campaignId" TEXT,
    "channel" "LeadChannel" NOT NULL,
    "stageCode" TEXT NOT NULL,
    "status" "OpportunityStatus" NOT NULL DEFAULT 'OPEN',
    "title" TEXT NOT NULL,
    "description" TEXT,
    "amount" DECIMAL(12,2),
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "ownerId" TEXT NOT NULL,
    "nextActivityAt" TIMESTAMP(3) NOT NULL,
    "expectedCloseAt" TIMESTAMP(3),
    "wonAt" TIMESTAMP(3),
    "lostAt" TIMESTAMP(3),
    "lostReasonId" TEXT,
    "lostReasonText" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crm_opportunities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm_opportunity_stage_configs" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "channel" "LeadChannel" NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "isTerminal" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crm_opportunity_stage_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm_opportunity_loss_reasons" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crm_opportunity_loss_reasons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm_opportunity_stage_history" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "opportunityId" TEXT NOT NULL,
    "fromStage" TEXT,
    "toStage" TEXT NOT NULL,
    "notes" TEXT,
    "changedBy" TEXT NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "crm_opportunity_stage_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm_opportunity_activity_links" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "opportunityId" TEXT NOT NULL,
    "activityId" TEXT NOT NULL,
    "linkedBy" TEXT NOT NULL,
    "linkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "crm_opportunity_activity_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm_automation_alerts" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "type" "CrmAlertType" NOT NULL,
    "status" "CrmAlertStatus" NOT NULL DEFAULT 'OPEN',
    "severity" "AlertSeverity" NOT NULL DEFAULT 'MEDIUM',
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "dedupeKey" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "crm_automation_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "crm_campaigns_empresaId_idx" ON "crm_campaigns"("empresaId");

-- CreateIndex
CREATE INDEX "crm_campaigns_status_idx" ON "crm_campaigns"("status");

-- CreateIndex
CREATE INDEX "crm_campaigns_channel_idx" ON "crm_campaigns"("channel");

-- CreateIndex
CREATE INDEX "crm_campaigns_startsAt_idx" ON "crm_campaigns"("startsAt");

-- CreateIndex
CREATE INDEX "crm_campaign_audiences_empresaId_idx" ON "crm_campaign_audiences"("empresaId");

-- CreateIndex
CREATE INDEX "crm_campaign_audiences_campaignId_idx" ON "crm_campaign_audiences"("campaignId");

-- CreateIndex
CREATE INDEX "crm_campaign_results_empresaId_idx" ON "crm_campaign_results"("empresaId");

-- CreateIndex
CREATE INDEX "crm_campaign_results_campaignId_idx" ON "crm_campaign_results"("campaignId");

-- CreateIndex
CREATE INDEX "crm_campaign_results_reportedAt_idx" ON "crm_campaign_results"("reportedAt");

-- CreateIndex
CREATE INDEX "crm_loyalty_events_empresaId_idx" ON "crm_loyalty_events"("empresaId");

-- CreateIndex
CREATE INDEX "crm_loyalty_events_customerId_idx" ON "crm_loyalty_events"("customerId");

-- CreateIndex
CREATE INDEX "crm_loyalty_events_type_idx" ON "crm_loyalty_events"("type");

-- CreateIndex
CREATE INDEX "crm_loyalty_events_status_idx" ON "crm_loyalty_events"("status");

-- CreateIndex
CREATE INDEX "crm_customer_surveys_empresaId_idx" ON "crm_customer_surveys"("empresaId");

-- CreateIndex
CREATE INDEX "crm_customer_surveys_customerId_idx" ON "crm_customer_surveys"("customerId");

-- CreateIndex
CREATE INDEX "crm_customer_surveys_submittedAt_idx" ON "crm_customer_surveys"("submittedAt");

-- CreateIndex
CREATE UNIQUE INDEX "crm_opportunities_leadId_key" ON "crm_opportunities"("leadId");

-- CreateIndex
CREATE INDEX "crm_opportunities_empresaId_idx" ON "crm_opportunities"("empresaId");

-- CreateIndex
CREATE INDEX "crm_opportunities_customerId_idx" ON "crm_opportunities"("customerId");

-- CreateIndex
CREATE INDEX "crm_opportunities_campaignId_idx" ON "crm_opportunities"("campaignId");

-- CreateIndex
CREATE INDEX "crm_opportunities_channel_idx" ON "crm_opportunities"("channel");

-- CreateIndex
CREATE INDEX "crm_opportunities_stageCode_idx" ON "crm_opportunities"("stageCode");

-- CreateIndex
CREATE INDEX "crm_opportunities_status_idx" ON "crm_opportunities"("status");

-- CreateIndex
CREATE INDEX "crm_opportunities_ownerId_idx" ON "crm_opportunities"("ownerId");

-- CreateIndex
CREATE INDEX "crm_opportunities_nextActivityAt_idx" ON "crm_opportunities"("nextActivityAt");

-- CreateIndex
CREATE INDEX "crm_opportunities_expectedCloseAt_idx" ON "crm_opportunities"("expectedCloseAt");

-- CreateIndex
CREATE INDEX "crm_opportunity_stage_configs_empresaId_idx" ON "crm_opportunity_stage_configs"("empresaId");

-- CreateIndex
CREATE INDEX "crm_opportunity_stage_configs_channel_idx" ON "crm_opportunity_stage_configs"("channel");

-- CreateIndex
CREATE INDEX "crm_opportunity_stage_configs_isActive_idx" ON "crm_opportunity_stage_configs"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "crm_opportunity_stage_configs_empresaId_channel_code_key" ON "crm_opportunity_stage_configs"("empresaId", "channel", "code");

-- CreateIndex
CREATE UNIQUE INDEX "crm_opportunity_stage_configs_empresaId_channel_position_key" ON "crm_opportunity_stage_configs"("empresaId", "channel", "position");

-- CreateIndex
CREATE INDEX "crm_opportunity_loss_reasons_empresaId_idx" ON "crm_opportunity_loss_reasons"("empresaId");

-- CreateIndex
CREATE INDEX "crm_opportunity_loss_reasons_isActive_idx" ON "crm_opportunity_loss_reasons"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "crm_opportunity_loss_reasons_empresaId_code_key" ON "crm_opportunity_loss_reasons"("empresaId", "code");

-- CreateIndex
CREATE INDEX "crm_opportunity_stage_history_empresaId_idx" ON "crm_opportunity_stage_history"("empresaId");

-- CreateIndex
CREATE INDEX "crm_opportunity_stage_history_opportunityId_idx" ON "crm_opportunity_stage_history"("opportunityId");

-- CreateIndex
CREATE INDEX "crm_opportunity_stage_history_changedAt_idx" ON "crm_opportunity_stage_history"("changedAt");

-- CreateIndex
CREATE INDEX "crm_opportunity_activity_links_empresaId_idx" ON "crm_opportunity_activity_links"("empresaId");

-- CreateIndex
CREATE INDEX "crm_opportunity_activity_links_activityId_idx" ON "crm_opportunity_activity_links"("activityId");

-- CreateIndex
CREATE UNIQUE INDEX "crm_opportunity_activity_links_opportunityId_activityId_key" ON "crm_opportunity_activity_links"("opportunityId", "activityId");

-- CreateIndex
CREATE INDEX "crm_automation_alerts_empresaId_status_idx" ON "crm_automation_alerts"("empresaId", "status");

-- CreateIndex
CREATE INDEX "crm_automation_alerts_type_idx" ON "crm_automation_alerts"("type");

-- CreateIndex
CREATE INDEX "crm_automation_alerts_createdAt_idx" ON "crm_automation_alerts"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "crm_automation_alerts_empresaId_dedupeKey_key" ON "crm_automation_alerts"("empresaId", "dedupeKey");

-- CreateIndex
CREATE INDEX "crm_leads_campaignId_idx" ON "crm_leads"("campaignId");

-- AddForeignKey
ALTER TABLE "crm_campaigns" ADD CONSTRAINT "crm_campaigns_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id_empresa") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_campaign_audiences" ADD CONSTRAINT "crm_campaign_audiences_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id_empresa") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_campaign_audiences" ADD CONSTRAINT "crm_campaign_audiences_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "crm_campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_campaign_results" ADD CONSTRAINT "crm_campaign_results_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id_empresa") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_campaign_results" ADD CONSTRAINT "crm_campaign_results_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "crm_campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_leads" ADD CONSTRAINT "crm_leads_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "crm_campaigns"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_loyalty_events" ADD CONSTRAINT "crm_loyalty_events_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id_empresa") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_loyalty_events" ADD CONSTRAINT "crm_loyalty_events_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_customer_surveys" ADD CONSTRAINT "crm_customer_surveys_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id_empresa") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_customer_surveys" ADD CONSTRAINT "crm_customer_surveys_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_opportunities" ADD CONSTRAINT "crm_opportunities_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id_empresa") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_opportunities" ADD CONSTRAINT "crm_opportunities_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "crm_leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_opportunities" ADD CONSTRAINT "crm_opportunities_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_opportunities" ADD CONSTRAINT "crm_opportunities_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "crm_campaigns"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_opportunities" ADD CONSTRAINT "crm_opportunities_lostReasonId_fkey" FOREIGN KEY ("lostReasonId") REFERENCES "crm_opportunity_loss_reasons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_opportunity_stage_configs" ADD CONSTRAINT "crm_opportunity_stage_configs_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id_empresa") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_opportunity_loss_reasons" ADD CONSTRAINT "crm_opportunity_loss_reasons_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id_empresa") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_opportunity_stage_history" ADD CONSTRAINT "crm_opportunity_stage_history_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id_empresa") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_opportunity_stage_history" ADD CONSTRAINT "crm_opportunity_stage_history_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "crm_opportunities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_opportunity_activity_links" ADD CONSTRAINT "crm_opportunity_activity_links_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id_empresa") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_opportunity_activity_links" ADD CONSTRAINT "crm_opportunity_activity_links_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "crm_opportunities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_opportunity_activity_links" ADD CONSTRAINT "crm_opportunity_activity_links_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "crm_activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_automation_alerts" ADD CONSTRAINT "crm_automation_alerts_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id_empresa") ON DELETE RESTRICT ON UPDATE CASCADE;
