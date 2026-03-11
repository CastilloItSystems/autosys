// backend/src/features/inventory/stock/stock.service.ts

import prisma from '../../../services/prisma.service'
import {
  ICreateStockInput,
  IUpdateStockInput,
  IStockFilters,
  IStockWithRelations,
  IStockAdjustment,
  IStockReservation,
  IStockRelease,
  IStockTransfer,
  AlertType,
  AlertSeverity,
  ICreateStockAlertInput,
  IStockAlertFilters,
} from './stock.interface'
import {
  NotFoundError,
  ConflictError,
  BadRequestError,
} from '../../../shared/utils/apiError'
import { PaginationHelper } from '../../../shared/utils/pagination'
import { logger } from '../../../shared/utils/logger'
import { INVENTORY_MESSAGES } from '../shared/constants/messages'

export class StockService {
  /**
   * Crear nuevo registro de stock
   */
  async create(data: ICreateStockInput): Promise<IStockWithRelations> {
    try {
      // Verificar que el artículo existe
      const item = await prisma.item.findUnique({
        where: { id: data.itemId },
      })
      if (!item) {
        throw new NotFoundError('Artículo no encontrado')
      }

      // Verificar que el almacén existe
      const warehouse = await prisma.warehouse.findUnique({
        where: { id: data.warehouseId },
      })
      if (!warehouse) {
        throw new NotFoundError('Almacén no encontrado')
      }

      // Verificar que no exista ya un registro de stock para este item/warehouse
      const existing = await prisma.stock.findUnique({
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
      const quantityAvailable = quantityReal - quantityReserved

      const stock = await prisma.stock.create({
        data: {
          itemId: data.itemId,
          warehouseId: data.warehouseId,
          quantityReal,
          quantityReserved,
          quantityAvailable,
          averageCost: data.averageCost
            ? parseFloat(String(data.averageCost))
            : 0,
        },
        include: {
          item: true,
          warehouse: true,
        },
      })

      logger.info(`Stock creado: ${stock.id}`, {
        itemId: stock.itemId,
        warehouseId: stock.warehouseId,
      })

      return stock as unknown as IStockWithRelations
    } catch (error) {
      logger.error('Error al crear stock', { error, data })
      throw error
    }
  }

  /**
   * Obtener stock por ID
   */
  async findById(id: string): Promise<IStockWithRelations> {
    try {
      const stock = await prisma.stock.findUnique({
        where: { id },
        include: {
          item: true,
          warehouse: true,
        },
      })

      if (!stock) {
        throw new NotFoundError(INVENTORY_MESSAGES.stock.notFound)
      }

      return stock as unknown as IStockWithRelations
    } catch (error) {
      logger.error('Error al obtener stock', { error, id })
      throw error
    }
  }

  /**
   * Obtener stock de item en almacén específico
   */
  async findByItemAndWarehouse(
    itemId: string,
    warehouseId: string
  ): Promise<IStockWithRelations> {
    try {
      const stock = await prisma.stock.findUnique({
        where: {
          itemId_warehouseId: {
            itemId,
            warehouseId,
          },
        },
        include: {
          item: true,
          warehouse: true,
        },
      })

      if (!stock) {
        throw new NotFoundError(INVENTORY_MESSAGES.stock.notFound)
      }

      return stock as unknown as IStockWithRelations
    } catch (error) {
      logger.error('Error al obtener stock', { error, itemId, warehouseId })
      throw error
    }
  }

  /**
   * Obtener todos los stocks con filtros
   */
  async findAll(
    filters: IStockFilters = {},
    page: number = 1,
    limit: number = 10,
    sortBy: string = 'createdAt',
    sortOrder: 'asc' | 'desc' = 'desc',
    prismaClient?: any
  ): Promise<{
    items: IStockWithRelations[]
    page: number
    limit: number
    total: number
  }> {
    try {
      const db = prismaClient || prisma
      const where: any = {}

      if (filters.itemId) {
        where.itemId = filters.itemId
      }

      if (filters.warehouseId) {
        where.warehouseId = filters.warehouseId
      }

      if (filters.lowStock) {
        // Buscar items con bajo stock (requiere relación con Item para obtener minQuantity)
        // Por ahora solo filtrar por cantidad disponible
        where.quantityAvailable = { lt: 10 }
      }

      if (filters.outOfStock) {
        where.quantityAvailable = 0
      }

      if (filters.minQuantity !== undefined) {
        where.quantityAvailable = { gte: filters.minQuantity }
      }

      if (filters.maxQuantity !== undefined) {
        where.quantityAvailable = { lte: filters.maxQuantity }
      }

      const total = await db.stock.count({ where })

      const { skip, take } = PaginationHelper.validateAndParse({ page, limit })

      const stocks = await db.stock.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
        include: {
          item: true,
          warehouse: true,
        },
      })

      return {
        items: stocks as unknown as IStockWithRelations[],
        page,
        limit,
        total,
      }
    } catch (error) {
      logger.error('Error al obtener stocks', { error, filters })
      throw error
    }
  }

