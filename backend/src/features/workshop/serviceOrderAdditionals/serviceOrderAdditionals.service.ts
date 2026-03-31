// backend/src/features/workshop/serviceOrderAdditionals/serviceOrderAdditionals.service.ts

import type { PrismaClient, Prisma } from '../../../generated/prisma/client.js'
import {
  NotFoundError,
  BadRequestError,
} from '../../../shared/utils/apiError.js'
import type {
  ICreateServiceOrderAdditional,
  IUpdateServiceOrderAdditional,
  IServiceOrderAdditionalFilters,
  IServiceOrderAdditionalWithRelations,
} from './serviceOrderAdditionals.interface.js'

type DbType = PrismaClient | Prisma.TransactionClient

const BASE_INCLUDE = {
  serviceOrder: { select: { id: true, folio: true } },
} as const

export async function findAll(
  db: DbType,
  serviceOrderId: string | undefined,
  filters: IServiceOrderAdditionalFilters
): Promise<{ data: IServiceOrderAdditionalWithRelations[]; pagination: any }> {
  const { status, search, page = 1, limit = 50 } = filters

  const where: any = {}
  if (serviceOrderId) where.serviceOrderId = serviceOrderId

  if (status) where.status = status
  if (search) {
    where.description = { contains: search, mode: 'insensitive' }
  }

  const skip = (page - 1) * limit

  const [data, total] = await Promise.all([
    (db as PrismaClient).serviceOrderAdditional.findMany({
      where,
      include: BASE_INCLUDE,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    (db as PrismaClient).serviceOrderAdditional.count({ where }),
  ])

  return {
    data: data as unknown as IServiceOrderAdditionalWithRelations[],
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  }
}

export async function findById(
  db: DbType,
  id: string
): Promise<IServiceOrderAdditionalWithRelations> {
  const additional = await (
    db as PrismaClient
  ).serviceOrderAdditional.findUnique({
    where: { id },
    include: BASE_INCLUDE,
  })

  if (!additional) throw new NotFoundError('Trabajo adicional no encontrado')
  return additional as unknown as IServiceOrderAdditionalWithRelations
}

export async function create(
  db: DbType,
  data: ICreateServiceOrderAdditional
): Promise<IServiceOrderAdditionalWithRelations> {
  // Verify serviceOrder exists
  const serviceOrder = await (db as PrismaClient).serviceOrder.findUnique({
    where: { id: data.serviceOrderId },
  })

  if (!serviceOrder) throw new NotFoundError('Orden de servicio no encontrada')

  const additional = await (db as PrismaClient).serviceOrderAdditional.create({
    data: {
      description: data.description,
      estimatedPrice: Number(data.estimatedPrice),
      status: (data.status || 'PROPOSED') as any,
      serviceOrderId: data.serviceOrderId,
      empresaId: serviceOrder.empresaId,
      createdBy: 'system',
    },
    include: BASE_INCLUDE,
  })

  return additional as unknown as IServiceOrderAdditionalWithRelations
}

export async function update(
  db: DbType,
  id: string,
  data: IUpdateServiceOrderAdditional
): Promise<IServiceOrderAdditionalWithRelations> {
  await findById(db, id)

  const additional = await (db as PrismaClient).serviceOrderAdditional.update({
    where: { id },
    data,
    include: BASE_INCLUDE,
  })

  return additional as unknown as IServiceOrderAdditionalWithRelations
}

export async function remove(db: DbType, id: string): Promise<void> {
  await findById(db, id)

  await (db as PrismaClient).serviceOrderAdditional.delete({ where: { id } })
}

// ── Additional Items ──────────────────────────────────────────────────────────

export async function findAdditionalItems(db: DbType, additionalId: string) {
  await findById(db, additionalId)
  return (db as PrismaClient).serviceOrderAdditionalItem.findMany({
    where: { additionalId },
    orderBy: { createdAt: 'asc' },
  })
}

export async function createAdditionalItem(
  db: DbType,
  additionalId: string,
  data: {
    type?: 'LABOR' | 'PART' | 'OTHER'
    description: string
    referenceId?: string
    quantity?: number
    unitPrice?: number
    unitCost?: number
  }
) {
  await findById(db, additionalId)
  const qty = data.quantity ?? 1
  const price = data.unitPrice ?? 0
  const total = qty * price
  return (db as PrismaClient).serviceOrderAdditionalItem.create({
    data: {
      additionalId,
      type: (data.type ?? 'LABOR') as any,
      description: data.description,
      referenceId: data.referenceId,
      quantity: qty,
      unitPrice: price,
      unitCost: data.unitCost ?? 0,
      total,
    },
  })
}

export async function updateAdditionalItem(
  db: DbType,
  itemId: string,
  data: {
    description?: string
    quantity?: number
    unitPrice?: number
    unitCost?: number
    clientApproved?: boolean | null
  }
) {
  const existing = await (db as PrismaClient).serviceOrderAdditionalItem.findUnique({ where: { id: itemId } })
  if (!existing) throw new NotFoundError('Ítem adicional no encontrado')
  const qty = data.quantity ?? Number(existing.quantity)
  const price = data.unitPrice ?? Number(existing.unitPrice)
  return (db as PrismaClient).serviceOrderAdditionalItem.update({
    where: { id: itemId },
    data: { ...data, quantity: qty, unitPrice: price, total: qty * price },
  })
}

export async function deleteAdditionalItem(db: DbType, itemId: string) {
  const existing = await (db as PrismaClient).serviceOrderAdditionalItem.findUnique({ where: { id: itemId } })
  if (!existing) throw new NotFoundError('Ítem adicional no encontrado')
  await (db as PrismaClient).serviceOrderAdditionalItem.delete({ where: { id: itemId } })
}

// ── Status machine ────────────────────────────────────────────────────────────

export async function changeStatus(
  db: DbType,
  id: string,
  status: 'PROPOSED' | 'QUOTED' | 'APPROVED' | 'EXECUTED' | 'REJECTED'
): Promise<IServiceOrderAdditionalWithRelations> {
  const additional = await findById(db, id)

  // Validate status transitions
  const validTransitions: Record<string, string[]> = {
    PROPOSED: ['QUOTED', 'REJECTED'],
    QUOTED: ['APPROVED', 'REJECTED'],
    APPROVED: ['EXECUTED', 'REJECTED'],
    EXECUTED: [],
    REJECTED: [],
  }

  if (!validTransitions[additional.status as string]?.includes(status)) {
    throw new BadRequestError(
      `No se puede cambiar de estado ${additional.status} a ${status}`
    )
  }

  const updated = await (db as PrismaClient).serviceOrderAdditional.update({
    where: { id },
    data: { status },
    include: BASE_INCLUDE,
  })

  return updated as unknown as IServiceOrderAdditionalWithRelations
}
