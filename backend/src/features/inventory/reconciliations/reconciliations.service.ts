// backend/src/features/inventory/reconciliations/reconciliations.service.ts

import prisma from '../../../services/prisma.service'
import {
  IReconciliationWithRelations,
  IReconciliationItem,
  ICreateReconciliationInput,
  IUpdateReconciliationInput,
  IReconciliationFilters,
  ReconciliationStatus,
} from './reconciliations.interface'
import {
  NotFoundError,
  ConflictError,
  BadRequestError,
} from '../../../shared/utils/ApiError'
import { PaginationHelper } from '../../../shared/utils/pagination'
import { logger } from '../../../shared/utils/logger'
import { INVENTORY_MESSAGES } from '../shared/constants/messages'
import EventService from '../shared/events/event.service'
import { EventType } from '../shared/events/event.types'
import { v4 as uuidv4 } from 'uuid'

export class ReconciliationService {
  /**
   * Crear nueva reconciliación
   */
  async create(
    data: ICreateReconciliationInput,
    userId: string
  ): Promise<IReconciliationWithRelations> {
    try {
      // Verificar que el almacén existe
      const warehouse = await prisma.warehouse.findUnique({
        where: { id: data.warehouseId },
      })
      if (!warehouse) {
        throw new NotFoundError('Almacén no encontrado')
      }

      // Verificar que los items existen
      const itemIds = data.items.map((item) => item.itemId)
      const items = await prisma.item.findMany({
        where: { id: { in: itemIds } },
      })
      if (items.length !== itemIds.length) {
        throw new NotFoundError('Uno o más artículos no encontrados')
      }

      // Generar número único de reconciliación
      const reconciliationCount = await prisma.reconciliation.count()
      const reconciliationNumber = `RC-${new Date().getFullYear()}-${String(reconciliationCount + 1).padStart(5, '0')}`

      // Crear reconciliación con items
      const reconciliation = await prisma.reconciliation.create({
        data: {
          reconciliationNumber,
          warehouseId: data.warehouseId,
          status: ReconciliationStatus.DRAFT,
          source: data.source,
          reason: data.reason,
          notes: data.notes ?? null,
          createdBy: userId,
          items: {
            create: data.items.map((item) => ({
              itemId: item.itemId,
              systemQuantity: item.systemQuantity,
              expectedQuantity: item.expectedQuantity,
              difference: item.expectedQuantity - item.systemQuantity,
              notes: item.notes ?? null,
            })),
          },
        },
        include: {
          warehouse: true,
          items: true,
        },
      })

      logger.info(`Reconciliación creada: ${reconciliation.id}`, {
        reconciliationNumber: reconciliation.reconciliationNumber,
        warehouseId: reconciliation.warehouseId,
      })

      // Emit event
      const eventService = EventService.getInstance()
      await eventService.emit({
        type: EventType.RECONCILIATION_CREATED,
        entityId: reconciliation.id,
        entityType: 'reconciliation',
        userId,
        data: {
          reconciliationNumber: reconciliation.reconciliationNumber,
          itemsCount: data.items.length,
        },
      })

      return reconciliation as unknown as IReconciliationWithRelations
    } catch (error) {
      logger.error('Error al crear reconciliación', { error, data, userId })
      throw error
    }
  }

  /**
   * Obtener reconciliación por ID
   */
  async findById(
    id: string,
    includeItems = true
  ): Promise<IReconciliationWithRelations> {
    try {
      const reconciliation = await prisma.reconciliation.findUnique({
        where: { id },
        include: {
          warehouse: true,
          items: includeItems,
        },
      })

      if (!reconciliation) {
        throw new NotFoundError('Reconciliación no encontrada')
      }

      return reconciliation as unknown as IReconciliationWithRelations
    } catch (error) {
      logger.error('Error al obtener reconciliación', { error, id })
      throw error
    }
  }

