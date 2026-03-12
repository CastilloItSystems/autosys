// backend/src/features/inventory/movements/movements.service.ts

import { PrismaClient, Prisma } from '../../../generated/prisma/client.js'
import {
  ICreateMovementInput,
  IUpdateMovementInput,
  IMovementFilters,
  IMovementWithRelations,
  MovementType,
} from './movements.interface.js'
import {
  NotFoundError,
  BadRequestError,
} from '../../../shared/utils/apiError.js'
import { PaginationHelper } from '../../../shared/utils/pagination.js'
import { logger } from '../../../shared/utils/logger.js'
import { INVENTORY_MESSAGES } from '../shared/constants/messages.js'
import { MovementNumberGenerator } from '../shared/utils/movementNumberGenerator.js'

type PrismaClientType = PrismaClient | Prisma.TransactionClient

const MSG = INVENTORY_MESSAGES.movement

// ---------------------------------------------------------------------------
// Movement type classification
// ---------------------------------------------------------------------------

/** Types that increase quantityReal in the destination warehouse */
const ENTRY_TYPES = new Set<MovementType>([
  MovementType.PURCHASE,
  MovementType.ADJUSTMENT_IN,
  MovementType.WORKSHOP_RETURN,
  MovementType.RESERVATION_RELEASE,
  MovementType.LOAN_RETURN,
])

/** Types that decrease quantityReal in the source warehouse */
const EXIT_TYPES = new Set<MovementType>([
  MovementType.SALE,
  MovementType.ADJUSTMENT_OUT,
  MovementType.SUPPLIER_RETURN,
  MovementType.LOAN_OUT,
])

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

async function applyStockImpact(
  tx: Prisma.TransactionClient,
  type: MovementType,
  itemId: string,
  quantity: number,
  warehouseFromId: string | null | undefined,
  warehouseToId: string | null | undefined
): Promise<void> {
  if (type === MovementType.TRANSFER) {
    if (!warehouseFromId || !warehouseToId) {
      throw new BadRequestError(MSG.warehouseRequired)
    }
    await adjustStockQuantity(tx, itemId, warehouseFromId, -quantity)
    await adjustStockQuantity(tx, itemId, warehouseToId, +quantity)
    return
  }

  if (ENTRY_TYPES.has(type)) {
    if (!warehouseToId) throw new BadRequestError(MSG.warehouseRequired)
    await adjustStockQuantity(tx, itemId, warehouseToId, +quantity)
    return
  }

  if (EXIT_TYPES.has(type)) {
    if (!warehouseFromId) throw new BadRequestError(MSG.warehouseRequired)
    await adjustStockQuantity(tx, itemId, warehouseFromId, -quantity)
    return
  }
}

async function revertStockImpact(
  tx: Prisma.TransactionClient,
  type: MovementType,
  itemId: string,
  quantity: number,
  warehouseFromId: string | null | undefined,
  warehouseToId: string | null | undefined
): Promise<void> {
  if (type === MovementType.TRANSFER) {
    if (!warehouseFromId || !warehouseToId) return
    await adjustStockQuantity(tx, itemId, warehouseFromId, +quantity)
    await adjustStockQuantity(tx, itemId, warehouseToId, -quantity)
    return
  }

  if (ENTRY_TYPES.has(type)) {
    if (!warehouseToId) return
    await adjustStockQuantity(tx, itemId, warehouseToId, -quantity)
    return
  }

  if (EXIT_TYPES.has(type)) {
    if (!warehouseFromId) return
    await adjustStockQuantity(tx, itemId, warehouseFromId, +quantity)
    return
  }
}