  /**
   * Obtener stock de un artículo en todos los almacenes
   */
  async findByItem(itemId: string): Promise<IStockWithRelations[]> {
    try {
      const stocks = await prisma.stock.findMany({
        where: { itemId },
        orderBy: { createdAt: 'asc' },
        include: {
          item: true,
          warehouse: true,
        },
      })

      return stocks as unknown as IStockWithRelations[]
    } catch (error) {
      logger.error('Error al obtener stocks del artículo', { error, itemId })
      throw error
    }
  }

  /**
   * Obtener todos los stocks en un almacén
   */
  async findByWarehouse(warehouseId: string): Promise<IStockWithRelations[]> {
    try {
      const stocks = await prisma.stock.findMany({
        where: { warehouseId },
        orderBy: { createdAt: 'asc' },
        include: {
          item: true,
          warehouse: true,
        },
      })

      return stocks as unknown as IStockWithRelations[]
    } catch (error) {
      logger.error('Error al obtener stocks del almacén', {
        error,
        warehouseId,
      })
      throw error
    }
  }

  /**
   * Obtener items con bajo stock
   */
  async findLowStock(warehouseId?: string): Promise<IStockWithRelations[]> {
    try {
      const where: any = {}
      if (warehouseId) where.warehouseId = warehouseId

      const stocks = await prisma.stock.findMany({
        where: {
          ...where,
          quantityAvailable: { lt: 10 },
        },
        orderBy: { quantityAvailable: 'asc' },
        include: {
          item: true,
          warehouse: true,
        },
      })

      return stocks as unknown as IStockWithRelations[]
    } catch (error) {
      logger.error('Error al obtener stocks bajos', { error, warehouseId })
      throw error
    }
  }

