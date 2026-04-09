// backend/src/features/workshop/receptionMedia/receptionMedia.service.ts
import type { PrismaClient } from '../../../generated/prisma/client.js'
import { NotFoundError } from '../../../shared/utils/apiError.js'

type Db = PrismaClient | Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>

async function assertReceptionExists(db: Db, receptionId: string, empresaId: string) {
  const rec = await (db as PrismaClient).vehicleReception.findFirst({
    where: { id: receptionId, empresaId },
  })
  if (!rec) throw new NotFoundError('Recepción no encontrada')
  return rec
}

// ──────────────────────────────────────────
// DAÑOS
// ──────────────────────────────────────────

export async function findDamages(db: Db, receptionId: string, empresaId: string) {
  await assertReceptionExists(db, receptionId, empresaId)
  return (db as PrismaClient).receptionDamage.findMany({
    where: { receptionId },
    orderBy: { createdAt: 'asc' },
  })
}

export async function createDamage(
  db: Db,
  receptionId: string,
  empresaId: string,
  data: { zone: string; description: string; severity?: string; photoUrl?: string }
) {
  await assertReceptionExists(db, receptionId, empresaId)
  return (db as PrismaClient).receptionDamage.create({
    data: {
      receptionId,
      empresaId,
      zone: data.zone,
      description: data.description,
      severity: (data.severity as any) ?? 'MINOR',
      photoUrl: data.photoUrl ?? null,
    },
  })
}

export async function updateDamage(
  db: Db,
  id: string,
  empresaId: string,
  data: Partial<{ zone: string; description: string; severity: string; photoUrl: string | null }>
) {
  const existing = await (db as PrismaClient).receptionDamage.findFirst({ where: { id, empresaId } })
  if (!existing) throw new NotFoundError('Daño no encontrado')
  return (db as PrismaClient).receptionDamage.update({ where: { id }, data: data as any })
}

export async function deleteDamage(db: Db, id: string, empresaId: string) {
  const existing = await (db as PrismaClient).receptionDamage.findFirst({ where: { id, empresaId } })
  if (!existing) throw new NotFoundError('Daño no encontrado')
  await (db as PrismaClient).receptionDamage.delete({ where: { id } })
}

// ──────────────────────────────────────────
// FOTOS
// ──────────────────────────────────────────

export async function findPhotos(db: Db, receptionId: string, empresaId: string) {
  await assertReceptionExists(db, receptionId, empresaId)
  return (db as PrismaClient).receptionPhoto.findMany({
    where: { receptionId },
    orderBy: { createdAt: 'asc' },
  })
}

export async function createPhoto(
  db: Db,
  receptionId: string,
  empresaId: string,
  data: { url: string; type?: string; description?: string }
) {
  await assertReceptionExists(db, receptionId, empresaId)
  return (db as PrismaClient).receptionPhoto.create({
    data: {
      receptionId,
      empresaId,
      url: data.url,
      type: (data.type as any) ?? 'OTHER',
      description: data.description ?? null,
    },
  })
}

export async function deletePhoto(db: Db, id: string, empresaId: string) {
  const existing = await (db as PrismaClient).receptionPhoto.findFirst({ where: { id, empresaId } })
  if (!existing) throw new NotFoundError('Foto no encontrada')
  await (db as PrismaClient).receptionPhoto.delete({ where: { id } })
}
