// backend/src/features/workshop/serviceOrderAdditionals/serviceOrderAdditionals.service.ts

import { PrismaClient, type Prisma } from '../../../generated/prisma/client.js'
import {
  NotFoundError,
  BadRequestError,
} from '../../../shared/utils/apiError.js'
import { syncAfterAdditionalChange } from '../integrations/billing-sync.service.js'
import {
  assertTransition,
  type TransitionMap,
} from '../../../shared/utils/stateMachine.js'
import type {
  ICreateServiceOrderAdditional,
  IUpdateServiceOrderAdditional,
  IServiceOrderAdditionalFilters,
  IServiceOrderAdditionalWithRelations,
} from './serviceOrderAdditionals.interface.js'

type DbType = PrismaClient | Prisma.TransactionClient

type AdditionalStatus =
  | 'PROPOSED'
  | 'QUOTED'
  | 'APPROVED'
  | 'EXECUTED'
  | 'REJECTED'

const ADDITIONAL_TRANSITIONS: TransitionMap<AdditionalStatus> = {
  PROPOSED: ['QUOTED', 'REJECTED'],
  QUOTED: ['APPROVED', 'REJECTED'],
  APPROVED: ['EXECUTED', 'REJECTED'],
  EXECUTED: [],
  REJECTED: [],
}

const BASE_INCLUDE = {
  serviceOrder: { select: { id: true, folio: true } },
} as const

export async function findAll(
  db: DbType,
  empresaId: string,
  serviceOrderId: string | undefined,
  filters: IServiceOrderAdditionalFilters
): Promise<{
  data: IServiceOrderAdditionalWithRelations[]
  page: number
  limit: number
  total: number
}> {
  const { status, search, page = 1, limit = 50 } = filters

  const where: any = { empresaId }
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
    page,
    limit,
    total,
  }
}

export async function findById(
  db: DbType,
  id: string,
  empresaId: string
): Promise<IServiceOrderAdditionalWithRelations> {
  const additional = await (
    db as PrismaClient
  ).serviceOrderAdditional.findFirst({
    where: { id, empresaId },
    include: BASE_INCLUDE,
  })

  if (!additional) throw new NotFoundError('Trabajo adicional no encontrado')
  return additional as unknown as IServiceOrderAdditionalWithRelations
}

export async function create(
  db: DbType,
  empresaId: string,
  data: ICreateServiceOrderAdditional,
  createdBy?: string
): Promise<IServiceOrderAdditionalWithRelations> {
  // Verify serviceOrder exists and belongs to the empresa
  const serviceOrder = await (db as PrismaClient).serviceOrder.findFirst({
    where: { id: data.serviceOrderId, empresaId },
  })

  if (!serviceOrder) throw new NotFoundError('Orden de servicio no encontrada')

  const additional = await (db as PrismaClient).serviceOrderAdditional.create({
    data: {
      description: data.description,
      estimatedPrice: Number(data.estimatedPrice),
      status: (data.status || 'PROPOSED') as any,
      serviceOrderId: data.serviceOrderId,
      empresaId: serviceOrder.empresaId,
      createdBy: createdBy ?? 'system',
    },
    include: BASE_INCLUDE,
  })

  return additional as unknown as IServiceOrderAdditionalWithRelations
}

export async function update(
  db: DbType,
  id: string,
  empresaId: string,
  data: IUpdateServiceOrderAdditional
): Promise<IServiceOrderAdditionalWithRelations> {
  await findById(db, id, empresaId)

  const additional = await (db as PrismaClient).serviceOrderAdditional.update({
    where: { id },
    data,
    include: BASE_INCLUDE,
  })

  return additional as unknown as IServiceOrderAdditionalWithRelations
}

export async function remove(
  db: DbType,
  id: string,
  empresaId: string
): Promise<void> {
  await findById(db, id, empresaId)

  await (db as PrismaClient).serviceOrderAdditional.delete({ where: { id } })
}

// ── Additional Items ──────────────────────────────────────────────────────────

export async function findAdditionalItems(
  db: DbType,
  additionalId: string,
  empresaId: string
) {
  await findById(db, additionalId, empresaId)
  return (db as PrismaClient).serviceOrderAdditionalItem.findMany({
    where: { additionalId },
    orderBy: { createdAt: 'asc' },
  })
}

