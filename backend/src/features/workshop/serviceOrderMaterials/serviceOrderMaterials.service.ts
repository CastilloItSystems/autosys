// backend/src/features/workshop/serviceOrderMaterials/serviceOrderMaterials.service.ts

import {
  PrismaClient,
  type Prisma,
  type TaxType,
} from '../../../generated/prisma/client.js'
import {
  NotFoundError,
  ConflictError,
  BadRequestError,
} from '../../../shared/utils/apiError.js'
import stockService from '../../inventory/stock/stock.service.js'
import { syncAfterMaterialChange } from '../integrations/billing-sync.service.js'
import type {
  ICreateServiceOrderMaterial,
  IUpdateServiceOrderMaterial,
  IServiceOrderMaterialFilters,
  IServiceOrderMaterialWithRelations,
} from './serviceOrderMaterials.interface.js'

type DbType = PrismaClient | Prisma.TransactionClient

const BASE_INCLUDE = {
  serviceOrder: { select: { id: true } },
  item: { select: { id: true, code: true, name: true, sku: true } },
} as const

export async function findAll(
  db: DbType,
  serviceOrderId: string,
  filters: IServiceOrderMaterialFilters
): Promise<{
  data: IServiceOrderMaterialWithRelations[]
  page: number
  limit: number
  total: number
}> {
  const { status, search, page = 1, limit = 50 } = filters

  const where: any = { serviceOrderId }

  if (status) where.status = status
  if (search) {
    where.OR = [
      { description: { contains: search, mode: 'insensitive' } },
      {
        item: {
          OR: [
            { code: { contains: search, mode: 'insensitive' } },
            { name: { contains: search, mode: 'insensitive' } },
          ],
        },
      },
    ]
  }

  const skip = (page - 1) * limit

  const [data, total] = await Promise.all([
    (db as PrismaClient).serviceOrderMaterial.findMany({
      where,
      include: BASE_INCLUDE,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    (db as PrismaClient).serviceOrderMaterial.count({ where }),
  ])

  return {
    data: data as unknown as IServiceOrderMaterialWithRelations[],
    page,
    limit,
    total,
  }
}

export async function findById(
  db: DbType,
  id: string
): Promise<IServiceOrderMaterialWithRelations> {
  const material = await (db as PrismaClient).serviceOrderMaterial.findUnique({
    where: { id },
    include: BASE_INCLUDE,
  })

  if (!material) throw new NotFoundError('Material no encontrado')
  return material as unknown as IServiceOrderMaterialWithRelations
}

export async function create(
  db: DbType,
  data: ICreateServiceOrderMaterial,
  userId = 'system'
): Promise<IServiceOrderMaterialWithRelations> {
  // Verify serviceOrder exists
  const serviceOrder = await (db as PrismaClient).serviceOrder.findUnique({
    where: { id: data.serviceOrderId },
  })

  if (!serviceOrder) throw new NotFoundError('Orden de servicio no encontrada')

  // Verify item exists if provided and inherit tax fields
  let taxType = 'IVA'
  let taxRate = 0.16
  if (data.itemId) {
    const item = await (db as PrismaClient).item.findUnique({
      where: { id: data.itemId },
      select: { id: true, name: true, pricing: true },
    })
    if (!item) throw new NotFoundError('Artículo no encontrado')

    // Inherit tax settings from item catalog pricing
    if ((item.pricing as any)?.taxType) taxType = (item.pricing as any).taxType
    if (
      (item.pricing as any)?.taxRate !== null &&
      (item.pricing as any)?.taxRate !== undefined
    ) {
      taxRate =
        typeof (item.pricing as any).taxRate === 'string'
          ? parseFloat((item.pricing as any).taxRate)
          : Number((item.pricing as any).taxRate)
    }
  }

  const material = await (db as PrismaClient).serviceOrderMaterial.create({
    data: {
      description: data.description,
      quantityRequested: Number(data.quantityRequested),
      quantityReserved: Number(data.quantityReserved || 0),
      quantityDispatched: Number(data.quantityDispatched || 0),
      quantityConsumed: Number(data.quantityConsumed || 0),
      quantityReturned: Number(data.quantityReturned || 0),
      quantity: 0, // Will be set to quantityDispatched when DISPATCHED
      unitPrice: Number(data.unitPrice),
      unitCost: Number(data.unitCost || 0),
      discountPct: Number(data.discountPct || 0),
      taxType: taxType as TaxType,
      taxRate,
      taxAmount: 0, // Will be calculated during sync
      total: 0, // Will be calculated when quantity is set
      status: data.status || 'REQUESTED',
      serviceOrderId: data.serviceOrderId,
      itemId: data.itemId,
      empresaId: serviceOrder.empresaId,
      createdBy: userId,
    },
    include: BASE_INCLUDE,
  })

  return material as unknown as IServiceOrderMaterialWithRelations
}

export async function update(
  db: DbType,
  id: string,
  data: IUpdateServiceOrderMaterial
): Promise<IServiceOrderMaterialWithRelations> {
  const existing = await findById(db, id)

  if (data.itemId) {
    const item = await (db as PrismaClient).item.findUnique({
      where: { id: data.itemId },
      select: { id: true, name: true, pricing: true },
    })
    if (!item) throw new NotFoundError('Artículo no encontrado')
  }

  const updateData: any = {}

  if (data.description !== undefined) updateData.description = data.description
  if (data.quantityRequested !== undefined)
    updateData.quantityRequested = Number(data.quantityRequested)
  if (data.quantityReserved !== undefined)
    updateData.quantityReserved = Number(data.quantityReserved)
  if (data.quantityDispatched !== undefined)
    updateData.quantityDispatched = Number(data.quantityDispatched)
  if (data.quantityConsumed !== undefined)
    updateData.quantityConsumed = Number(data.quantityConsumed)
  if (data.quantityReturned !== undefined)
    updateData.quantityReturned = Number(data.quantityReturned)
  if (data.unitPrice !== undefined)
    updateData.unitPrice = Number(data.unitPrice)
  if (data.unitCost !== undefined) updateData.unitCost = Number(data.unitCost)
  if (data.discountPct !== undefined)
    updateData.discountPct = Number(data.discountPct)
  if (data.status !== undefined) updateData.status = data.status
  if (data.serviceOrderId !== undefined)
    updateData.serviceOrderId = data.serviceOrderId
  if (data.itemId !== undefined) updateData.itemId = data.itemId

  // If itemId changed, re-inherit tax settings
  if (data.itemId && data.itemId !== existing.itemId) {
    const newItem = await (db as PrismaClient).item.findUnique({
      where: { id: data.itemId },
      select: { pricing: true },
    })
    if (newItem) {
      updateData.taxType = (newItem.pricing as any)?.taxType as TaxType
      updateData.taxRate = (newItem.pricing as any)?.taxRate || 0.16
    }
  }

  // Recalculate quantity and total based on current dispatched quantity
  const quantityDispatched =
    updateData.quantityDispatched ?? Number(existing.quantityDispatched || 0)
  const unitPrice = updateData.unitPrice ?? Number(existing.unitPrice || 0)
  const discountPct =
    updateData.discountPct ?? Number(existing.discountPct || 0)
  const taxRate = updateData.taxRate ?? Number(existing.taxRate || 0.16)

  if (quantityDispatched > 0) {
    updateData.quantity = quantityDispatched
    const subtotal = quantityDispatched * unitPrice
    const discountAmount = (discountPct / 100) * subtotal
    const baseForTax = subtotal - discountAmount
    const taxAmount = Math.round(baseForTax * taxRate * 100) / 100
    updateData.taxAmount = taxAmount
    updateData.total = Math.round((baseForTax + taxAmount) * 100) / 100
  }

  const material = await (db as PrismaClient).serviceOrderMaterial.update({
    where: { id },
    data: updateData,
    include: BASE_INCLUDE,
  })

  return material as unknown as IServiceOrderMaterialWithRelations
}

export async function remove(db: DbType, id: string): Promise<void> {
  await findById(db, id)

  await (db as PrismaClient).serviceOrderMaterial.delete({ where: { id } })
}

export async function findMovements(db: DbType, materialId: string) {
  const material = await findById(db, materialId)
  return (db as PrismaClient).serviceOrderMaterialMovement.findMany({
    where: { materialId: material.id },
    orderBy: { createdAt: 'asc' },
  })
}

export async function recordMovement(
  db: DbType,
  materialId: string,
  userId: string,
  data: {
    type:
      | 'RESERVATION'
      | 'DISPATCH'
      | 'CONSUMPTION'
      | 'RETURN'
      | 'ADJUSTMENT'
      | 'CANCELLATION'
    quantity: number
    previousQuantity?: number
    warehouseId?: string
    warehouseName?: string
    notes?: string
    referenceId?: string
    empresaId: string
  }
) {
  await findById(db, materialId)
  return (db as PrismaClient).serviceOrderMaterialMovement.create({
    data: {
      materialId,
      type: data.type,
      quantity: data.quantity,
      previousQuantity: data.previousQuantity ?? null,
      warehouseId: data.warehouseId ?? null,
      warehouseName: data.warehouseName ?? null,
      userId,
      notes: data.notes ?? null,
      referenceId: data.referenceId ?? null,
      empresaId: data.empresaId,
    },
  })
}

export async function changeStatus(
  db: DbType,
  id: string,
  status:
    | 'REQUESTED'
    | 'RESERVED'
    | 'DISPATCHED'
    | 'CONSUMED'
    | 'RETURNED'
    | 'CANCELLED',
  context?: {
    warehouseId?: string
    quantityReturned?: number
    empresaId?: string
    userId?: string
  }
): Promise<IServiceOrderMaterialWithRelations> {
  const material = await findById(db, id)

  const validTransitions: Record<string, string[]> = {
    REQUESTED: ['RESERVED', 'CANCELLED'],
    RESERVED: ['DISPATCHED', 'RETURNED', 'CANCELLED'],
    DISPATCHED: ['CONSUMED', 'RETURNED', 'CANCELLED'],
    CONSUMED: ['RETURNED'],
    RETURNED: [],
    CANCELLED: [],
  }

  if (!validTransitions[material.status as string]?.includes(status)) {
    throw new BadRequestError(
      `No se puede cambiar de estado ${material.status} a ${status}`
    )
  }

  const { warehouseId, empresaId, userId = 'system' } = context ?? {}
  const itemId = material.itemId

  // Ajustes de inventario solo si el material está vinculado a un item y se proveyó almacén
  if (itemId && warehouseId && empresaId) {
    try {
      if (status === 'RESERVED') {
        // Reservar en inventario: quantityReserved += qty, quantityAvailable -= qty
        await stockService.reserve(
          { itemId, warehouseId, quantity: Number(material.quantityRequested) },
          empresaId,
          userId,
          db
        )
      } else if (status === 'DISPATCHED') {
        const qty =
          Number(material.quantityReserved) ||
          Number(material.quantityRequested)
        // 1. Liberar la reserva
        await stockService.releaseReservation(
          { itemId, warehouseId, quantity: qty },
          empresaId,
          userId,
          db
        )
        // 2. Descontar del stock físico
        await stockService.adjust(
          {
            itemId,
            warehouseId,
            quantityChange: -qty,
            reason: `Despacho OT material ${id}`,
          },
          empresaId,
          userId,
          db
        )
      } else if (status === 'RETURNED') {
        const returnQty =
          context?.quantityReturned ??
          Number(material.quantityDispatched) ??
          Number(material.quantityRequested)
        // Reponer al stock físico
        await stockService.adjust(
          {
            itemId,
            warehouseId,
            quantityChange: returnQty,
            reason: `Devolución OT material ${id}`,
          },
          empresaId,
          userId,
          db
        )
      } else if (status === 'CANCELLED' && material.status === 'RESERVED') {
        // Liberar la reserva si se cancela estando reservado
        await stockService.releaseReservation(
          { itemId, warehouseId, quantity: Number(material.quantityReserved) },
          empresaId,
          userId,
          db
        )
      }
    } catch (err: any) {
      // Si el error viene de insuficiencia de stock, lo propagamos al usuario
      if (err?.statusCode === 400 || err?.name === 'BadRequestError') throw err
      // Otros errores de inventario: logear pero no bloquear el cambio de estado
      console.error(
        `[workshop-materials] Error ajustando stock para material ${id}:`,
        err?.message
      )
    }
  }

  // Actualizar cantidades según el nuevo estado
  const quantityUpdate: Record<string, number> = {}
  if (status === 'DISPATCHED') {
    quantityUpdate.quantityDispatched =
      Number(material.quantityReserved) || Number(material.quantityRequested)
  } else if (status === 'CONSUMED') {
    quantityUpdate.quantityConsumed = Number(material.quantityDispatched)
  } else if (status === 'RETURNED') {
    quantityUpdate.quantityReturned =
      context?.quantityReturned ??
      Number(material.quantityDispatched) ??
      Number(material.quantityRequested)
  }

  // Update quantity and total when dispatched
  if (status === 'DISPATCHED') {
    const qty =
      Number(material.quantityReserved) || Number(material.quantityRequested)
    const unitPrice = Number(material.unitPrice || 0)
    const discountPct = Number(material.discountPct || 0)
    const taxRate = Number(material.taxRate || 0.16)

    const subtotal = qty * unitPrice
    const discountAmount = (discountPct / 100) * subtotal
    const baseForTax = subtotal - discountAmount
    const taxAmount = Math.round(baseForTax * taxRate * 100) / 100
    const total = Math.round((baseForTax + taxAmount) * 100) / 100

    quantityUpdate.quantity = qty
    quantityUpdate.taxAmount = taxAmount
    quantityUpdate.total = total
  } else if (status === 'RETURNED') {
    const returnQty =
      context?.quantityReturned ??
      Number(material.quantityDispatched) ??
      Number(material.quantityRequested)
    // Keep quantity as is (it represents what was dispatched)
    quantityUpdate.quantity = Number(material.quantityDispatched || 0)
  }

  const updated = await (db as PrismaClient).serviceOrderMaterial.update({
    where: { id },
    data: { status, ...quantityUpdate },
    include: BASE_INCLUDE,
  })

  // Trigger billing sync after critical status changes
  if (
    (status === 'DISPATCHED' || status === 'RETURNED') &&
    db instanceof PrismaClient
  ) {
    try {
      await syncAfterMaterialChange(db, id)
    } catch (err: any) {
      console.error(
        `[workshop-materials] Error syncing billing for material ${id}:`,
        err?.message
      )
      // Don't throw - sync error shouldn't block the material status change
    }
  }

  return updated as unknown as IServiceOrderMaterialWithRelations
}