  /**
   * Obtener items sin stock
   */
  async findOutOfStock(warehouseId?: string): Promise<IStockWithRelations[]> {
    try {
      const where: any = { quantityAvailable: 0 }
      if (warehouseId) where.warehouseId = warehouseId

      const stocks = await prisma.stock.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          item: true,
          warehouse: true,
        },
      })

      return stocks as unknown as IStockWithRelations[]
    } catch (error) {
      logger.error('Error al obtener stocks sin existencia', {
        error,
        warehouseId,
      })
      throw error
    }
  }

  /**
   * Ajustar stock (entrada/salida)
   */
  async adjust(
    data: IStockAdjustment,
    userId?: string
  ): Promise<IStockWithRelations> {
    try {
      const stock = await prisma.stock.findUnique({
        where: {
          itemId_warehouseId: {
            itemId: data.itemId,
            warehouseId: data.warehouseId,
          },
        },
      })

      if (!stock) {
        throw new NotFoundError(INVENTORY_MESSAGES.stock.notFound)
      }

      const newQuantityReal = stock.quantityReal + data.quantityChange

      if (newQuantityReal < 0) {
        throw new BadRequestError(INVENTORY_MESSAGES.stock.negative)
      }

      // Recalcular disponible
      const newQuantityAvailable = newQuantityReal - stock.quantityReserved

      const updated = await prisma.stock.update({
        where: { id: stock.id },
        data: {
          quantityReal: newQuantityReal,
          quantityAvailable: newQuantityAvailable,
          lastMovementAt: new Date(),
        },
        include: {
          item: true,
          warehouse: true,
        },
      })

      logger.info(`Stock ajustado: ${stock.id}`, {
        userId,
        itemId: data.itemId,
        reason: data.reason,
        change: data.quantityChange,
      })

      return updated as unknown as IStockWithRelations
    } catch (error) {
      logger.error('Error al ajustar stock', { error, data })
      throw error
    }
  }

  /**
   * Reservar stock
   */
  async reserve(
    data: IStockReservation,
    userId?: string
  ): Promise<IStockWithRelations> {
    try {
      const stock = await prisma.stock.findUnique({
        where: {
          itemId_warehouseId: {
            itemId: data.itemId,
            warehouseId: data.warehouseId,
          },
        },
      })

      if (!stock) {
        throw new NotFoundError(INVENTORY_MESSAGES.stock.notFound)
      }

      if (stock.quantityAvailable < data.quantity) {
        throw new BadRequestError(
          `Stock insuficiente. Disponible: ${stock.quantityAvailable}, Requerido: ${data.quantity}`
        )
      }

      const newQuantityReserved = stock.quantityReserved + data.quantity
      const newQuantityAvailable = stock.quantityReal - newQuantityReserved

      const updated = await prisma.stock.update({
        where: { id: stock.id },
        data: {
          quantityReserved: newQuantityReserved,
          quantityAvailable: newQuantityAvailable,
          lastMovementAt: new Date(),
        },
        include: {
          item: true,
          warehouse: true,
        },
      })

      logger.info(`Stock reservado: ${stock.id}`, {
        userId,
        itemId: data.itemId,
        quantity: data.quantity,
      })

      return updated as unknown as IStockWithRelations
    } catch (error) {
      logger.error('Error al reservar stock', { error, data })
      throw error
    }
  }

  /**
   * Liberar reserva
   */
  async releaseReservation(
    data: IStockRelease,
    userId?: string
  ): Promise<IStockWithRelations> {
    try {
      const stock = await prisma.stock.findUnique({
        where: {
          itemId_warehouseId: {
            itemId: data.itemId,
            warehouseId: data.warehouseId,
          },
        },
      })

      if (!stock) {
        throw new NotFoundError(INVENTORY_MESSAGES.stock.notFound)
      }

      if (stock.quantityReserved < data.quantity) {
        throw new BadRequestError(
          'No hay suficiente stock reservado para liberar'
        )
      }

      const newQuantityReserved = stock.quantityReserved - data.quantity
      const newQuantityAvailable = stock.quantityReal - newQuantityReserved

      const updated = await prisma.stock.update({
        where: { id: stock.id },
        data: {
          quantityReserved: newQuantityReserved,
          quantityAvailable: newQuantityAvailable,
          lastMovementAt: new Date(),
        },
        include: {
          item: true,
          warehouse: true,
        },
      })

      logger.info(`Stock liberado: ${stock.id}`, {
        userId,
        itemId: data.itemId,
        quantity: data.quantity,
      })

      return updated as unknown as IStockWithRelations
    } catch (error) {
      logger.error('Error al liberar stock', { error, data })
      throw error
    }
  }

  /**
   * Transferir stock entre almacenes
   */
  async transfer(
    data: IStockTransfer,
    userId?: string
  ): Promise<{ from: IStockWithRelations; to: IStockWithRelations }> {
    try {
      // Obtener stocks origen y destino
      const stockFrom = await prisma.stock.findUnique({
        where: {
          itemId_warehouseId: {
            itemId: data.itemId,
            warehouseId: data.warehouseFromId,
          },
        },
      })

      const stockTo = await prisma.stock.findUnique({
        where: {
          itemId_warehouseId: {
            itemId: data.itemId,
            warehouseId: data.warehouseToId,
          },
        },
      })

      if (!stockFrom) {
        throw new NotFoundError('Stock no encontrado en almacén origen')
      }

      if (!stockTo) {
        throw new NotFoundError('Stock no encontrado en almacén destino')
      }

      if (stockFrom.quantityAvailable < data.quantity) {
        throw new BadRequestError(INVENTORY_MESSAGES.stock.insufficient)
      }

      // Realizar transferencia
      const updatedFrom = await prisma.stock.update({
        where: { id: stockFrom.id },
        data: {
          quantityReal: stockFrom.quantityReal - data.quantity,
          quantityAvailable: stockFrom.quantityAvailable - data.quantity,
          lastMovementAt: new Date(),
        },
        include: {
          item: true,
          warehouse: true,
        },
      })

      const updatedTo = await prisma.stock.update({
        where: { id: stockTo.id },
        data: {
          quantityReal: stockTo.quantityReal + data.quantity,
          quantityAvailable: stockTo.quantityAvailable + data.quantity,
          lastMovementAt: new Date(),
        },
        include: {
          item: true,
          warehouse: true,
        },
      })

      logger.info(`Stock transferido: ${data.itemId}`, {
        userId,
        from: data.warehouseFromId,
        to: data.warehouseToId,
        quantity: data.quantity,
      })

      return {
        from: updatedFrom as unknown as IStockWithRelations,
        to: updatedTo as unknown as IStockWithRelations,
      }
    } catch (error) {
      logger.error('Error al transferir stock', { error, data })
      throw error
    }
  }

  /**
   * Actualizar stock
   */
  async update(
    id: string,
    data: IUpdateStockInput,
    userId?: string
  ): Promise<IStockWithRelations> {
    try {
      const stock = await prisma.stock.findUnique({
        where: { id },
      })

      if (!stock) {
        throw new NotFoundError(INVENTORY_MESSAGES.stock.notFound)
      }

      const updateData: any = {}
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

      if (data.averageCost !== undefined) {
        updateData.averageCost = parseFloat(String(data.averageCost))
      }

      // Recalcular disponible
      const newQuantityAvailable = newQuantityReal - newQuantityReserved
      updateData.quantityAvailable = newQuantityAvailable

      const updated = await prisma.stock.update({
        where: { id },
        data: updateData,
        include: {
          item: true,
          warehouse: true,
        },
      })

      logger.info(`Stock actualizado: ${id}`, { userId, changes: data })

      return updated as unknown as IStockWithRelations
    } catch (error) {
      logger.error('Error al actualizar stock', { error, id, data })
      throw error
    }
  }

  /**
   * Crear alerta de stock
   */
  async createAlert(
    data: ICreateStockAlertInput,
    userId?: string
  ): Promise<any> {
    try {
      const alert = await prisma.stockAlert.create({
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
        itemId: data.itemId,
        type: data.type,
      })

      return alert
    } catch (error) {
      logger.error('Error al crear alerta de stock', { error, data })
      throw error
    }
  }

  /**
   * Obtener alertas de stock
   */
  async getAlerts(
    filters: IStockAlertFilters = {},
    page: number = 1,
    limit: number = 20
  ): Promise<{
    items: any[]
    page: number
    limit: number
    total: number
  }> {
    try {
      const where: any = {}

      if (filters.type) where.type = filters.type
      if (filters.itemId) where.itemId = filters.itemId
      if (filters.warehouseId) where.warehouseId = filters.warehouseId
      if (filters.isRead !== undefined) where.isRead = filters.isRead
      if (filters.severity) where.severity = filters.severity

      const total = await prisma.stockAlert.count({ where })

      const { skip, take } = PaginationHelper.validateAndParse({ page, limit })

      const alerts = await prisma.stockAlert.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      })

      return { items: alerts, page, limit, total }
    } catch (error) {
      logger.error('Error al obtener alertas de stock', { error, filters })
      throw error
    }
  }

  /**
   * Marcar alerta como leída
   */
  async markAlertAsRead(alertId: string, userId?: string): Promise<any> {
    try {
      const alert = await prisma.stockAlert.update({
        where: { id: alertId },
        data: {
          isRead: true,
          readBy: userId ?? null,
          readAt: new Date(),
        },
      })

      return alert
    } catch (error) {
      logger.error('Error al marcar alerta como leída', { error, alertId })
      throw error
    }
  }
}

export default new StockService()
