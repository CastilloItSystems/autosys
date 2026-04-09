-- AlterTable
ALTER TABLE "customers" ADD COLUMN     "billingAddress" TEXT,
ADD COLUMN     "contactPerson" TEXT,
ADD COLUMN     "creditDays" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "creditLimit" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "defaultDiscount" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "isSpecialTaxpayer" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "mobile" TEXT,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "priceList" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "sellerId" TEXT,
ADD COLUMN     "shippingAddress" TEXT,
ADD COLUMN     "website" TEXT;
