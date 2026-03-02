// backend/src/features/inventory/adjustments/adjustments.service.ts

import prisma from '../../../services/prisma.service'
import { logger } from '../../../shared/utils/logger'
import { PaginationHelper } from '../../../shared/utils/pagination'
import {
  NotFoundError,
  BadRequestError,
  ConflictError,
} from '../../../shared/utils/ApiError'
import {
  IAdjustmentWithRelations,
  IAdjustmentItem,
  ICreateAdjustmentInput,
  IUpdateAdjustmentInput,
  IAdjustmentFilters,
  ICreateAdjustmentItemInput,
  AdjustmentStatus,
} from './adjustments.interface'
import EventService from '../shared/events/event.service'
import { EventType } from '../shared/events/event.types'
import { INVENTORY_MESSAGES } from '../shared/constants/messages'
import { v4 as uuidv4 } from 'uuid'

class AdjustmentService {
  /**
   * Crear ajuste de inventario
   */
  async create(
    data: ICreateAdjustmentInput,
    userId?: string
  ): Promise<IAdjustmentWithRelations> {
    try {
      // Validar que el almacén existe
      const warehouse = await prisma.warehouse.findUnique({
        where: { id: data.warehouseId },
      })

      if (!warehouse) {
        throw new NotFoundError('Almacén no encontrado')
      }

      // Validar que todos los items existen
      const itemIds = data.items.map((item) => item.itemId)
      const existingItems = await prisma.item.findMany({
        where: { id: { in: itemIds } },
      })

      if (existingItems.length !== itemIds.length) {
        throw new BadRequestError('Uno o más items no existen')
      }

      // Generar número de ajuste
      const adjustmentCount = await prisma.adjustment.count()
      const adjustmentNumber = `ADJ-${new Date().getFullYear()}-${String(adjustmentCount + 1).padStart(5, '0')}`

      // Crear ajuste
      const adjustment = await prisma.adjustment.create({
        data: {
          adjustmentNumber,
          warehouseId: data.warehouseId,
          status: AdjustmentStatus.DRAFT,
          reason: data.reason,
          notes: data.notes ?? null,
          createdBy: userId || 'system',
          items: {
            create: data.items.map((item) => ({
              itemId: item.itemId,
              quantityChange: item.quantityChange,
              unitCost: item.unitCost ?? null,
              notes: item.notes ?? null,
            })),
          },
        },
        include: {
          items: true,
          warehouse: true,
        },
      })

      logger.info(`Ajuste creado: ${adjustment.id}`, {
        adjustmentNumber: adjustment.adjustmentNumber,
        warehouseId: adjustment.warehouseId,
        itemsCount: data.items.length,
      })

      // Emit event
      const eventService = EventService.getInstance()
      await eventService.emit({
        type: EventType.ADJUSTMENT_CREATED,
        entityId: adjustment.id,
        entityType: 'adjustment',
        userId: userId || 'system',
        data: {
          adjustmentNumber: adjustment.adjustmentNumber,
          reason: adjustment.reason,
          itemsCount: data.items.length,
        },
      })

      return adjustment as unknown as IAdjustmentWithRelations
    } catch (error) {
      logger.error('Error al crear ajuste', { error, data, userId })
      throw error
    }
  }

  /**
   * Obtener ajuste por ID
   */
  async findById(
    id: string,
    includeItems: boolean = true
  ): Promise<IAdjustmentWithRelations> {
    try {
      const include: any = {
        warehouse: true,
      }
      if (includeItems) include.items = true

      const adjustment = await prisma.adjustment.findUnique({
        where: { id },
        include,
      })

      if (!adjustment) {
        throw new NotFoundError('Ajuste no encontrado')
      }

      return adjustment as unknown as IAdjustmentWithRelations
    } catch (error) {
      logger.error('Error al obtener ajuste', { error, id })
      throw error
    }
  }