export async function createAdditionalItem(
  db: DbType,
  additionalId: string,
  empresaId: string,
  data: {
    type?: 'LABOR' | 'PART' | 'OTHER'
    description: string
    referenceId?: string
    quantity?: number
    unitPrice?: number
    unitCost?: number
    discountPct?: number
    taxType?: 'IVA' | 'EXEMPT' | 'REDUCED'
    taxRate?: number
  }
) {
  await findById(db, additionalId, empresaId)
  const qty = data.quantity ?? 1
  const price = data.unitPrice ?? 0
  const discountPct = data.discountPct ?? 0
  const taxType = data.taxType ?? 'IVA'
  const taxRate = data.taxRate ?? 0.16

  // Calculate tax: (qty * price - discount) * taxRate
  const subtotal = qty * price
  const discountAmount = (discountPct / 100) * subtotal
  const baseForTax = subtotal - discountAmount
  const taxAmount = Math.round(baseForTax * taxRate * 100) / 100
  const total = baseForTax + taxAmount

  return (db as PrismaClient).serviceOrderAdditionalItem.create({
    data: {
      additionalId,
      type: (data.type ?? 'LABOR') as any,
      description: data.description,
      referenceId: data.referenceId,
      quantity: qty,
      unitPrice: price,
      unitCost: data.unitCost ?? 0,
      discountPct,
      taxType,
      taxRate,
      taxAmount,
      total,
    },
  })
}

export async function updateAdditionalItem(
  db: DbType,
  itemId: string,
  empresaId: string,
  data: {
    description?: string
    quantity?: number
    unitPrice?: number
    unitCost?: number
    discountPct?: number
    taxType?: 'IVA' | 'EXEMPT' | 'REDUCED'
    taxRate?: number
    clientApproved?: boolean | null
  }
) {
  const existing = await (
    db as PrismaClient
  ).serviceOrderAdditionalItem.findFirst({
    where: { id: itemId, additional: { empresaId } },
  })
  if (!existing) throw new NotFoundError('Ítem adicional no encontrado')

  const qty = data.quantity ?? Number(existing.quantity)
  const price = data.unitPrice ?? Number(existing.unitPrice)
  const discountPct = data.discountPct ?? Number(existing.discountPct)
  const taxType = data.taxType ?? existing.taxType
  const taxRate = data.taxRate ?? Number(existing.taxRate)

  // Recalculate tax
  const subtotal = qty * price
  const discountAmount = (discountPct / 100) * subtotal
  const baseForTax = subtotal - discountAmount
  const taxAmount = Math.round(baseForTax * taxRate * 100) / 100
  const total = baseForTax + taxAmount

  return (db as PrismaClient).serviceOrderAdditionalItem.update({
    where: { id: itemId },
    data: {
      ...data,
      quantity: qty,
      unitPrice: price,
      discountPct,
      taxType,
      taxRate,
      taxAmount,
      total,
    },
  })
}

export async function deleteAdditionalItem(
  db: DbType,
  itemId: string,
  empresaId: string
) {
  const existing = await (
    db as PrismaClient
  ).serviceOrderAdditionalItem.findFirst({
    where: { id: itemId, additional: { empresaId } },
  })
  if (!existing) throw new NotFoundError('Ítem adicional no encontrado')
  await (db as PrismaClient).serviceOrderAdditionalItem.delete({
    where: { id: itemId },
  })
}

// ── Status machine ────────────────────────────────────────────────────────────

export async function changeStatus(
  db: DbType,
  id: string,
  empresaId: string,
  status: 'PROPOSED' | 'QUOTED' | 'APPROVED' | 'EXECUTED' | 'REJECTED'
): Promise<IServiceOrderAdditionalWithRelations> {
  const additional = await findById(db, id, empresaId)

  assertTransition(
    ADDITIONAL_TRANSITIONS,
    additional.status as AdditionalStatus,
    status,
    { entity: 'Adicional de OT' }
  )

  const updated = await (db as PrismaClient).serviceOrderAdditional.update({
    where: { id },
    data: { status },
    include: BASE_INCLUDE,
  })

  // Trigger billing sync when additional is approved
  if (status === 'APPROVED' && db instanceof PrismaClient) {
    try {
      await syncAfterAdditionalChange(db, id)
    } catch (err: any) {
      console.error(
        `[workshop-additionals] Error syncing billing for additional ${id}:`,
        err?.message
      )
      // Don't throw - sync error shouldn't block the status change
    }
  }

  return updated as unknown as IServiceOrderAdditionalWithRelations
}
