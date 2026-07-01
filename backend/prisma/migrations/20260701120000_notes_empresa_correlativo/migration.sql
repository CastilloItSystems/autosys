-- Correlativo de notas por empresa (ENT-/SAL-YYYY-####)
-- Denormaliza empresaId en entry_notes / exit_notes y cambia la unicidad global
-- del número por una unicidad compuesta [empresaId, número].
--
-- Migración escrita a mano: `prisma migrate dev` está bloqueado por la migración
-- previa workshop_spec_v2 (CREATE TYPE duplicado en shadow DB). Aplicar directo a
-- la base (Supabase), igual que 20260601120000_dealer_concesionario_gaps.

-- =========================================================================
-- entry_notes
-- =========================================================================
ALTER TABLE "entry_notes" ADD COLUMN IF NOT EXISTS "empresaId" TEXT;

UPDATE "entry_notes" en
  SET "empresaId" = w."empresaId"
  FROM "warehouses" w
  WHERE en."warehouseId" = w."id"
    AND en."empresaId" IS NULL;

ALTER TABLE "entry_notes" ALTER COLUMN "empresaId" SET NOT NULL;

DROP INDEX IF EXISTS "entry_notes_entryNoteNumber_key";

CREATE UNIQUE INDEX IF NOT EXISTS "entry_notes_empresaId_entryNoteNumber_key"
  ON "entry_notes" ("empresaId", "entryNoteNumber");

CREATE INDEX IF NOT EXISTS "entry_notes_empresaId_idx"
  ON "entry_notes" ("empresaId");

-- =========================================================================
-- exit_notes
-- =========================================================================
ALTER TABLE "exit_notes" ADD COLUMN IF NOT EXISTS "empresaId" TEXT;

UPDATE "exit_notes" ex
  SET "empresaId" = w."empresaId"
  FROM "warehouses" w
  WHERE ex."warehouseId" = w."id"
    AND ex."empresaId" IS NULL;

ALTER TABLE "exit_notes" ALTER COLUMN "empresaId" SET NOT NULL;

DROP INDEX IF EXISTS "exit_notes_exitNoteNumber_key";

CREATE UNIQUE INDEX IF NOT EXISTS "exit_notes_empresaId_exitNoteNumber_key"
  ON "exit_notes" ("empresaId", "exitNoteNumber");

CREATE INDEX IF NOT EXISTS "exit_notes_empresaId_idx"
  ON "exit_notes" ("empresaId");
