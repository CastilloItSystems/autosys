-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "TransferStatus" ADD VALUE 'IN_TRANSIT';
ALTER TYPE "TransferStatus" ADD VALUE 'RECEIVED';

-- AlterTable
ALTER TABLE "transfers" ADD COLUMN     "receivedAt" TIMESTAMP(3),
ADD COLUMN     "sentAt" TIMESTAMP(3);
