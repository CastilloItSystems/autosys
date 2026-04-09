/*
  Warnings:

  - A unique constraint covering the columns `[empresaId,code]` on the table `items` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `code` to the `items` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "items" ADD COLUMN     "code" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "items_code_idx" ON "items"("code");

-- CreateIndex
CREATE UNIQUE INDEX "items_empresa_code_unique" ON "items"("empresaId", "code");
