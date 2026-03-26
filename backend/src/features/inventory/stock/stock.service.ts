// backend/src/features/inventory/stock/stock.service.ts

import { PrismaClient, Prisma } from '../../../generated/prisma/client.js'
import {
  ICreateStockInput,
  IUpdateStockInput,
  IStockFilters,
  IStockWithRelations,
  IStockAdjustment,
  IStockReservation,
  IStockRelease,
  IStockTransfer,
  AlertSeverity,
  ICreateStockAlertInput,
  IStockAlertFilters,
} from './stock.interface.js'
import {
  NotFoundError,
  ConflictError,
  BadRequestError,
} from '../../../shared/utils/apiError.js'
import { PaginationHelper } from '../../../shared/utils/pagination.js'
import { logger } from '../../../shared/utils/logger.js'
import { INVENTORY_MESSAGES } from '../shared/constants/messages.js'

type PrismaClientType = PrismaClient | Prisma.TransactionClient

const MSG = INVENTORY_MESSAGES.stock

// Include apenas relaciones; los campos escalares (incluyendo location) se incluyen automáticamente
const STOCK_INCLUDE = {
  item: true,
  warehouse: true,
} as const

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

async function assertItemBelongsToEmpresa(
  db: PrismaClientType,
  itemId: string,
  empresaId: string
): Promise<void> {
  const item = await (db as PrismaClient).item.findFirst({
    where: { id: itemId, empresaId },
  })
  if (!item) throw new NotFoundError(INVENTORY_MESSAGES.item.notFound)
}