  /**
   * Obtener todas las reconciliaciones con paginación y filtros
   */
  async findAll(
    filters: IReconciliationFilters,
    page: string | number,
    limit: string | number,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    prismaClient?: any
  ): Promise<{ data: IReconciliationWithRelations[]; total: number }> {
    try {
      const { page: pageNum, limit: limitNum } =
        PaginationHelper.validateAndParse({
          page: Number(page),
          limit: Number(limit),
        })

      const where: any = {}
      if (filters.warehouseId) where.warehouseId = filters.warehouseId
      if (filters.status) where.status = filters.status
      if (filters.source) where.source = filters.source
      if (filters.reason)
        where.reason = { contains: filters.reason, mode: 'insensitive' }
      if (filters.startDateFrom || filters.startDateTo) {
        where.startedAt = {}
        if (filters.startDateFrom) where.startedAt.gte = filters.startDateFrom
        if (filters.startDateTo) where.startedAt.lte = filters.startDateTo
      }
      if (filters.completedDateFrom || filters.completedDateTo) {
        where.completedAt = {}
        if (filters.completedDateFrom)
          where.completedAt.gte = filters.completedDateFrom
        if (filters.completedDateTo)
          where.completedAt.lte = filters.completedDateTo
      }

      const [reconciliations, total] = await Promise.all([
        prisma.reconciliation.findMany({
          where,
          include: { warehouse: true, items: true },
          skip: (pageNum - 1) * limitNum,
          take: limitNum,
          orderBy: { [sortBy]: (sortOrder as string).toLowerCase() },
        }),
        db.reconciliation.count({ where }),
      ])

      return {
        data: reconciliations as unknown as IReconciliationWithRelations[],
        total,
      }
    } catch (error) {
      logger.error('Error al obtener reconciliaciones', { error, filters })
      throw error
    }
  }

  /**
   * Actualizar reconciliación (solo en estado DRAFT)
   */
  async update(
    id: string,
    data: IUpdateReconciliationInput
  ): Promise<IReconciliationWithRelations> {
    try {
      const reconciliation = await prisma.reconciliation.findUnique({
        where: { id },
      })

      if (!reconciliation) {
        throw new NotFoundError('Reconciliación no encontrada')
      }

      if (reconciliation.status !== ReconciliationStatus.DRAFT) {
        throw new BadRequestError(
          'Solo se pueden actualizar reconciliaciones en estado DRAFT'
        )
      }

      const updateData = {
        ...(data.reason !== undefined && { reason: data.reason }),
        ...(data.notes !== undefined && { notes: data.notes }),
        ...(data.remarks !== undefined && { remarks: data.remarks }),
      }

      const updated = await prisma.reconciliation.update({
        where: { id },
        data: updateData,
        include: {
          warehouse: true,
          items: true,
        },
      })

      logger.info(`Reconciliación actualizada: ${id}`, {
        status: updated.status,
      })

      return updated as unknown as IReconciliationWithRelations
    } catch (error) {
      logger.error('Error al actualizar reconciliación', { error, id })
      throw error
    }
  }

  /**
   * Iniciar reconciliación (DRAFT → IN_PROGRESS)
   */
  async start(
    id: string,
    startedBy: string
  ): Promise<IReconciliationWithRelations> {
    try {
      const reconciliation = await prisma.reconciliation.findUnique({
        where: { id },
      })

      if (!reconciliation) {
        throw new NotFoundError('Reconciliación no encontrada')
      }

      if (reconciliation.status !== ReconciliationStatus.DRAFT) {
        throw new BadRequestError(
          `No se puede iniciar una reconciliación en estado ${reconciliation.status}. Debe estar en DRAFT.`
        )
      }

      const updated = await prisma.reconciliation.update({
        where: { id },
        data: {
          status: ReconciliationStatus.IN_PROGRESS,
          startedBy,
          startedAt: new Date(),
        },
        include: {
          warehouse: true,
          items: true,
        },
      })

      logger.info(`Reconciliación iniciada: ${id}`, { startedBy })

      return updated as unknown as IReconciliationWithRelations
    } catch (error) {
      logger.error('Error al iniciar reconciliación', { error, id, startedBy })
      throw error
    }
  }

