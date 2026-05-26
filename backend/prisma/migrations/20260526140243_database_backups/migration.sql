-- CreateEnum
CREATE TYPE "DatabaseBackupType" AS ENUM ('MANUAL', 'DAILY', 'WEEKLY');

-- CreateEnum
CREATE TYPE "DatabaseBackupStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED');

-- CreateTable
CREATE TABLE "database_backups" (
    "id" TEXT NOT NULL,
    "type" "DatabaseBackupType" NOT NULL,
    "status" "DatabaseBackupStatus" NOT NULL DEFAULT 'PENDING',
    "fileKey" TEXT NOT NULL,
    "fileUrl" TEXT,
    "fileName" TEXT NOT NULL,
    "sizeBytes" BIGINT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "error" TEXT,
    "triggeredBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "database_backups_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "database_backups_type_createdAt_idx" ON "database_backups"("type", "createdAt");

-- CreateIndex
CREATE INDEX "database_backups_status_idx" ON "database_backups"("status");
