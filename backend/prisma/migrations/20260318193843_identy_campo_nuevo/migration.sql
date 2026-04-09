-- AlterTable
ALTER TABLE "items" ADD COLUMN     "identity" TEXT;

-- CreateIndex
CREATE INDEX "items_identity_idx" ON "items"("identity");
