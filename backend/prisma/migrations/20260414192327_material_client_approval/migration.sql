-- AlterTable
ALTER TABLE "service_order_materials" ADD COLUMN     "clientApprovalAt" TIMESTAMP(3),
ADD COLUMN     "clientApprovalNotes" TEXT,
ADD COLUMN     "clientApproved" BOOLEAN,
ADD COLUMN     "clientApprovedBy" TEXT;
