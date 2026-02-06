-- CreateTable
CREATE TABLE "_EmpresaToUser" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_EmpresaToUser_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_EmpresaToUser_B_index" ON "_EmpresaToUser"("B");

-- AddForeignKey
ALTER TABLE "_EmpresaToUser" ADD CONSTRAINT "_EmpresaToUser_A_fkey" FOREIGN KEY ("A") REFERENCES "Empresa"("id_empresa") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_EmpresaToUser" ADD CONSTRAINT "_EmpresaToUser_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