  /**
   * Completar reconciliación (IN_PROGRESS → APPROVED)
   */
  async complete(
    id: string,
    completedBy: string
  ): Promise<IReconciliationWithRelations> {
    try {
      const reconciliation = await prisma.reconciliation.findUnique({
        where: { id },
      })

      if (!reconciliation) {
        throw new NotFoundError('Reconciliación no encontrada')
      }

      if (reconciliation.status !== ReconciliationStatus.IN_PROGRESS) {
        throw new BadRequestError(
          `No se puede completar una reconciliación en estado ${reconciliation.status}. Debe estar en IN_PROGRESS.`
        )
      }

      const updated = await prisma.reconciliation.update({
        where: { id },
        data: {
          status: ReconciliationStatus.APPROVED,
          completedBy,
          completedAt: new Date(),
        },
        include: {
          warehouse: true,
          items: true,
        },
      })

      logger.info(`Reconciliación completada: ${id}`, { completedBy })

      return updated as unknown as IReconciliationWithRelations
    } catch (error) {
      logger.error('Error al completar reconciliación', {
        error,
        id,
        completedBy,
      })
      throw error
    }
  }

  /**
   * Aprobar reconciliación (APPROVED → APPLIED)
   */
  async approve(
    id: string,
    approvedBy: string
  ): Promise<IReconciliationWithRelations> {
    try {
      const reconciliation = await prisma.reconciliation.findUnique({
        where: { id },
      })

      if (!reconciliation) {
        throw new NotFoundError('Reconciliación no encontrada')
      }

      if (reconciliation.status !== ReconciliationStatus.APPROVED) {
        throw new BadRequestError(
          `No se puede aprobar una reconciliación en estado ${reconciliation.status}. Debe estar en APPROVED.`
        )
      }

      const updated = await prisma.reconciliation.update({
        where: { id },
        data: {
          approvedBy,
          approvedAt: new Date(),
        },
        include: {
          warehouse: true,
          items: true,
        },
      })

      logger.info(`Reconciliación aprobada: ${id}`, { approvedBy })

      // Emit event
      const eventService = EventService.getInstance()
      await eventService.emit({
        type: EventType.RECONCILIATION_APPROVED,
        entityId: updated.id,
        entityType: 'reconciliation',
        userId: approvedBy,
      })

      return updated as unknown as IReconciliationWithRelations
    } catch (error) {
      logger.error('Error al aprobar reconciliación', { error, id, approvedBy })
      throw error
    }
  }

