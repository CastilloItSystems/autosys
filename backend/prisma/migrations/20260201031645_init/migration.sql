-- CreateEnum
CREATE TYPE "Role" AS ENUM ('superAdmin', 'admin', 'operador', 'user', 'lectura');

-- CreateEnum
CREATE TYPE "Access" AS ENUM ('limitado', 'completo', 'ninguno');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "img" TEXT,
    "nombre" TEXT NOT NULL,
    "correo" TEXT NOT NULL,
    "telefono" TEXT,
    "password" TEXT NOT NULL,
    "rol" "Role" NOT NULL DEFAULT 'lectura',
    "departamento" TEXT[],
    "acceso" "Access" NOT NULL DEFAULT 'ninguno',
    "estado" BOOLEAN NOT NULL DEFAULT true,
    "eliminado" BOOLEAN NOT NULL DEFAULT false,
    "online" BOOLEAN NOT NULL DEFAULT false,
    "fcmTokens" TEXT[],
    "google" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_correo_key" ON "User"("correo");
