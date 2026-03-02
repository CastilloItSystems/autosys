// backend/src/features/inventory/movements/movements.service.ts

import prisma from '../../../services/prisma.service'
import {
  ICreateMovementInput,
  IUpdateMovementInput,
  IMovementFilters,
  IMovementWithRelations,
  MovementType,
} from './movements.interface'
import {
  NotFoundError,
  ConflictError,
  BadRequestError,
} from '../../../shared/utils/ApiError'
import { PaginationHelper } from '../../../shared/utils/pagination'
import { logger } from '../../../shared/utils/logger'
import { INVENTORY_MESSAGES } from '../shared/constants/messages'
import { MovementNumberGenerator } from '../shared/utils/movementNumberGenerator'

export class MovementService {
  /**
   * Crear un nuevo movimiento
   */
  async create(
    data: ICreateMovementInput,
    userId?: string
  ): Promise<IMovementWithRelations> {
    try {
      // Generar número de movimiento
      const movementNumber =
        await MovementNumberGenerator.generateMovementNumber()

      // Validar que el artículo existe
      const item = await prisma.item.findUnique({
        where: { id: data.itemId },
      })

      if (!item) {
        throw new NotFoundError('Artículo no encontrado')
      }

      // Validar almacenes si es necesario
      if (data.warehouseFromId) {
        const warehouseFrom = await prisma.warehouse.findUnique({
          where: { id: data.warehouseFromId },
        })
        if (!warehouseFrom) {
          throw new NotFoundError('Almacén origen no encontrado')
        }
      }

      if (data.warehouseToId) {
        const warehouseTo = await prisma.warehouse.findUnique({
          where: { id: data.warehouseToId },
        })
        if (!warehouseTo) {
          throw new NotFoundError('Almacén destino no encontrado')
        }
      }

      // Crear el movimiento
      const movement = await prisma.movement.create({
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
          createdBy: userId ?? null,
          movementDate: data.movementDate ?? new Date(),
        },
        include: {
          item: true,
          warehouseFrom: true,
          warehouseTo: true,
          batch: true,
        },
      })

      logger.info(`Movimiento creado: ${movement.id}`, {
        userId,
        movementId: movement.id,
        movementNumber: movement.movementNumber,
        type: movement.type,
      })

      return movement as IMovementWithRelations
    } catch (error) {
      logger.error('Error al crear movimiento', { error, data })
      throw error
    }
  }

  /**
   * Obtener movimiento por ID
   */
  async findById(id: string): Promise<IMovementWithRelations> {
    try {
      const movement = await prisma.movement.findUnique({
        where: { id },
        include: {
          item: true,
          warehouseFrom: true,
          warehouseTo: true,
          batch: true,
        },
      })

      if (!movement) {
        throw new NotFoundError('Movimiento no encontrado')
      }

      return movement as IMovementWithRelations
    } catch (error) {
      logger.error('Error al obtener movimiento', { error, id })
      throw error
    }
  }

  /**
   * Obtener todos los movimientos con filtros
   */
  async findAll(
    filters: IMovementFilters = {},
    page: number = 1,
    limit: number = 10,
    sortBy: string = 'movementDate',
    sortOrder: 'asc' | 'desc' = 'desc',
    prismaClient?: any
  ): Promise<{
    items: IMovementWithRelations[]
    page: number
    limit: number
    total: number
  }> {
    try {
      const db = prismaClient || prisma
      const where: any = {}

      if (filters.type) {
        where.type = filters.type
      }

      if (filters.itemId) {
        where.itemId = filters.itemId
      }

      if (filters.warehouseFromId) {
        where.warehouseFromId = filters.warehouseFromId
      }

      if (filters.warehouseToId) {
        where.warehouseToId = filters.warehouseToId
      }

      if (filters.createdBy) {
        where.createdBy = filters.createdBy
      }

      if (filters.reference) {
        where.reference = {
          contains: filters.reference,
          mode: 'insensitive',
        }
      }

      // Rango de fechas
      if (filters.dateFrom || filters.dateTo) {
        where.movementDate = {}
        if (filters.dateFrom) {
          where.movementDate.gte = filters.dateFrom
        }
        if (filters.dateTo) {
          where.movementDate.lte = filters.dateTo
        }
      }

      const total = await db.movement.count({ where })

      const { skip, take } = PaginationHelper.validateAndParse({ page, limit })

      const movements = await db.movement.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
        include: {
          item: true,
          warehouseFrom: true,
          warehouseTo: true,
          batch: true,
        },
      })

      return {
        items: movements as IMovementWithRelations[],
        page,
        limit,
        total,
      }
    } catch (error) {
      logger.error('Error al obtener movimientos', { error, filters })
      throw error
    }
  }

  /**
   * Obtener movimientos por tipo
   */
  async findByType(
    type: MovementType,
    limit: number = 100
  ): Promise<IMovementWithRelations[]> {
    try {
      const movements = await prisma.movement.findMany({
        where: { type },
        take: limit,
        orderBy: { movementDate: 'desc' },
        include: {
          item: true,
          warehouseFrom: true,
          warehouseTo: true,
          batch: true,
        },
      })

      return movements as IMovementWithRelations[]
    } catch (error) {
      logger.error('Error al obtener movimientos por tipo', { error, type })
      throw error
    }
  }

  /**
   * Obtener movimientos por almacén
   */
  async findByWarehouse(
    warehouseId: string,
    limit: number = 100
  ): Promise<IMovementWithRelations[]> {
    try {
      const movements = await prisma.movement.findMany({
        where: {
          OR: [
            { warehouseFromId: warehouseId },
            { warehouseToId: warehouseId },
          ],
        },
        take: limit,
        orderBy: { movementDate: 'desc' },
        include: {
          item: true,
          warehouseFrom: true,
          warehouseTo: true,
          batch: true,
        },
      })

      return movements as IMovementWithRelations[]
    } catch (error) {
      logger.error('Error al obtener movimientos por almacén', {
        error,
        warehouseId,
      })
      throw error
    }
  }

  /**
   * Obtener movimientos por artículo
   */
  async findByItem(
    itemId: string,
    limit: number = 100
  ): Promise<IMovementWithRelations[]> {
    try {
      const movements = await prisma.movement.findMany({
        where: { itemId },
        take: limit,
        orderBy: { movementDate: 'desc' },
        include: {
          item: true,
          warehouseFrom: true,
          warehouseTo: true,
          batch: true,
        },
      })

      return movements as IMovementWithRelations[]
    } catch (error) {
      logger.error('Error al obtener movimientos por artículo', {
        error,
        itemId,
      })
      throw error
    }
  }

  /**
   * Actualizar movimiento
   */
  async update(
    id: string,
    data: IUpdateMovementInput,
    userId?: string
  ): Promise<IMovementWithRelations> {
    try {
      // Verificar que el movimiento existe
      const existing = await prisma.movement.findUnique({
        where: { id },
      })

      if (!existing) {
        throw new NotFoundError('Movimiento no encontrado')
      }

      // Validar almacenes si se actualizan
      if (data.warehouseFromId) {
        const warehouse = await prisma.warehouse.findUnique({
          where: { id: data.warehouseFromId },
        })
        if (!warehouse) {
          throw new NotFoundError('Almacén origen no encontrado')
        }
      }

      if (data.warehouseToId) {
        const warehouse = await prisma.warehouse.findUnique({
          where: { id: data.warehouseToId },
        })
        if (!warehouse) {
          throw new NotFoundError('Almacén destino no encontrado')
        }
      }

      // Preparar datos para actualizar
      const updateData: any = {}
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

      const movement = await prisma.movement.update({
        where: { id },
        data: updateData,
        include: {
          item: true,
          warehouseFrom: true,
          warehouseTo: true,
          batch: true,
        },
      })

      logger.info(`Movimiento actualizado: ${movement.id}`, {
        userId,
        movementId: movement.id,
        changes: data,
      })

      return movement as IMovementWithRelations
    } catch (error) {
      logger.error('Error al actualizar movimiento', { error, id, data })
      throw error
    }
  }

  /**
   * Cancelar movimiento (soft delete)
   */
  async cancel(id: string, userId?: string): Promise<IMovementWithRelations> {
    try {
      const movement = await prisma.movement.findUnique({
        where: { id },
      })

      if (!movement) {
        throw new NotFoundError('Movimiento no encontrado')
      }

      // Actualizar el estado del movimiento (en futuro se puede usar campo status)
      // Por ahora, usar approvedBy = 'CANCELLED' como marcador
      const updated = await prisma.movement.update({
        where: { id },
        data: {
          notes: `${movement.notes || ''}\n[CANCELADO]`,
          updatedAt: new Date(),
        },
        include: {
          item: true,
          warehouseFrom: true,
          warehouseTo: true,
          batch: true,
        },
      })

      logger.info(`Movimiento cancelado: ${id}`, { userId })

      return updated as IMovementWithRelations
    } catch (error) {
      logger.error('Error al cancelar movimiento', { error, id })
      throw error
    }
  }

  /**
   * Eliminar movimiento
   */
  async delete(id: string, userId?: string): Promise<void> {
    try {
      const movement = await prisma.movement.findUnique({
        where: { id },
      })

      if (!movement) {
        throw new NotFoundError('Movimiento no encontrado')
      }

      await prisma.movement.delete({
        where: { id },
      })

      logger.info(`Movimiento eliminado: ${id}`, { userId })
    } catch (error) {
      logger.error('Error al eliminar movimiento', { error, id })
      throw error
    }
  }
}

export default new MovementService()
