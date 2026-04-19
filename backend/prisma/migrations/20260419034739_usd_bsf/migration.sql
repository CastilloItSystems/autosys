-- CreateEnum
CREATE TYPE "ExchangeRateSource" AS ENUM ('BCV', 'PARALLEL', 'MANUAL');

-- CreateEnum
CREATE TYPE "CurrencyCode" AS ENUM ('USD', 'VES', 'EUR');

-- AlterTable
ALTER TABLE "Empresa" ADD COLUMN     "defaultCurrency" "CurrencyCode" DEFAULT 'USD';

-- CreateTable
CREATE TABLE "exchange_rates" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "fromCurrency" "CurrencyCode" NOT NULL,
    "toCurrency" "CurrencyCode" NOT NULL,
    "rate" DECIMAL(20,7) NOT NULL,
    "rateDate" DATE NOT NULL,
    "source" "ExchangeRateSource" NOT NULL DEFAULT 'BCV',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "fetchedAt" TIMESTAMP(3),
    "createdBy" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exchange_rates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "exchange_rates_empresaId_rateDate_idx" ON "exchange_rates"("empresaId", "rateDate");

-- CreateIndex
CREATE INDEX "exchange_rates_empresaId_fromCurrency_toCurrency_rateDate_idx" ON "exchange_rates"("empresaId", "fromCurrency", "toCurrency", "rateDate");

-- CreateIndex
CREATE UNIQUE INDEX "exchange_rates_empresaId_fromCurrency_toCurrency_rateDate_s_key" ON "exchange_rates"("empresaId", "fromCurrency", "toCurrency", "rateDate", "source");

-- AddForeignKey
ALTER TABLE "exchange_rates" ADD CONSTRAINT "exchange_rates_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id_empresa") ON DELETE RESTRICT ON UPDATE CASCADE;
