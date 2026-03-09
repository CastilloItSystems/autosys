-- CreateTable
CREATE TABLE "company_roles" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "empresaId" TEXT NOT NULL,
    "permissions" TEXT[],
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "company_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_empresa_roles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "assignedBy" TEXT,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_empresa_roles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "company_roles_empresaId_idx" ON "company_roles"("empresaId");

-- CreateIndex
CREATE UNIQUE INDEX "company_roles_name_empresaId_key" ON "company_roles"("name", "empresaId");

-- CreateIndex
CREATE INDEX "user_empresa_roles_userId_idx" ON "user_empresa_roles"("userId");

-- CreateIndex
CREATE INDEX "user_empresa_roles_empresaId_idx" ON "user_empresa_roles"("empresaId");

-- CreateIndex
CREATE INDEX "user_empresa_roles_roleId_idx" ON "user_empresa_roles"("roleId");

-- CreateIndex
CREATE UNIQUE INDEX "user_empresa_roles_userId_empresaId_key" ON "user_empresa_roles"("userId", "empresaId");

-- AddForeignKey
ALTER TABLE "company_roles" ADD CONSTRAINT "company_roles_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id_empresa") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_empresa_roles" ADD CONSTRAINT "user_empresa_roles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_empresa_roles" ADD CONSTRAINT "user_empresa_roles_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id_empresa") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_empresa_roles" ADD CONSTRAINT "user_empresa_roles_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "company_roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
