-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "PurchaseOrderStatus" ADD VALUE 'PENDING_APPROVAL';
ALTER TYPE "PurchaseOrderStatus" ADD VALUE 'APPROVED';
ALTER TYPE "PurchaseOrderStatus" ADD VALUE 'REJECTED';

-- AlterTable
ALTER TABLE "AuditLog" ADD COLUMN     "empresaId" TEXT;

-- AlterTable
ALTER TABLE "purchase_orders" ADD COLUMN     "rejectedAt" TIMESTAMP(3),
ADD COLUMN     "rejectedBy" TEXT,
ADD COLUMN     "rejectionReason" TEXT,
ADD COLUMN     "sentAt" TIMESTAMP(3),
ADD COLUMN     "sentBy" TEXT,
ADD COLUMN     "submittedAt" TIMESTAMP(3),
ADD COLUMN     "submittedBy" TEXT;

-- CreateIndex
CREATE INDEX "AuditLog_empresaId_createdAt_idx" ON "AuditLog"("empresaId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_entity_action_createdAt_idx" ON "AuditLog"("entity", "action", "createdAt");

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id_empresa") ON DELETE SET NULL ON UPDATE CASCADE;
