-- AlterTable
ALTER TABLE "items" ADD COLUMN     "contraindications" TEXT,
ADD COLUMN     "isComposite" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isFractionable" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isInternalUse" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "packagingQty" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "reference" VARCHAR(20),
ADD COLUMN     "shortName" VARCHAR(20),
ADD COLUMN     "suspendedForPurchase" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "useServer" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "useStock" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "warrantyDays" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "pricings" ADD COLUMN     "costForeign" DECIMAL(20,7) NOT NULL DEFAULT 0,
ADD COLUMN     "costPrevious" DECIMAL(20,7) NOT NULL DEFAULT 0,
ADD COLUMN     "costRef" DECIMAL(20,7) NOT NULL DEFAULT 0,
ADD COLUMN     "exchangeRate" DECIMAL(20,7) NOT NULL DEFAULT 1,
ADD COLUMN     "taxRatePurchase" DECIMAL(20,7) NOT NULL DEFAULT 0,
ADD COLUMN     "taxRateSale" DECIMAL(20,7) NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "price_levels" (
    "id" TEXT NOT NULL,
    "pricingId" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "priceForeign" DECIMAL(20,7) NOT NULL DEFAULT 0,
    "price" DECIMAL(20,7) NOT NULL DEFAULT 0,
    "finalPrice" DECIMAL(20,7) NOT NULL DEFAULT 0,
    "utility" DECIMAL(20,7) NOT NULL DEFAULT 0,
    "commission" DECIMAL(20,7) NOT NULL DEFAULT 0,

    CONSTRAINT "price_levels_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "price_levels_pricingId_idx" ON "price_levels"("pricingId");

-- CreateIndex
CREATE UNIQUE INDEX "price_levels_pricingId_level_key" ON "price_levels"("pricingId", "level");

-- AddForeignKey
ALTER TABLE "price_levels" ADD CONSTRAINT "price_levels_pricingId_fkey" FOREIGN KEY ("pricingId") REFERENCES "pricings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
