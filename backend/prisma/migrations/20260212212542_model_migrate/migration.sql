/*
  Warnings:

  - You are about to drop the `vehicle_models` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "BrandType" AS ENUM ('VEHICLE', 'PART', 'BOTH');

-- CreateEnum
CREATE TYPE "ModelType" AS ENUM ('VEHICLE', 'PART', 'GENERIC');

-- DropForeignKey
ALTER TABLE "items" DROP CONSTRAINT "items_modelId_fkey";

-- DropForeignKey
ALTER TABLE "vehicle_models" DROP CONSTRAINT "vehicle_models_brandId_fkey";

-- AlterTable
ALTER TABLE "brands" ADD COLUMN     "type" "BrandType" NOT NULL DEFAULT 'PART';

-- AlterTable
ALTER TABLE "items" ADD COLUMN     "tags" TEXT[],
ADD COLUMN     "technicalSpecs" JSONB;

-- DropTable
DROP TABLE "vehicle_models";

-- CreateTable
CREATE TABLE "models" (
    "id" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "code" TEXT,
    "name" TEXT NOT NULL,
    "year" INTEGER,
    "type" "ModelType" NOT NULL DEFAULT 'PART',
    "description" TEXT,
    "specifications" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "models_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "model_compatibility" (
    "id" TEXT NOT NULL,
    "partModelId" TEXT NOT NULL,
    "vehicleModelId" TEXT NOT NULL,
    "notes" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "model_compatibility_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "models_brandId_idx" ON "models"("brandId");

-- CreateIndex
CREATE INDEX "models_code_idx" ON "models"("code");

-- CreateIndex
CREATE INDEX "models_type_idx" ON "models"("type");

-- CreateIndex
CREATE INDEX "models_isActive_idx" ON "models"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "models_brandId_code_name_year_type_key" ON "models"("brandId", "code", "name", "year", "type");

-- CreateIndex
CREATE INDEX "model_compatibility_partModelId_idx" ON "model_compatibility"("partModelId");

-- CreateIndex
CREATE INDEX "model_compatibility_vehicleModelId_idx" ON "model_compatibility"("vehicleModelId");

-- CreateIndex
CREATE UNIQUE INDEX "model_compatibility_partModelId_vehicleModelId_key" ON "model_compatibility"("partModelId", "vehicleModelId");

-- CreateIndex
CREATE INDEX "brands_name_idx" ON "brands"("name");

-- CreateIndex
CREATE INDEX "brands_type_idx" ON "brands"("type");

-- CreateIndex
CREATE INDEX "items_modelId_idx" ON "items"("modelId");

-- CreateIndex
CREATE INDEX "items_tags_idx" ON "items"("tags");

-- AddForeignKey
ALTER TABLE "items" ADD CONSTRAINT "items_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "models"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "models" ADD CONSTRAINT "models_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "brands"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "model_compatibility" ADD CONSTRAINT "model_compatibility_partModelId_fkey" FOREIGN KEY ("partModelId") REFERENCES "models"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "model_compatibility" ADD CONSTRAINT "model_compatibility_vehicleModelId_fkey" FOREIGN KEY ("vehicleModelId") REFERENCES "models"("id") ON DELETE CASCADE ON UPDATE CASCADE;