  /**
   * Obtener todos los ajustes con filtros
   */
  async findAll(
    filters: IAdjustmentFilters = {},
    page: number = 1,
    limit: number = 20,
    sortBy: string = 'createdAt',
    sortOrder: 'asc' | 'desc' = 'desc',
    prismaClient?: any
  ): Promise<{
    items: IAdjustmentWithRelations[]
    total: number
    page: number
    limit: number
  }> {
    try {
      const { skip, take } = PaginationHelper.validateAndParse({ page, limit })

      const where: any = {}
      if (filters.warehouseId) where.warehouseId = filters.warehouseId
      if (filters.status) where.status = filters.status
      if (filters.reason)
        where.reason = { contains: filters.reason, mode: 'insensitive' }

      if (filters.createdFrom || filters.createdTo) {
        where.createdAt = {}
        if (filters.createdFrom) where.createdAt.gte = filters.createdFrom
        if (filters.createdTo) where.createdAt.lte = filters.createdTo
      }

      if (filters.approvedFrom || filters.approvedTo) {
        where.approvedAt = {}
        if (filters.approvedFrom) where.approvedAt.gte = filters.approvedFrom
        if (filters.approvedTo) where.approvedAt.lte = filters.approvedTo
      }

      const [total, adjustments] = await Promise.all([
        db.adjustment.count({ where }),
        db.adjustment.findMany({
          where,
          include: {
            items: true,
            warehouse: true,
          },
          skip,
          take,
          orderBy: { [sortBy]: sortOrder },
        }),
      ])

      return {
        items: adjustments as unknown as IAdjustmentWithRelations[],
        total,
        page,
        limit,
      }
    } catch (error) {
      logger.error('Error al obtener ajustes', { error, filters })
      throw error
    }
  }

  /**
   * Actualizar ajuste
   */
  async update(
    id: string,
    data: IUpdateAdjustmentInput
  ): Promise<IAdjustmentWithRelations> {
    try {
      const adjustment = await prisma.adjustment.findUnique({
        where: { id },
      })

      if (!adjustment) {
        throw new NotFoundError('Ajuste no encontrado')
      }

      if (adjustment.status !== AdjustmentStatus.DRAFT) {
        throw new BadRequestError(
          'Solo se pueden actualizar ajustes en estado DRAFT'
        )
      }

      const updateData: any = {}
      if (data.reason !== undefined) updateData.reason = data.reason
      if (data.notes !== undefined) updateData.notes = data.notes ?? null

      const updated = await prisma.adjustment.update({
        where: { id },
        data: updateData,
        include: {
          items: true,
          warehouse: true,
        },
      })

      logger.info(`Ajuste actualizado: ${id}`, { data })

      return updated as unknown as IAdjustmentWithRelations
    } catch (error) {
      logger.error('Error al actualizar ajuste', { error, id, data })
      throw error
    }
  }

  /**
   * Aprobar ajuste
   */
  async approve(
    id: string,
    approvedBy?: string
  ): Promise<IAdjustmentWithRelations> {
    try {
      const adjustment = await prisma.adjustment.findUnique({
        where: { id },
      })

      if (!adjustment) {
        throw new NotFoundError('Ajuste no encontrado')
      }

      if (adjustment.status !== AdjustmentStatus.DRAFT) {
        throw new BadRequestError(
          'Solo se pueden aprobar ajustes en estado DRAFT'
        )
      }

      const updated = await prisma.adjustment.update({
        where: { id },
        data: {
          status: AdjustmentStatus.APPROVED,
          approvedBy,
          approvedAt: new Date(),
        },
        include: {
          items: true,
          warehouse: true,
        },
      })

      logger.info(`Ajuste aprobado: ${id}`, { approvedBy })

      // Emit event
      const eventService = EventService.getInstance()
      await eventService.emit({
        type: EventType.ADJUSTMENT_APPROVED,
        entityId: updated.id,
        entityType: 'adjustment',
        userId: approvedBy || 'system',
      })

      return updated as unknown as IAdjustmentWithRelations
    } catch (error) {
      logger.error('Error al aprobar ajuste', { error, id, approvedBy })
      throw error
    }
  }

