/*
  Warnings:

  - The `estado` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('pendiente', 'activo', 'suspendido');

-- AlterTable
ALTER TABLE "User" DROP COLUMN "estado",
ADD COLUMN     "estado" "UserStatus" NOT NULL DEFAULT 'activo';
