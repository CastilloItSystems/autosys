-- AlterTable
ALTER TABLE "service_orders" ADD COLUMN     "currency" "CurrencyCode" NOT NULL DEFAULT 'USD',
ADD COLUMN     "exchangeRate" DECIMAL(14,4);

-- AlterTable
ALTER TABLE "workshop_quotations" ADD COLUMN     "currency" "CurrencyCode" NOT NULL DEFAULT 'USD',
ADD COLUMN     "exchangeRate" DECIMAL(14,4);

-- AlterTable
ALTER TABLE "workshop_tot" ADD COLUMN     "currency" "CurrencyCode" NOT NULL DEFAULT 'USD',
ADD COLUMN     "exchangeRate" DECIMAL(14,4);
