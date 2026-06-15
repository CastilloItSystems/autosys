// backend/src/features/workshop/deliveryReturnedParts/deliveryReturnedParts.service.ts
import type { PrismaClient, Prisma } from '../../../generated/prisma/client.js'
import {
  NotFoundError,
  BadRequestError,
} from '../../../shared/utils/apiError.js'
import type {
  ICreateReturnedPart,
  IUpdateReturnedPart,
} from './deliveryReturnedParts.interface.js'

type Db = PrismaClient | Prisma.TransactionClient

export async function listByDelivery(
  db: Db,
  deliveryId: string,
  empresaId: string
) {
  return (db as PrismaClient).deliveryReturnedPart.findMany({
    where: { deliveryId, empresaId },
    orderBy: { createdAt: 'asc' },
  })
}

export async function create(
  db: Db,
  empresaId: string,
  data: ICreateReturnedPart
) {
  const delivery = await (db as PrismaClient).vehicleDelivery.findFirst({
    where: { id: data.deliveryId, empresaId },
    select: { id: true },
  })
  if (!delivery) throw new NotFoundError('Entrega no encontrada')
  return (db as PrismaClient).deliveryReturnedPart.create({
    data: {
      deliveryId: data.deliveryId,
      materialId: data.materialId ?? null,
      description: data.description,
      quantity: data.quantity ?? 1,
      condition: data.condition ?? 'WHOLE',
      clientAcknowledged: data.clientAcknowledged ?? false,
      clientAcknowledgedAt: data.clientAcknowledged ? new Date() : null,
      clientSignature: data.clientSignature ?? null,
      photoUrl: data.photoUrl ?? null,
      notes: data.notes ?? null,
      empresaId,
    },
  })
}

export async function update(
  db: Db,
  id: string,
  empresaId: string,
  data: IUpdateReturnedPart
) {
  const existing = await (
    db as PrismaClient
  ).deliveryReturnedPart.findFirst({ where: { id, empresaId } })
  if (!existing) throw new NotFoundError('Repuesto devuelto no encontrado')
  const updateData: any = { ...data }
  if (
    data.clientAcknowledged === true &&
    existing.clientAcknowledged !== true
  ) {
    updateData.clientAcknowledgedAt = new Date()
  }
  return (db as PrismaClient).deliveryReturnedPart.update({
    where: { id },
    data: updateData,
  })
}

export async function remove(db: Db, id: string, empresaId: string) {
  const existing = await (
    db as PrismaClient
  ).deliveryReturnedPart.findFirst({ where: { id, empresaId } })
  if (!existing) throw new NotFoundError('Repuesto devuelto no encontrado')
  await (db as PrismaClient).deliveryReturnedPart.delete({ where: { id } })
}

// §23.3 — bloquear marca substitutedPartsReturned=true sin al menos un registro
// con clientAcknowledged.
export async function assertReturnedPartsBeforeClose(
  db: Db,
  deliveryId: string
) {
  const acknowledged = await (
    db as PrismaClient
  ).deliveryReturnedPart.count({
    where: { deliveryId, clientAcknowledged: true },
  })
  if (acknowledged === 0) {
    throw new BadRequestError(
      'No se puede cerrar la entrega sin registrar la devolución de los repuestos sustituidos al cliente (§23.3)'
    )
  }
}