  /**
   * Aplicar reconciliación (APPROVED → APPLIED, actualizar stock)
   */
  async apply(
    id: string,
    appliedBy: string
  ): Promise<IReconciliationWithRelations> {
    try {
      const reconciliation = await prisma.reconciliation.findUnique({
        where: { id },
        include: { items: true },
      })

      if (!reconciliation) {
        throw new NotFoundError('Reconciliación no encontrada')
      }

      if (reconciliation.status !== ReconciliationStatus.APPROVED) {
        throw new BadRequestError(
          `No se puede aplicar una reconciliación en estado ${reconciliation.status}. Debe estar en APPROVED.`
        )
      }

      // Use transaction to ensure atomicity
      await prisma.$transaction(async (tx) => {
        // Aplicar cambios al stock según diferencia
        for (const item of reconciliation.items) {
          const stock = await tx.stock.findUnique({
            where: {
              itemId_warehouseId: {
                itemId: item.itemId,
                warehouseId: reconciliation.warehouseId,
              },
            },
          })

          if (!stock) {
            throw new NotFoundError(
              `Stock no encontrado para item ${item.itemId}`
            )
          }

          // La diferencia ya está calculada: expectedQuantity - systemQuantity
          // Si es positivo, hay que agregar. Si es negativo, hay que restar
          const newQuantity = stock.quantityReal + item.difference

          if (newQuantity < 0) {
            throw new BadRequestError(
              `Cantidad insuficiente para item ${item.itemId}. Sistema: ${stock.quantityReal}, Esperado: ${item.expectedQuantity}, Nueva cantidad: ${newQuantity}`
            )
          }

          // Actualizar stock
          await tx.stock.update({
            where: {
              itemId_warehouseId: {
                itemId: item.itemId,
                warehouseId: reconciliation.warehouseId,
              },
            },
            data: {
              quantityReal: newQuantity,
              lastMovementAt: new Date(),
            },
          })

          // Create movement record for audit trail if difference != 0
          if (item.difference !== 0) {
            const movementType =
              item.difference > 0 ? 'ADJUSTMENT_IN' : 'ADJUSTMENT_OUT'
            await tx.movement.create({
              data: {
                id: uuidv4(),
                movementNumber: `MOV-REC-${uuidv4().substring(0, 8)}`,
                type: movementType as any,
                itemId: item.itemId,
                quantity: Math.abs(item.difference),
                unitCost: 0,
                totalCost: 0,
                warehouseToId:
                  item.difference > 0 ? reconciliation.warehouseId : undefined,
                warehouseFromId:
                  item.difference < 0 ? reconciliation.warehouseId : undefined,
                reference: reconciliation.reconciliationNumber,
                notes: `Reconciliación: ${reconciliation.source || 'otra'}`,
                createdBy: appliedBy || 'system',
              },
            })
          }
        }
      })

      const updated = await prisma.reconciliation.update({
        where: { id },
        data: {
          status: ReconciliationStatus.APPLIED,
          appliedBy,
          appliedAt: new Date(),
        },
        include: {
          warehouse: true,
          items: true,
        },
      })

      logger.info(`Reconciliación aplicada: ${id}`, { appliedBy })

      // Emit event
      const eventService = EventService.getInstance()
      await eventService.emit({
        type: EventType.RECONCILIATION_APPLIED,
        entityId: updated.id,
        entityType: 'reconciliation',
        userId: appliedBy,
      })

      return updated as unknown as IReconciliationWithRelations
    } catch (error) {
      logger.error('Error al aplicar reconciliación', { error, id, appliedBy })
      throw error
    }
  }

  /**
   * Rechazar reconciliación
   */
  async reject(
    id: string,
    reason: string
  ): Promise<IReconciliationWithRelations> {
    try {
      const reconciliation = await prisma.reconciliation.findUnique({
        where: { id },
      })

      if (!reconciliation) {
        throw new NotFoundError('Reconciliación no encontrada')
      }

      const updated = await prisma.reconciliation.update({
        where: { id },
        data: {
          status: ReconciliationStatus.REJECTED,
          remarks: reason,
        },
        include: {
          warehouse: true,
          items: true,
        },
      })

      logger.info(`Reconciliación rechazada: ${id}`, { reason })

      // Emit event
      const eventService = EventService.getInstance()
      await eventService.emit({
        type: EventType.RECONCILIATION_REJECTED,
        entityId: updated.id,
        entityType: 'reconciliation',
        userId: 'system',
      })

      return updated as unknown as IReconciliationWithRelations
    } catch (error) {
      logger.error('Error al rechazar reconciliación', { error, id })
      throw error
    }
  }

