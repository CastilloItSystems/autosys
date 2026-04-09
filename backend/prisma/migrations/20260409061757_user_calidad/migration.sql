-- AddForeignKey
ALTER TABLE "workshop_quality_checks" ADD CONSTRAINT "workshop_quality_checks_inspectorId_fkey" FOREIGN KEY ("inspectorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
