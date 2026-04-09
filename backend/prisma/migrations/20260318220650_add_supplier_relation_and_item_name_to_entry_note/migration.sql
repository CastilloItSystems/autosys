-- AlterTable
ALTER TABLE "entry_note_items" ADD COLUMN     "itemName" TEXT;

-- AlterTable
ALTER TABLE "entry_notes" ADD COLUMN     "catalogSupplierId" TEXT;

-- AddForeignKey
ALTER TABLE "entry_notes" ADD CONSTRAINT "entry_notes_catalogSupplierId_fkey" FOREIGN KEY ("catalogSupplierId") REFERENCES "suppliers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