  /**
   * Aplicar ajuste al inventario
   */
  async apply(
    id: string,
    appliedBy?: string
  ): Promise<IAdjustmentWithRelations> {
    try {
      const adjustment = await prisma.adjustment.findUnique({
        where: { id },
        include: { items: true },
      })

      if (!adjustment) {
        throw new NotFoundError(INVENTORY_MESSAGES.adjustment.notFound)
      }

      if (adjustment.status !== AdjustmentStatus.APPROVED) {
        throw new BadRequestError(INVENTORY_MESSAGES.adjustment.invalidStatus)
      }

      if (adjustment.items.length === 0) {
        throw new BadRequestError('El ajuste no tiene items')
      }

      // Use transaction to ensure atomicity
      await prisma.$transaction(async (tx) => {
        // Aplicar cambios al stock y crear movimientos
        for (const item of adjustment.items) {
          const stock = await tx.stock.findUnique({
            where: {
              itemId_warehouseId: {
                itemId: item.itemId,
                warehouseId: adjustment.warehouseId,
              },
            },
          })

          if (!stock) {
            throw new NotFoundError(
              `Stock no encontrado para item ${item.itemId}`
            )
          }

          const newQuantity = stock.quantityReal + item.quantityChange

          if (newQuantity < 0) {
            throw new BadRequestError(
              `Cantidad insuficiente para item ${item.itemId}. Disponible: ${stock.quantityReal}, Cambio: ${item.quantityChange}`
            )
          }

          // Update stock
          await tx.stock.update({
            where: {
              itemId_warehouseId: {
                itemId: item.itemId,
                warehouseId: adjustment.warehouseId,
              },
            },
            data: {
              quantityReal: newQuantity,
              lastMovementAt: new Date(),
            },
          })

          // Create movement record for audit trail
          if (item.quantityChange !== 0) {
            const movementType =
              item.quantityChange > 0 ? 'ADJUSTMENT_IN' : 'ADJUSTMENT_OUT'
            await tx.movement.create({
              data: {
                id: uuidv4(),
                movementNumber: `MOV-ADJ-${uuidv4().substring(0, 8)}`,
                type: movementType as any,
                itemId: item.itemId,
                quantity: Math.abs(item.quantityChange),
                unitCost: item.unitCost || 0,
                totalCost: Math.abs(item.quantityChange) * (item.unitCost || 0),
                warehouseToId:
                  item.quantityChange > 0 ? adjustment.warehouseId : undefined,
                warehouseFromId:
                  item.quantityChange < 0 ? adjustment.warehouseId : undefined,
                reference: adjustment.adjustmentNumber,
                notes: `Ajuste: ${item.notes || adjustment.reason}`,
                createdBy: appliedBy || 'system',
              },
            })
          }
        }
      })

      const updated = await prisma.adjustment.update({
        where: { id },
        data: {
          status: AdjustmentStatus.APPLIED,
          appliedBy,
          appliedAt: new Date(),
        },
        include: {
          items: true,
          warehouse: true,
        },
      })

      logger.info(`Ajuste aplicado: ${id}`, { appliedBy })

      // Emit event
      const eventService = EventService.getInstance()
      await eventService.emit({
        type: EventType.ADJUSTMENT_APPLIED,
        entityId: updated.id,
        entityType: 'adjustment',
        userId: appliedBy || 'system',
      })

      return updated as unknown as IAdjustmentWithRelations
    } catch (error) {
      logger.error('Error al aplicar ajuste', { error, id, appliedBy })
      throw error
    }
  }

  /**
   * Rechazar ajuste
   */
  async reject(id: string, reason: string): Promise<IAdjustmentWithRelations> {
    try {
      const adjustment = await prisma.adjustment.findUnique({
        where: { id },
      })

      if (!adjustment) {
        throw new NotFoundError('Ajuste no encontrado')
      }

      if (adjustment.status !== AdjustmentStatus.DRAFT) {
        throw new BadRequestError(
          'Solo se pueden rechazar ajustes en estado DRAFT'
        )
      }

      const updated = await prisma.adjustment.update({
        where: { id },
        data: {
          status: AdjustmentStatus.REJECTED,
          notes: `Rechazado: ${reason}`,
        },
        include: {
          items: true,
          warehouse: true,
        },
      })

      logger.info(`Ajuste rechazado: ${id}`, { reason })

      // Emit event
      const eventService = EventService.getInstance()
      await eventService.emit({
        type: EventType.ADJUSTMENT_REJECTED,
        entityId: updated.id,
        entityType: 'adjustment',
        userId: 'system',
      })

      return updated as unknown as IAdjustmentWithRelations
    } catch (error) {
      logger.error('Error al rechazar ajuste', { error, id })
      throw error
    }
  }