async function assertWarehouseBelongsToEmpresa(
  db: PrismaClientType,
  warehouseId: string,
  empresaId: string
): Promise<void> {
  const wh = await (db as PrismaClient).warehouse.findFirst({
    where: { id: warehouseId, empresaId },
  })
  if (!wh) throw new NotFoundError(INVENTORY_MESSAGES.warehouse.notFound)
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export class StockService {
  // -------------------------------------------------------------------------
  // CRUD básico
  // -------------------------------------------------------------------------

  async create(
    data: ICreateStockInput,
    empresaId: string,
    db: PrismaClientType
  ): Promise<IStockWithRelations> {
    await assertItemBelongsToEmpresa(db, data.itemId, empresaId)
    await assertWarehouseBelongsToEmpresa(db, data.warehouseId, empresaId)

    const existing = await (db as PrismaClient).stock.findUnique({
      where: {
        itemId_warehouseId: {
          itemId: data.itemId,
          warehouseId: data.warehouseId,
        },
      },
    })
    if (existing) {
      throw new ConflictError(
        'Ya existe un registro de stock para este artículo en este almacén'
      )
    }

    const quantityReal = data.quantityReal ?? 0
    const quantityReserved = data.quantityReserved ?? 0

    // Si no se proporcionó una ubicación, usar la ubicación del item por defecto
    let stockLocation = data.location ?? null
    if (stockLocation === null) {
      const item = await (db as PrismaClient).item.findUnique({
        where: { id: data.itemId },
        select: { location: true },
      })
      stockLocation = item?.location ?? null
    }

    const stock = await (db as PrismaClient).stock.create({
      data: {
        itemId: data.itemId,
        warehouseId: data.warehouseId,
        quantityReal,
        quantityReserved,
        quantityAvailable: quantityReal - quantityReserved,
        location: stockLocation,
        averageCost: data.averageCost
          ? parseFloat(String(data.averageCost))
          : 0,
      },
      include: STOCK_INCLUDE,
    })

    logger.info(`Stock creado: ${stock.id}`, {
      itemId: stock.itemId,
      warehouseId: stock.warehouseId,
      empresaId,
    })

    return stock as unknown as IStockWithRelations
  }

  async findById(
    id: string,
    empresaId: string,
    db: PrismaClientType
  ): Promise<IStockWithRelations> {
    const stock = await (db as PrismaClient).stock.findFirst({
      where: { id, item: { empresaId } },
      include: STOCK_INCLUDE,
    })
    if (!stock) throw new NotFoundError(MSG.notFound)
    return stock as unknown as IStockWithRelations
  }

  async findByItemAndWarehouse(
    itemId: string,
    warehouseId: string,
    empresaId: string,
    db: PrismaClientType
  ): Promise<IStockWithRelations> {
    const stock = await (db as PrismaClient).stock.findFirst({
      where: { itemId, warehouseId, item: { empresaId } },
      include: STOCK_INCLUDE,
    })
    if (!stock) throw new NotFoundError(MSG.notFound)
    return stock as unknown as IStockWithRelations
  }

  async findAll(
    filters: IStockFilters = {},
    page: number = 1,
    limit: number = 10,
    sortBy: string = 'createdAt',
    sortOrder: 'asc' | 'desc' = 'desc',
    empresaId: string,
    db: PrismaClientType
  ): Promise<{
    items: IStockWithRelations[]
    page: number
    limit: number
    total: number
  }> {
    const where: Prisma.StockWhereInput = { item: { empresaId } }

    if (filters.itemId) where.itemId = filters.itemId
    if (filters.warehouseId) where.warehouseId = filters.warehouseId

    if (filters.outOfStock) {
      where.quantityAvailable = 0
    } else if (filters.lowStock) {
      where.quantityAvailable = { lt: 10 }
    } else {
      if (filters.minQuantity !== undefined) {
        where.quantityAvailable = { gte: filters.minQuantity }
      }
      if (filters.maxQuantity !== undefined) {
        where.quantityAvailable = { lte: filters.maxQuantity }
      }
    }

    const { skip, take } = PaginationHelper.validateAndParse({ page, limit })

    const [total, stocks] = await Promise.all([
      (db as PrismaClient).stock.count({ where }),
      (db as PrismaClient).stock.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
        include: STOCK_INCLUDE,
      }),
    ])

    return {
      items: stocks as unknown as IStockWithRelations[],
      page,
      limit,
      total,
    }
  }

  async findByItem(
    itemId: string,
    empresaId: string,
    db: PrismaClientType
  ): Promise<IStockWithRelations[]> {
    const stocks = await (db as PrismaClient).stock.findMany({
      where: { itemId, item: { empresaId } },
      orderBy: { createdAt: 'asc' },
      include: STOCK_INCLUDE,
    })
    return stocks as unknown as IStockWithRelations[]
  }

  async findByWarehouse(
    warehouseId: string,
    empresaId: string,
    db: PrismaClientType
  ): Promise<IStockWithRelations[]> {
    const stocks = await (db as PrismaClient).stock.findMany({
      where: { warehouseId, item: { empresaId } },
      orderBy: { createdAt: 'asc' },
      include: STOCK_INCLUDE,
    })
    return stocks as unknown as IStockWithRelations[]
  }

  async findLowStock(
    empresaId: string,
    db: PrismaClientType,
    warehouseId?: string
  ): Promise<IStockWithRelations[]> {
    const stocks = await (db as PrismaClient).stock.findMany({
      where: {
        item: { empresaId },
        ...(warehouseId ? { warehouseId } : {}),
        quantityAvailable: { lt: 10 },
      },
      orderBy: { quantityAvailable: 'asc' },
      include: STOCK_INCLUDE,
    })
    return stocks as unknown as IStockWithRelations[]
  }

  async findOutOfStock(
    empresaId: string,
    db: PrismaClientType,
    warehouseId?: string
  ): Promise<IStockWithRelations[]> {
    const stocks = await (db as PrismaClient).stock.findMany({
      where: {
        item: { empresaId },
        ...(warehouseId ? { warehouseId } : {}),
        quantityAvailable: 0,
      },
      orderBy: { createdAt: 'desc' },
      include: STOCK_INCLUDE,
    })
    return stocks as unknown as IStockWithRelations[]
  }

  // -------------------------------------------------------------------------
  // Operaciones de stock
  // -------------------------------------------------------------------------

  async adjust(
    data: IStockAdjustment,
    empresaId: string,
    userId: string,
    db: PrismaClientType
  ): Promise<IStockWithRelations> {
    await assertItemBelongsToEmpresa(db, data.itemId, empresaId)

    const stock = await (db as PrismaClient).stock.findUnique({
      where: {
        itemId_warehouseId: {
          itemId: data.itemId,
          warehouseId: data.warehouseId,
        },
      },
    })
    if (!stock) throw new NotFoundError(MSG.notFound)

    const newQuantityReal = stock.quantityReal + data.quantityChange
    if (newQuantityReal < 0) throw new BadRequestError(MSG.negative)

    const updated = await (db as PrismaClient).stock.update({
      where: { id: stock.id },
      data: {
        quantityReal: newQuantityReal,
        quantityAvailable: newQuantityReal - stock.quantityReserved,
        lastMovementAt: new Date(),
      },
      include: STOCK_INCLUDE,
    })

    logger.info(`Stock ajustado: ${stock.id}`, {
      userId,
      empresaId,
      itemId: data.itemId,
      reason: data.reason,
      change: data.quantityChange,
    })

    return updated as unknown as IStockWithRelations
  }

  async reserve(
    data: IStockReservation,
    empresaId: string,
    userId: string,
    db: PrismaClientType
  ): Promise<IStockWithRelations> {
    await assertItemBelongsToEmpresa(db, data.itemId, empresaId)

    const stock = await (db as PrismaClient).stock.findUnique({
      where: {
        itemId_warehouseId: {
          itemId: data.itemId,
          warehouseId: data.warehouseId,
        },
      },
    })
    if (!stock) throw new NotFoundError(MSG.notFound)

    if (stock.quantityAvailable < data.quantity) {
      throw new BadRequestError(MSG.insufficient)
    }

    const newQuantityReserved = stock.quantityReserved + data.quantity

    const updated = await (db as PrismaClient).stock.update({
      where: { id: stock.id },
      data: {
        quantityReserved: newQuantityReserved,
        quantityAvailable: stock.quantityReal - newQuantityReserved,
        lastMovementAt: new Date(),
      },
      include: STOCK_INCLUDE,
    })

    logger.info(`Stock reservado: ${stock.id}`, {
      userId,
      empresaId,
      itemId: data.itemId,
      quantity: data.quantity,
    })

    return updated as unknown as IStockWithRelations
  }

  async releaseReservation(
    data: IStockRelease,
    empresaId: string,
    userId: string,
    db: PrismaClientType
  ): Promise<IStockWithRelations> {
    await assertItemBelongsToEmpresa(db, data.itemId, empresaId)

    const stock = await (db as PrismaClient).stock.findUnique({
      where: {
        itemId_warehouseId: {
          itemId: data.itemId,
          warehouseId: data.warehouseId,
        },
      },
    })
    if (!stock) throw new NotFoundError(MSG.notFound)

    if (stock.quantityReserved < data.quantity) {
      throw new BadRequestError(MSG.released)
    }

    const newQuantityReserved = stock.quantityReserved - data.quantity

    const updated = await (db as PrismaClient).stock.update({
      where: { id: stock.id },
      data: {
        quantityReserved: newQuantityReserved,
        quantityAvailable: stock.quantityReal - newQuantityReserved,
        lastMovementAt: new Date(),
      },
      include: STOCK_INCLUDE,
    })

    logger.info(`Stock liberado: ${stock.id}`, {
      userId,
      empresaId,
      itemId: data.itemId,
      quantity: data.quantity,
    })

    return updated as unknown as IStockWithRelations
  }

  async transfer(
    data: IStockTransfer,
    empresaId: string,
    userId: string,
    db: PrismaClientType
  ): Promise<{ from: IStockWithRelations; to: IStockWithRelations }> {
    await assertItemBelongsToEmpresa(db, data.itemId, empresaId)
    await assertWarehouseBelongsToEmpresa(db, data.warehouseFromId, empresaId)
    await assertWarehouseBelongsToEmpresa(db, data.warehouseToId, empresaId)

    const result = await (db as PrismaClient).$transaction(async (tx) => {
      const stockFrom = await tx.stock.findUnique({
        where: {
          itemId_warehouseId: {
            itemId: data.itemId,
            warehouseId: data.warehouseFromId,
          },
        },
      })
      if (!stockFrom) throw new NotFoundError(MSG.notFound)
      if (stockFrom.quantityAvailable < data.quantity) {
        throw new BadRequestError(MSG.insufficient)
      }

      const stockTo = await tx.stock.findUnique({
        where: {
          itemId_warehouseId: {
            itemId: data.itemId,
            warehouseId: data.warehouseToId,
          },
        },
      })
      if (!stockTo) throw new NotFoundError(MSG.notFound)

      const [updatedFrom, updatedTo] = await Promise.all([
        tx.stock.update({
          where: { id: stockFrom.id },
          data: {
            quantityReal: stockFrom.quantityReal - data.quantity,
            quantityAvailable: stockFrom.quantityAvailable - data.quantity,
            lastMovementAt: new Date(),
          },
          include: STOCK_INCLUDE,
        }),
        tx.stock.update({
          where: { id: stockTo.id },
          data: {
            quantityReal: stockTo.quantityReal + data.quantity,
            quantityAvailable: stockTo.quantityAvailable + data.quantity,
            lastMovementAt: new Date(),
          },
          include: STOCK_INCLUDE,
        }),
      ])

      return { from: updatedFrom, to: updatedTo }
    })

    logger.info(`Stock transferido: ${data.itemId}`, {
      userId,
      empresaId,
      from: data.warehouseFromId,
      to: data.warehouseToId,
      quantity: data.quantity,
    })

    return {
      from: result.from as unknown as IStockWithRelations,
      to: result.to as unknown as IStockWithRelations,
    }
  }

  async update(
    id: string,
    data: IUpdateStockInput,
    empresaId: string,
    userId: string,
    db: PrismaClientType
  ): Promise<IStockWithRelations> {
    const stock = await (db as PrismaClient).stock.findFirst({
      where: { id, item: { empresaId } },
    })
    if (!stock) throw new NotFoundError(MSG.notFound)

    const updateData: Record<string, unknown> = {}
    let newQuantityReal = stock.quantityReal
    let newQuantityReserved = stock.quantityReserved

    if (data.quantityReal !== undefined) {
      newQuantityReal = data.quantityReal
      updateData.quantityReal = data.quantityReal
    }
    if (data.quantityReserved !== undefined) {
      newQuantityReserved = data.quantityReserved
      updateData.quantityReserved = data.quantityReserved
    }
    if (data.location !== undefined) {
      updateData.location = data.location
    }
    if (data.averageCost !== undefined) {
      updateData.averageCost = parseFloat(String(data.averageCost))
    }
    updateData.quantityAvailable = newQuantityReal - newQuantityReserved

    const updated = await (db as PrismaClient).stock.update({
      where: { id },
      data: updateData,
      include: STOCK_INCLUDE,
    })

    logger.info(`Stock actualizado: ${id}`, {
      userId,
      empresaId,
      changes: data,
    })

    return updated as unknown as IStockWithRelations
  }

  // -------------------------------------------------------------------------
  // Alertas
  // -------------------------------------------------------------------------

  async createAlert(
    data: ICreateStockAlertInput,
    empresaId: string,
    userId: string,
    db: PrismaClientType
  ): Promise<unknown> {
    await assertItemBelongsToEmpresa(db, data.itemId, empresaId)

    const alert = await (db as PrismaClient).stockAlert.create({
      data: {
        itemId: data.itemId,
        warehouseId: data.warehouseId,
        type: data.type,
        message: data.message,
        severity: data.severity ?? AlertSeverity.MEDIUM,
      },
    })

    logger.info(`Alerta de stock creada: ${alert.id}`, {
      userId,
      empresaId,
      itemId: data.itemId,
      type: data.type,
    })

    return alert
  }

  async getAlerts(
    filters: IStockAlertFilters = {},
    empresaId: string,
    page: number = 1,
    limit: number = 20,
    db: PrismaClientType
  ): Promise<{ items: unknown[]; page: number; limit: number; total: number }> {
    const where: Prisma.StockAlertWhereInput = { item: { empresaId } }

    if (filters.type) where.type = filters.type as any
    if (filters.itemId) where.itemId = filters.itemId
    if (filters.warehouseId) where.warehouseId = filters.warehouseId
    if (filters.isRead !== undefined) where.isRead = filters.isRead
    if (filters.severity) where.severity = filters.severity as any

    const { skip, take } = PaginationHelper.validateAndParse({ page, limit })

    const [total, alerts] = await Promise.all([
      (db as PrismaClient).stockAlert.count({ where }),
      (db as PrismaClient).stockAlert.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
    ])

    return { items: alerts, page, limit, total }
  }

  async markAlertAsRead(
    alertId: string,
    empresaId: string,
    userId: string,
    db: PrismaClientType
  ): Promise<unknown> {
    const existing = await (db as PrismaClient).stockAlert.findFirst({
      where: { id: alertId, item: { empresaId } },
    })
    if (!existing) throw new NotFoundError(MSG.notFound)

    const alert = await (db as PrismaClient).stockAlert.update({
      where: { id: alertId },
      data: {
        isRead: true,
        readBy: userId,
        readAt: new Date(),
      },
    })

    logger.info(`Alerta marcada como leída: ${alertId}`, { userId, empresaId })

    return alert
  }
}

export default new StockService()