  /**
   * Cancelar reconciliación
   */
  async cancel(id: string): Promise<IReconciliationWithRelations> {
    try {
      const reconciliation = await prisma.reconciliation.findUnique({
        where: { id },
      })

      if (!reconciliation) {
        throw new NotFoundError('Reconciliación no encontrada')
      }

      // No se pueden cancelar reconciliaciones ya aplicadas
      if (reconciliation.status === ReconciliationStatus.APPLIED) {
        throw new BadRequestError(
          'No se puede cancelar una reconciliación que ya ha sido aplicada'
        )
      }

      const updated = await prisma.reconciliation.update({
        where: { id },
        data: {
          status: ReconciliationStatus.CANCELLED,
        },
        include: {
          warehouse: true,
          items: true,
        },
      })

      logger.info(`Reconciliación cancelada: ${id}`)

      // Emit event
      const eventService = EventService.getInstance()
      await eventService.emit({
        type: EventType.RECONCILIATION_REJECTED, // No CANCELLED event for reconciliation, use REJECTED
        entityId: updated.id,
        entityType: 'reconciliation',
        userId: 'system',
      })

      return updated as unknown as IReconciliationWithRelations
    } catch (error) {
      logger.error('Error al cancelar reconciliación', { error, id })
      throw error
    }
  }

  /**
   * Agregar item a la reconciliación después de creación
   */
  async addItem(
    id: string,
    item: {
      itemId: string
      systemQuantity: number
      expectedQuantity: number
      notes?: string | null
    }
  ): Promise<IReconciliationItem> {
    try {
      const reconciliation = await prisma.reconciliation.findUnique({
        where: { id },
      })

      if (!reconciliation) {
        throw new NotFoundError('Reconciliación no encontrada')
      }

      if (reconciliation.status !== ReconciliationStatus.DRAFT) {
        throw new BadRequestError(
          'Solo se pueden agregar items a reconciliaciones en estado DRAFT'
        )
      }

      // Verificar que el item existe
      const existingItem = await prisma.item.findUnique({
        where: { id: item.itemId },
      })
      if (!existingItem) {
        throw new NotFoundError('Artículo no encontrado')
      }

      const difference = item.expectedQuantity - item.systemQuantity

      const reconciliationItem = await prisma.reconciliationItem.create({
        data: {
          reconciliationId: id,
          itemId: item.itemId,
          systemQuantity: item.systemQuantity,
          expectedQuantity: item.expectedQuantity,
          difference,
          notes: item.notes ?? null,
        },
      })

      logger.info(`Item agregado a la reconciliación: ${id}`, {
        itemId: item.itemId,
      })

      return reconciliationItem as unknown as IReconciliationItem
    } catch (error) {
      logger.error('Error al agregar item a la reconciliación', {
        error,
        reconciliationId: id,
      })
      throw error
    }
  }

  /**
   * Obtener items de la reconciliación
   */
  async getItems(id: string): Promise<IReconciliationItem[]> {
    try {
      const reconciliation = await prisma.reconciliation.findUnique({
        where: { id },
      })

      if (!reconciliation) {
        throw new NotFoundError('Reconciliación no encontrada')
      }

      const items = await prisma.reconciliationItem.findMany({
        where: { reconciliationId: id },
        orderBy: { createdAt: 'asc' },
      })

      return items as unknown as IReconciliationItem[]
    } catch (error) {
      logger.error('Error al obtener items de la reconciliación', {
        error,
        reconciliationId: id,
      })
      throw error
    }
  }

  /**
   * Eliminar reconciliación (solo DRAFT)
   */
  async delete(id: string): Promise<void> {
    try {
      const reconciliation = await prisma.reconciliation.findUnique({
        where: { id },
      })

      if (!reconciliation) {
        throw new NotFoundError('Reconciliación no encontrada')
      }

      if (reconciliation.status !== ReconciliationStatus.DRAFT) {
        throw new BadRequestError(
          'Solo se pueden eliminar reconciliaciones en estado DRAFT'
        )
      }

      await prisma.reconciliationItem.deleteMany({
        where: { reconciliationId: id },
      })

      await prisma.reconciliation.delete({ where: { id } })

      logger.info(`Reconciliación eliminada: ${id}`)
    } catch (error) {
      logger.error('Error al eliminar reconciliación', { error, id })
      throw error
    }
  }
}

export const ReconciliationServiceInstance = new ReconciliationService()