async function adjustStockQuantity(
  tx: Prisma.TransactionClient,
  itemId: string,
  warehouseId: string,
  delta: number
): Promise<void> {
  const stock = await tx.stock.findUnique({
    where: { itemId_warehouseId: { itemId, warehouseId } },
  })

  if (!stock) {
    throw new NotFoundError(
      `Stock no encontrado para artículo ${itemId} en almacén ${warehouseId}`
    )
  }

  const newQuantityReal = stock.quantityReal + delta
  if (newQuantityReal < 0) {
    throw new BadRequestError(
      `Stock insuficiente en almacén ${warehouseId}. ` +
        `Disponible: ${stock.quantityReal}, Requerido: ${Math.abs(delta)}`
    )
  }

  await tx.stock.update({
    where: { id: stock.id },
    data: {
      quantityReal: newQuantityReal,
      quantityAvailable: newQuantityReal - stock.quantityReserved,
      lastMovementAt: new Date(),
    },
  })
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

const MOVEMENT_INCLUDE = {
  item: true,
  warehouseFrom: true,
  warehouseTo: true,
  batch: true,
} as const

export class MovementService {
  async create(
    data: ICreateMovementInput,
    userId: string,
    empresaId: string,
    db: PrismaClientType
  ): Promise<IMovementWithRelations> {
    const movementNumber = MovementNumberGenerator.generateMovementNumber()

    const movement = await (db as PrismaClient).$transaction(async (tx) => {
      const item = await tx.item.findFirst({
        where: { id: data.itemId, empresaId },
      })
      if (!item) throw new NotFoundError(INVENTORY_MESSAGES.item.notFound)

      if (data.warehouseFromId) {
        const wh = await tx.warehouse.findFirst({
          where: { id: data.warehouseFromId, empresaId },
        })
        if (!wh) throw new NotFoundError(INVENTORY_MESSAGES.warehouse.notFound)
      }

      if (data.warehouseToId) {
        const wh = await tx.warehouse.findFirst({
          where: { id: data.warehouseToId, empresaId },
        })
        if (!wh) throw new NotFoundError(INVENTORY_MESSAGES.warehouse.notFound)
      }

      await applyStockImpact(
        tx,
        data.type,
        data.itemId,
        data.quantity,
        data.warehouseFromId,
        data.warehouseToId
      )

      return tx.movement.create({
        data: {
          movementNumber,
          type: data.type,
          itemId: data.itemId,
          quantity: data.quantity,
          unitCost: data.unitCost ? parseFloat(String(data.unitCost)) : null,
          totalCost: data.totalCost ? parseFloat(String(data.totalCost)) : null,
          warehouseFromId: data.warehouseFromId ?? null,
          warehouseToId: data.warehouseToId ?? null,
          batchId: data.batchId ?? null,
          reference: data.reference ?? null,
          purchaseOrderId: data.purchaseOrderId ?? null,
          workOrderId: data.workOrderId ?? null,
          reservationId: data.reservationId ?? null,
          exitNoteId: data.exitNoteId ?? null,
          invoiceId: data.invoiceId ?? null,
          exitType: data.exitType ?? null,
          notes: data.notes ?? null,
          createdBy: userId,
          snapshotQuantity: data.snapshotQuantity ?? null,
          variance: data.variance ?? null,
          movementDate: data.movementDate ?? new Date(),
        },
        include: MOVEMENT_INCLUDE,
      })
    })

    logger.info(`Movimiento creado: ${movement.id}`, {
      userId,
      empresaId,
      movementNumber: movement.movementNumber,
      type: movement.type,
    })

    return movement as IMovementWithRelations
  }

  async findById(
    id: string,
    empresaId: string,
    db: PrismaClientType
  ): Promise<IMovementWithRelations> {
    const movement = await (db as PrismaClient).movement.findFirst({
      where: { id, item: { empresaId } },
      include: MOVEMENT_INCLUDE,
    })

    if (!movement) throw new NotFoundError(MSG.notFound)

    return movement as IMovementWithRelations
  }

  async findAll(
    filters: IMovementFilters = {},
    page: number = 1,
    limit: number = 10,
    sortBy: string = 'movementDate',
    sortOrder: 'asc' | 'desc' = 'desc',
    empresaId: string,
    db: PrismaClientType
  ): Promise<{
    items: IMovementWithRelations[]
    page: number
    limit: number
    total: number
  }> {
    const where: Prisma.MovementWhereInput = { item: { empresaId } }

    if (filters.type) where.type = filters.type as any
    if (filters.itemId) where.itemId = filters.itemId
    if (filters.createdBy) where.createdBy = filters.createdBy
    if (filters.reference) {
      where.reference = { contains: filters.reference, mode: 'insensitive' }
    }

    if (filters.warehouseFromId && filters.warehouseToId) {
      if (filters.warehouseFromId === filters.warehouseToId) {
        where.OR = [
          { warehouseFromId: filters.warehouseFromId },
          { warehouseToId: filters.warehouseToId },
        ]
      } else {
        where.warehouseFromId = filters.warehouseFromId
        where.warehouseToId = filters.warehouseToId
      }
    } else {
      if (filters.warehouseFromId)
        where.warehouseFromId = filters.warehouseFromId
      if (filters.warehouseToId) where.warehouseToId = filters.warehouseToId
    }

    if (filters.dateFrom || filters.dateTo) {
      where.movementDate = {}
      if (filters.dateFrom) where.movementDate.gte = filters.dateFrom
      if (filters.dateTo) where.movementDate.lte = filters.dateTo
    }

    const { skip, take } = PaginationHelper.validateAndParse({ page, limit })

    const [total, movements] = await Promise.all([
      (db as PrismaClient).movement.count({ where }),
      (db as PrismaClient).movement.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
        include: MOVEMENT_INCLUDE,
      }),
    ])

    return { items: movements as IMovementWithRelations[], page, limit, total }
  }

  async findByType(
    type: MovementType,
    empresaId: string,
    limit: number = 100,
    db: PrismaClientType
  ): Promise<IMovementWithRelations[]> {
    const movements = await (db as PrismaClient).movement.findMany({
      where: { type: type as any, item: { empresaId } },
      take: limit,
      orderBy: { movementDate: 'desc' },
      include: MOVEMENT_INCLUDE,
    })

    return movements as IMovementWithRelations[]
  }

  async findByWarehouse(
    warehouseId: string,
    empresaId: string,
    limit: number = 100,
    db: PrismaClientType
  ): Promise<IMovementWithRelations[]> {
    const movements = await (db as PrismaClient).movement.findMany({
      where: {
        item: { empresaId },
        OR: [{ warehouseFromId: warehouseId }, { warehouseToId: warehouseId }],
      },
      take: limit,
      orderBy: { movementDate: 'desc' },
      include: MOVEMENT_INCLUDE,
    })

    return movements as IMovementWithRelations[]
  }

  async findByItem(
    itemId: string,
    empresaId: string,
    limit: number = 100,
    db: PrismaClientType
  ): Promise<IMovementWithRelations[]> {
    const movements = await (db as PrismaClient).movement.findMany({
      where: { itemId, item: { empresaId } },
      take: limit,
      orderBy: { movementDate: 'desc' },
      include: MOVEMENT_INCLUDE,
    })

    return movements as IMovementWithRelations[]
  }

  async update(
    id: string,
    data: IUpdateMovementInput,
    userId: string,
    empresaId: string,
    db: PrismaClientType
  ): Promise<IMovementWithRelations> {
    const existing = await (db as PrismaClient).movement.findFirst({
      where: { id, item: { empresaId } },
    })
    if (!existing) throw new NotFoundError(MSG.notFound)

    if (data.warehouseFromId) {
      const wh = await (db as PrismaClient).warehouse.findFirst({
        where: { id: data.warehouseFromId, empresaId },
      })
      if (!wh) throw new NotFoundError(INVENTORY_MESSAGES.warehouse.notFound)
    }

    if (data.warehouseToId) {
      const wh = await (db as PrismaClient).warehouse.findFirst({
        where: { id: data.warehouseToId, empresaId },
      })
      if (!wh) throw new NotFoundError(INVENTORY_MESSAGES.warehouse.notFound)
    }

    const updateData: Record<string, unknown> = {}
    if (data.type !== undefined) updateData.type = data.type
    if (data.quantity !== undefined) updateData.quantity = data.quantity
    if (data.unitCost !== undefined)
      updateData.unitCost = data.unitCost
        ? parseFloat(String(data.unitCost))
        : null
    if (data.totalCost !== undefined)
      updateData.totalCost = data.totalCost
        ? parseFloat(String(data.totalCost))
        : null
    if (data.warehouseFromId !== undefined)
      updateData.warehouseFromId = data.warehouseFromId
    if (data.warehouseToId !== undefined)
      updateData.warehouseToId = data.warehouseToId
    if (data.batchId !== undefined) updateData.batchId = data.batchId
    if (data.reference !== undefined) updateData.reference = data.reference
    if (data.purchaseOrderId !== undefined)
      updateData.purchaseOrderId = data.purchaseOrderId
    if (data.workOrderId !== undefined)
      updateData.workOrderId = data.workOrderId
    if (data.reservationId !== undefined)
      updateData.reservationId = data.reservationId
    if (data.exitNoteId !== undefined) updateData.exitNoteId = data.exitNoteId
    if (data.invoiceId !== undefined) updateData.invoiceId = data.invoiceId
    if (data.exitType !== undefined) updateData.exitType = data.exitType
    if (data.notes !== undefined) updateData.notes = data.notes
    if (data.approvedBy !== undefined) updateData.approvedBy = data.approvedBy
    if (data.approvedAt !== undefined) updateData.approvedAt = data.approvedAt

    const movement = await (db as PrismaClient).movement.update({
      where: { id },
      data: updateData,
      include: MOVEMENT_INCLUDE,
    })

    logger.info(`Movimiento actualizado: ${movement.id}`, { userId, empresaId })

    return movement as IMovementWithRelations
  }

  async cancel(
    id: string,
    userId: string,
    empresaId: string,
    db: PrismaClientType
  ): Promise<IMovementWithRelations> {
    const updated = await (db as PrismaClient).$transaction(async (tx) => {
      const movement = await tx.movement.findFirst({
        where: { id, item: { empresaId } },
      })

      if (!movement) throw new NotFoundError(MSG.notFound)

      if (movement.notes?.includes('[CANCELADO')) {
        throw new BadRequestError(MSG.cannotCancel)
      }

      await revertStockImpact(
        tx,
        movement.type as MovementType,
        movement.itemId,
        movement.quantity,
        movement.warehouseFromId,
        movement.warehouseToId
      )

      const cancelNote = `[CANCELADO por ${userId} - ${new Date().toISOString()}]`
      return tx.movement.update({
        where: { id },
        data: {
          notes: movement.notes
            ? `${movement.notes}\n${cancelNote}`
            : cancelNote,
          updatedAt: new Date(),
        },
        include: MOVEMENT_INCLUDE,
      })
    })

    logger.info(`Movimiento cancelado: ${id}`, { userId, empresaId })

    return updated as IMovementWithRelations
  }

  async getDashboardMetrics(
    empresaId: string,
    db: PrismaClientType
  ): Promise<{
    totalMovements: number
    totalEntries: number
    totalExits: number
    netValue: number
    byType: { type: string; _count: number }[]
  }> {
    const entryTypes = [...ENTRY_TYPES] as string[]
    const exitTypes = [...EXIT_TYPES] as string[]
    const tenantWhere = { item: { empresaId } }

    const [
      totalMovements,
      totalEntries,
      totalExits,
      entriesValue,
      exitsValue,
      byType,
    ] = await Promise.all([
      (db as PrismaClient).movement.count({ where: tenantWhere }),
      (db as PrismaClient).movement.count({
        where: { ...tenantWhere, type: { in: entryTypes as never[] } },
      }),
      (db as PrismaClient).movement.count({
        where: { ...tenantWhere, type: { in: exitTypes as never[] } },
      }),
      (db as PrismaClient).movement.aggregate({
        where: { ...tenantWhere, type: { in: entryTypes as never[] } },
        _sum: { totalCost: true },
      }),
      (db as PrismaClient).movement.aggregate({
        where: { ...tenantWhere, type: { in: exitTypes as never[] } },
        _sum: { totalCost: true },
      }),
      (db as PrismaClient).movement.groupBy({
        by: ['type'],
        where: tenantWhere,
        _count: { _all: true },
        orderBy: { _count: { type: 'desc' } },
      }),
    ])

    return {
      totalMovements,
      totalEntries,
      totalExits,
      netValue:
        Number(entriesValue._sum.totalCost ?? 0) -
        Number(exitsValue._sum.totalCost ?? 0),
      byType: byType.map((g) => ({
        type: String(g.type),
        _count: Number(g._count._all),
      })),
    }
  }

  /**
   * Eliminación física bloqueada — los movimientos son registros contables.
   * Use cancel() para cancelar con trazabilidad completa.
   */
  async delete(id: string): Promise<void> {
    throw new BadRequestError(
      `No se puede eliminar movimientos. Use cancel() para cancelar con trazabilidad contable. Movimiento: ${id}`
    )
  }
}

export default new MovementService()
