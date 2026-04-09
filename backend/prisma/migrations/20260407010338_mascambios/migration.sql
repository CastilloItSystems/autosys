-- CreateEnum
CREATE TYPE "AppointmentOrigin" AS ENUM ('PHONE', 'SOCIAL_MEDIA', 'PRESENTIAL', 'WEB', 'CRM');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AppointmentStatus" ADD VALUE 'RESCHEDULED';
ALTER TYPE "AppointmentStatus" ADD VALUE 'WAITING';

-- AlterTable
ALTER TABLE "workshop_appointments" ADD COLUMN     "estimatedCost" DECIMAL(12,2),
ADD COLUMN     "origin" "AppointmentOrigin" NOT NULL DEFAULT 'PRESENTIAL',
ADD COLUMN     "preDiagnosis" TEXT,
ADD COLUMN     "preIdentifiedParts" JSONB;

-- AlterTable
ALTER TABLE "workshop_diagnosis_findings" ADD COLUMN     "isHiddenFinding" BOOLEAN NOT NULL DEFAULT false;
