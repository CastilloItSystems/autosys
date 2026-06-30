// backend/src/features/workshop/materialSignatures/materialSignatures.service.ts
import type { PrismaClient, Prisma } from '../../../generated/prisma/client.js'
import {
  NotFoundError,
  BadRequestError,
  ConflictError,
} from '../../../shared/utils/apiError.js'
import type {
  ICreateMaterialSignature,
  SignerRole,
} from './materialSignatures.interface.js'

type Db = PrismaClient | Prisma.TransactionClient

// Roles obligatorios para considerar firmas completas (§15.5)
// Almacenista + (Jefe Taller o Asesor) + Técnico
const REQUIRED_ROLE_GROUPS: SignerRole[][] = [
  ['STOREKEEPER'],
  ['SHOP_FOREMAN', 'ADVISOR'], // basta con uno de estos dos
  ['TECHNICIAN'],
]

export async function listByMaterial(
  db: Db,
  materialId: string,
  empresaId: string
) {
  return (db as PrismaClient).serviceOrderMaterialSignature.findMany({
    where: { materialId, empresaId },
    orderBy: { signedAt: 'asc' },
  })
}

export async function create(
  db: Db,
  empresaId: string,
  data: ICreateMaterialSignature
) {
  const material = await (db as PrismaClient).serviceOrderMaterial.findFirst({
    where: { id: data.materialId, empresaId },
    select: { id: true, status: true },
  })
  if (!material) throw new NotFoundError('Material no encontrado')

  // Validar no duplicado por rol (unique constraint también lo previene)
  const existing = await (
    db as PrismaClient
  ).serviceOrderMaterialSignature.findFirst({
    where: {
      materialId: data.materialId,
      signerRole: data.signerRole,
      empresaId,
    },
  })
  if (existing) {
    throw new ConflictError(
      `Ya existe una firma del rol ${data.signerRole} para este material`
    )
  }

  return (db as PrismaClient).serviceOrderMaterialSignature.create({
    data: {
      materialId: data.materialId,
      signerRole: data.signerRole,
      signerId: data.signerId,
      signerName: data.signerName ?? null,
      signatureUrl: data.signatureUrl ?? null,
      notes: data.notes ?? null,
      empresaId,
    },
  })
}

export async function remove(db: Db, id: string, empresaId: string) {
  const sig = await (db as PrismaClient).serviceOrderMaterialSignature.findFirst({
    where: { id, empresaId },
    select: { id: true },
  })
  if (!sig) throw new NotFoundError('Firma no encontrada')
  await (db as PrismaClient).serviceOrderMaterialSignature.delete({
    where: { id },
  })
}

export async function hasCompleteSignatures(
  db: Db,
  materialId: string,
  empresaId: string
): Promise<{ complete: boolean; missing: SignerRole[][] }> {
  const sigs = await (db as PrismaClient).serviceOrderMaterialSignature.findMany(
    {
      where: { materialId, empresaId },
      select: { signerRole: true },
    }
  )
  const present = new Set<SignerRole>(sigs.map((s) => s.signerRole as SignerRole))
  const missing: SignerRole[][] = []
  for (const group of REQUIRED_ROLE_GROUPS) {
    if (!group.some((r) => present.has(r))) missing.push(group)
  }
  return { complete: missing.length === 0, missing }
}

export async function assertSignaturesBeforeConsume(
  db: Db,
  materialId: string,
  empresaId: string
) {
  const { complete, missing } = await hasCompleteSignatures(
    db,
    materialId,
    empresaId
  )
  if (!complete) {
    throw new BadRequestError(
      `Faltan firmas obligatorias para consumir el material: ${missing
        .map((g) => g.join('/'))
        .join(', ')}`
    )
  }
}