  /**
   * Cancelar ajuste
   */
  async cancel(id: string): Promise<IAdjustmentWithRelations> {
    try {
      const adjustment = await prisma.adjustment.findUnique({
        where: { id },
      })

      if (!adjustment) {
        throw new NotFoundError('Ajuste no encontrado')
      }

      if (adjustment.status === AdjustmentStatus.APPLIED) {
        throw new BadRequestError(
          INVENTORY_MESSAGES.adjustment.cannotDeleteApplied
        )
      }

      const updated = await prisma.adjustment.update({
        where: { id },
        data: { status: AdjustmentStatus.CANCELLED },
        include: {
          items: true,
          warehouse: true,
        },
      })

      logger.info(`Ajuste cancelado: ${id}`)

      // Emit event
      const eventService = EventService.getInstance()
      await eventService.emit({
        type: EventType.ADJUSTMENT_CANCELLED,
        entityId: updated.id,
        entityType: 'adjustment',
        userId: 'system',
      })

      return updated as unknown as IAdjustmentWithRelations
    } catch (error) {
      logger.error('Error al cancelar ajuste', { error, id })
      throw error
    }
  }

  /**
   * Agregar item a ajuste
   */
  async addItem(
    adjustmentId: string,
    data: ICreateAdjustmentItemInput
  ): Promise<IAdjustmentItem> {
    try {
      const adjustment = await prisma.adjustment.findUnique({
        where: { id: adjustmentId },
      })

      if (!adjustment) {
        throw new NotFoundError('Ajuste no encontrado')
      }

      if (adjustment.status !== AdjustmentStatus.DRAFT) {
        throw new BadRequestError(
          'Solo se pueden agregar items a ajustes en estado DRAFT'
        )
      }

      // Validar que el item existe
      const item = await prisma.item.findUnique({
        where: { id: data.itemId },
      })

      if (!item) {
        throw new NotFoundError('Item no encontrado')
      }

      const adjustmentItem = await prisma.adjustmentItem.create({
        data: {
          adjustmentId,
          itemId: data.itemId,
          quantityChange: data.quantityChange,
          unitCost: data.unitCost ?? null,
          notes: data.notes ?? null,
        },
      })

      logger.info(`Item agregado a ajuste: ${adjustmentId}`, {
        itemId: data.itemId,
        quantityChange: data.quantityChange,
      })

      return adjustmentItem
    } catch (error) {
      logger.error('Error al agregar item a ajuste', {
        error,
        adjustmentId,
        data,
      })
      throw error
    }
  }

  /**
   * Obtener items de un ajuste
   */
  async getItems(adjustmentId: string): Promise<IAdjustmentItem[]> {
    try {
      const items = await prisma.adjustmentItem.findMany({
        where: { adjustmentId },
      })

      return items
    } catch (error) {
      logger.error('Error al obtener items de ajuste', { error, adjustmentId })
      throw error
    }
  }

  /**
   * Eliminar ajuste
   */
  async delete(id: string): Promise<any> {
    try {
      const adjustment = await prisma.adjustment.findUnique({
        where: { id },
        include: { items: true },
      })

      if (!adjustment) {
        throw new NotFoundError('Ajuste no encontrado')
      }

      if (adjustment.status !== AdjustmentStatus.DRAFT) {
        throw new BadRequestError(
          'Solo se pueden eliminar ajustes en estado DRAFT'
        )
      }

      // Eliminar items primero
      if (adjustment.items.length > 0) {
        await prisma.adjustmentItem.deleteMany({
          where: { adjustmentId: id },
        })
      }

      await prisma.adjustment.delete({ where: { id } })

      logger.info(`Ajuste eliminado: ${id}`)

      return { success: true, id }
    } catch (error) {
      logger.error('Error al eliminar ajuste', { error, id })
      throw error
    }
  }
}

export default new AdjustmentService()
