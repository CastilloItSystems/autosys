/*
  Warnings:

  - Added the required column `customerId` to the `dealer_after_sales` table without a default value. This is not possible if the table is not empty.
  - Added the required column `customerId` to the `dealer_deliveries` table without a default value. This is not possible if the table is not empty.
  - Added the required column `customerId` to the `dealer_financing` table without a default value. This is not possible if the table is not empty.
  - Added the required column `customerId` to the `dealer_quotes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `customerId` to the `dealer_reservations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `customerId` to the `dealer_test_drives` table without a default value. This is not possible if the table is not empty.
  - Added the required column `customerId` to the `dealer_trade_ins` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "dealer_after_sales" ADD COLUMN     "customerId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "dealer_deliveries" ADD COLUMN     "customerId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "dealer_financing" ADD COLUMN     "customerId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "dealer_quotes" ADD COLUMN     "customerId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "dealer_reservations" ADD COLUMN     "customerId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "dealer_test_drives" ADD COLUMN     "customerId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "dealer_trade_ins" ADD COLUMN     "customerId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "dealer_after_sales_customerId_idx" ON "dealer_after_sales"("customerId");

-- CreateIndex
CREATE INDEX "dealer_deliveries_customerId_idx" ON "dealer_deliveries"("customerId");

-- CreateIndex
CREATE INDEX "dealer_financing_customerId_idx" ON "dealer_financing"("customerId");

-- CreateIndex
CREATE INDEX "dealer_quotes_customerId_idx" ON "dealer_quotes"("customerId");

-- CreateIndex
CREATE INDEX "dealer_reservations_customerId_idx" ON "dealer_reservations"("customerId");

-- CreateIndex
CREATE INDEX "dealer_test_drives_customerId_idx" ON "dealer_test_drives"("customerId");

-- CreateIndex
CREATE INDEX "dealer_trade_ins_customerId_idx" ON "dealer_trade_ins"("customerId");

-- AddForeignKey
ALTER TABLE "dealer_after_sales" ADD CONSTRAINT "dealer_after_sales_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dealer_deliveries" ADD CONSTRAINT "dealer_deliveries_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dealer_financing" ADD CONSTRAINT "dealer_financing_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dealer_quotes" ADD CONSTRAINT "dealer_quotes_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dealer_reservations" ADD CONSTRAINT "dealer_reservations_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dealer_test_drives" ADD CONSTRAINT "dealer_test_drives_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dealer_trade_ins" ADD CONSTRAINT "dealer_trade_ins_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
