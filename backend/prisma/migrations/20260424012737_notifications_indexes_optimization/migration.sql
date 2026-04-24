-- DropIndex
DROP INDEX "notifications_empresaId_userId_read_eliminado_idx";

-- CreateIndex
CREATE INDEX "notifications_empresaId_userId_read_eliminado_createdAt_idx" ON "notifications"("empresaId", "userId", "read", "eliminado", "createdAt");

-- CreateIndex
CREATE INDEX "notifications_empresaId_eventCode_dedupKey_createdAt_idx" ON "notifications"("empresaId", "eventCode", "dedupKey", "createdAt");
