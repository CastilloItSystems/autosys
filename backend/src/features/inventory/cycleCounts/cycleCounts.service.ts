// backend/src/features/inventory/cycleCounts/cycleCounts.service.ts

import prisma from '../../../services/prisma.service.js'
import {
  ICycleCountWithRelations,
  ICycleCountItem,
  ICreateCycleCountInput,
  IUpdateCycleCountInput,
  ICycleCountFilters,
  CycleCountStatus,
} from './cycleCounts.interface.js'
import {
  NotFoundError,
  ConflictError,
  BadRequestError,
  ForbiddenError,
} from '../../../shared/utils/apiError.js'
import { PaginationHelper } from '../../../shared/utils/pagination.js'
import { logger } from '../../../shared/utils/logger.js'
import { INVENTORY_MESSAGES } from '../shared/constants/messages.js'
import EventService from '../shared/events/event.service.js'
import { EventType } from '../shared/events/event.types.js'
import { v4 as uuidv4 } from 'uuid'

export class CycleCountService {
  /**
   * Crear nuevo ciclo de conteo
   */
  async create(
    data: ICreateCycleCountInput,
    userId: string
  ): Promise<ICycleCountWithRelations> {
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

      // Generar número único de ciclo de conteo
      const cycleCountCount = await prisma.cycleCount.count()
      const cycleCountNumber = `CC-${new Date().getFullYear()}-${String(cycleCountCount + 1).padStart(5, '0')}`

      // Crear ciclo de conteo con items
      const cycleCount = await prisma.cycleCount.create({
        data: {
          cycleCountNumber,
          warehouseId: data.warehouseId,
          status: CycleCountStatus.DRAFT,
          notes: data.notes ?? null,
          createdBy: userId,
          items: {
            create: data.items.map((item) => ({
              itemId: item.itemId,
              expectedQuantity: item.expectedQuantity,
              location: item.location ?? null,
              notes: item.notes ?? null,
            })),
          },
        },
        include: {
          warehouse: true,
          items: true,
        },
      })

      logger.info(`Ciclo de conteo creado: ${cycleCount.id}`, {
        cycleCountNumber: cycleCount.cycleCountNumber,
        warehouseId: cycleCount.warehouseId,
      })

      // Emit event
      const eventService = EventService.getInstance()
      await eventService.emit({
        type: EventType.CYCLE_COUNT_CREATED,
        entityId: cycleCount.id,
        entityType: 'cycleCount',
        userId,
        data: {
          cycleCountNumber: cycleCount.cycleCountNumber,
          itemsCount: data.items.length,
        },
      })

      return cycleCount as unknown as ICycleCountWithRelations
    } catch (error) {
      logger.error('Error al crear ciclo de conteo', { error, data, userId })
      throw error
    }
  }

  /**
   * Obtener ciclo de conteo por ID
   */
  async findById(
    id: string,
    includeItems = true
  ): Promise<ICycleCountWithRelations> {
    try {
      const cycleCount = await prisma.cycleCount.findUnique({
        where: { id },
        include: {
          warehouse: true,
          items: includeItems
            ? {
                include: {
                  item: true,
                },
              }
            : false,
        },
      })

      if (!cycleCount) {
        throw new NotFoundError('Ciclo de conteo no encontrado')
      }

      return cycleCount as unknown as ICycleCountWithRelations
    } catch (error) {
      logger.error('Error al obtener ciclo de conteo', { error, id })
      throw error
    }
  }

  /**
   * Obtener todos los ciclos de conteo con paginación y filtros
   */
  async findAll(
    filters: ICycleCountFilters,
    page: string | number,
    limit: string | number,
    sortBy = 'createdAt',
    sortOrder = 'DESC'
  ): Promise<{ data: ICycleCountWithRelations[]; total: number }> {
    try {
      const { page: pageNum, limit: limitNum } =
        PaginationHelper.validateAndParse({
          page: Number(page),
          limit: Number(limit),
        })

      const where: any = {}
      if (filters.warehouseId) where.warehouseId = filters.warehouseId
      if (filters.status) where.status = filters.status
      if (filters.notes)
        where.notes = { contains: filters.notes, mode: 'insensitive' }
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

      const [cycleCounts, total] = await Promise.all([
        prisma.cycleCount.findMany({
          where,
          include: {
            warehouse: true,
            items: {
              include: {
                item: true,
              },
            },
          },
          skip: (pageNum - 1) * limitNum,
          take: limitNum,
          orderBy: { [sortBy]: (sortOrder as string).toLowerCase() },
        }),
        prisma.cycleCount.count({ where }),
      ])

      return {
        data: cycleCounts as unknown as ICycleCountWithRelations[],
        total,
      }
    } catch (error) {
      logger.error('Error al obtener ciclos de conteo', { error, filters })
      throw error
    }
  }

  /**
   * Actualizar ciclo de conteo (solo en estado DRAFT)
   */
  async update(
    id: string,
    data: IUpdateCycleCountInput
  ): Promise<ICycleCountWithRelations> {
    try {
      const cycleCount = await prisma.cycleCount.findUnique({
        where: { id },
      })

      if (!cycleCount) {
        throw new NotFoundError('Ciclo de conteo no encontrado')
      }

      if (cycleCount.status !== CycleCountStatus.DRAFT) {
        throw new BadRequestError(
          'Solo se pueden actualizar ciclos en estado DRAFT'
        )
      }

      const updateData: any = {
        ...(data.notes !== undefined && { notes: data.notes }),
        ...(data.remarks !== undefined && { remarks: data.remarks }),
      }

      if (data.items) {
        updateData.items = {
          deleteMany: {},
          create: data.items.map((item) => ({
            itemId: item.itemId,
            expectedQuantity: item.expectedQuantity,
            location: item.location ?? null,
            notes: item.notes ?? null,
          })),
        }
      }

      const updated = await prisma.cycleCount.update({
        where: { id },
        data: updateData,
        include: {
          warehouse: true,
          items: true,
        },
      })

      logger.info(`Ciclo de conteo actualizado: ${id}`, {
        status: updated.status,
      })

      return updated as unknown as ICycleCountWithRelations
    } catch (error) {
      logger.error('Error al actualizar ciclo de conteo', { error, id })
      throw error
    }
  }

  /**
   * Iniciar ciclo de conteo (DRAFT → IN_PROGRESS)
   */
  async start(
    id: string,
    startedBy: string
  ): Promise<ICycleCountWithRelations> {
    try {
      const cycleCount = await prisma.cycleCount.findUnique({
        where: { id },
      })

      if (!cycleCount) {
        throw new NotFoundError('Ciclo de conteo no encontrado')
      }

      if (cycleCount.status !== CycleCountStatus.DRAFT) {
        throw new BadRequestError(
          `No se puede iniciar un ciclo en estado ${cycleCount.status}. Debe estar en DRAFT.`
        )
      }

      const updated = await prisma.cycleCount.update({
        where: { id },
        data: {
          status: CycleCountStatus.IN_PROGRESS,
          startedBy,
          startedAt: new Date(),
        },
        include: {
          warehouse: true,
          items: true,
        },
      })

      logger.info(`Ciclo de conteo iniciado: ${id}`, { startedBy })

      // Emit event
      const eventService = EventService.getInstance()
      await eventService.emit({
        type: EventType.CYCLE_COUNT_CREATED, // Using CREATED as "started"
        entityId: updated.id,
        entityType: 'cycleCount',
        data: {},
        userId: startedBy,
      })

      return updated as unknown as ICycleCountWithRelations
    } catch (error) {
      logger.error('Error al iniciar ciclo de conteo', { error, id, startedBy })
      throw error
    }
  }

  /**
   * Completar ciclo de conteo (IN_PROGRESS → APPROVED)
   */
  async complete(
    id: string,
    completedBy: string
  ): Promise<ICycleCountWithRelations> {
    try {
      const cycleCount = await prisma.cycleCount.findUnique({
        where: { id },
        include: { items: true },
      })

      if (!cycleCount) {
        throw new NotFoundError('Ciclo de conteo no encontrado')
      }

      if (cycleCount.status !== CycleCountStatus.IN_PROGRESS) {
        throw new BadRequestError(
          `No se puede completar un ciclo en estado ${cycleCount.status}. Debe estar en IN_PROGRESS.`
        )
      }

      // Verificar que todos los items tienen cantidad contada
      const itemsWithoutCounted = cycleCount.items.filter(
        (item) => item.countedQuantity === null
      )
      if (itemsWithoutCounted.length > 0) {
        throw new BadRequestError(
          `No se pueden completar todos los items. ${itemsWithoutCounted.length} items aún no tienen cantidad contada.`
        )
      }

      const updated = await prisma.cycleCount.update({
        where: { id },
        data: {
          status: CycleCountStatus.APPROVED,
          completedBy,
          completedAt: new Date(),
        },
        include: {
          warehouse: true,
          items: true,
        },
      })

      logger.info(`Ciclo de conteo completado: ${id}`, { completedBy })

      // Emit event
      const eventService = EventService.getInstance()
      await eventService.emit({
        type: EventType.CYCLE_COUNT_COMPLETED,
        entityId: updated.id,
        entityType: 'cycleCount',
        data: {},
        userId: completedBy,
      })

      return updated as unknown as ICycleCountWithRelations
    } catch (error) {
      logger.error('Error al completar ciclo de conteo', {
        error,
        id,
        completedBy,
      })
      throw error
    }
  }

  /**
   * Aprobar ciclo de conteo (APPROVED → APPLIED)
   */
  async approve(
    id: string,
    approvedBy: string
  ): Promise<ICycleCountWithRelations> {
    try {
      const cycleCount = await prisma.cycleCount.findUnique({
        where: { id },
        include: { items: true },
      })

      if (!cycleCount) {
        throw new NotFoundError('Ciclo de conteo no encontrado')
      }

      if (cycleCount.status !== CycleCountStatus.APPROVED) {
        throw new BadRequestError(
          `No se puede aprobar un ciclo en estado ${cycleCount.status}. Debe estar en APPROVED.`
        )
      }

      // ─── CONTROL DE CALIDAD: Varianza Alta ─────────────────────────────
      const HIGH_VARIANCE_THRESHOLD = 5
      const hasHighVariance = cycleCount.items.some((item) => {
        const diff = Math.abs(
          (item.countedQuantity ?? 0) - item.expectedQuantity
        )
        return diff > HIGH_VARIANCE_THRESHOLD
      })

      if (hasHighVariance) {
        const approver = await prisma.user.findUnique({
          where: { id: approvedBy },
        })

        if (!approver) {
          throw new NotFoundError('Usuario aprobador no encontrado')
        }

        const allowedRoles = ['SUPER_ADMIN', 'ADMIN', 'GERENTE']
        // @ts-ignore: rol is likely an enum string
        if (!allowedRoles.includes(approver.rol)) {
          throw new ForbiddenError(
            `Se requiere rol de supervisor (ADMIN/GERENTE) para aprobar conteos con varianza > ${HIGH_VARIANCE_THRESHOLD} unidades.`
          )
        }
      }
      // ─────────────────────────────────────────────────────────────────

      const updated = await prisma.cycleCount.update({
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

      logger.info(`Ciclo de conteo aprobado: ${id}`, { approvedBy })

      // Emit event
      const eventService = EventService.getInstance()
      await eventService.emit({
        type: EventType.CYCLE_COUNT_APPROVED,
        entityId: updated.id,
        entityType: 'cycleCount',
        data: {},
        userId: approvedBy,
      })

      return updated as unknown as ICycleCountWithRelations
    } catch (error) {
      logger.error('Error al aprobar ciclo de conteo', {
        error,
        id,
        approvedBy,
      })
      throw error
    }
  }

  /**
   * Aplicar ciclo de conteo (APPROVED → APPLIED, actualizar stock)
   */
  async apply(
    id: string,
    appliedBy: string
  ): Promise<ICycleCountWithRelations> {
    try {
      const cycleCount = await prisma.cycleCount.findUnique({
        where: { id },
        include: { items: true },
      })

      if (!cycleCount) {
        throw new NotFoundError('Ciclo de conteo no encontrado')
      }

      if (cycleCount.status !== CycleCountStatus.APPROVED) {
        throw new BadRequestError(
          `No se puede aplicar un ciclo en estado ${cycleCount.status}. Debe estar en APPROVED.`
        )
      }

      // Use transaction to ensure atomicity
      await prisma.$transaction(async (tx) => {
        // Aplicar cambios al stock según varianza
        for (const item of cycleCount.items) {
          if (item.countedQuantity === null) {
            throw new BadRequestError(
              `Item ${item.itemId} no tiene cantidad contada`
            )
          }

          const stock = await tx.stock.findUnique({
            where: {
              itemId_warehouseId: {
                itemId: item.itemId,
                warehouseId: cycleCount.warehouseId,
              },
            },
          })

          if (!stock) {
            throw new NotFoundError(
              `Stock no encontrado para item ${item.itemId}`
            )
          }

          // Calcular ajuste necesario para igualar el stock contado
          // El objetivo es que stock.quantityReal sea igual a item.countedQuantity
          const adjustmentQuantity =
            (item.countedQuantity ?? 0) - stock.quantityReal
          const variance = (item.countedQuantity ?? 0) - item.expectedQuantity
          const newQuantity = stock.quantityReal + adjustmentQuantity

          if (newQuantity < 0) {
            throw new BadRequestError(
              `Cantidad insuficiente para item ${item.itemId}. Sistema: ${stock.quantityReal}, Conteo: ${item.countedQuantity}, Nueva cantidad: ${newQuantity}`
            )
          }

          // Actualizar stock
          await tx.stock.update({
            where: {
              itemId_warehouseId: {
                itemId: item.itemId,
                warehouseId: cycleCount.warehouseId,
              },
            },
            data: {
              quantityReal: newQuantity,
              lastMovementAt: new Date(),
            },
          })

          // Create movement record for audit trail if adjustmentQuantity != 0 OR variance != 0
          if (adjustmentQuantity !== 0 || variance !== 0) {
            const movementType =
              adjustmentQuantity >= 0 ? 'ADJUSTMENT_IN' : 'ADJUSTMENT_OUT'

            const adjustmentNote =
              adjustmentQuantity !== 0
                ? `Ajuste: ${adjustmentQuantity}`
                : `Ajuste: 0 (Varianza detectada: ${variance})`

            await tx.movement.create({
              data: {
                id: uuidv4(),
                movementNumber: `MOV-CC-${uuidv4().substring(0, 8)}`,
                type: movementType as any,
                itemId: item.itemId,
                quantity: Math.abs(adjustmentQuantity),
                unitCost: 0,
                totalCost: 0,
                warehouseToId:
                  adjustmentQuantity >= 0 ? cycleCount.warehouseId : undefined,
                warehouseFromId:
                  adjustmentQuantity < 0 ? cycleCount.warehouseId : undefined,
                reference: cycleCount.cycleCountNumber,
                notes: `Conteo Cíclico: ${item.location || 'sin ubicación'} (${adjustmentNote})`,
                createdBy: appliedBy || 'system',
                snapshotQuantity: item.expectedQuantity,
                variance: variance,
              },
            })
          }

          // Actualizar varianza en el item del ciclo
          await tx.cycleCountItem.update({
            where: { id: item.id },
            data: {
              variance,
            },
          })
        }
      })

      const updated = await prisma.cycleCount.update({
        where: { id },
        data: {
          status: CycleCountStatus.APPLIED,
          appliedBy,
          appliedAt: new Date(),
        },
        include: {
          warehouse: true,
          items: true,
        },
      })

      logger.info(`Ciclo de conteo aplicado: ${id}`, { appliedBy })

      // Emit event
      const eventService = EventService.getInstance()
      await eventService.emit({
        type: EventType.CYCLE_COUNT_APPLIED,
        entityId: updated.id,
        entityType: 'cycleCount',
        data: {},
        userId: appliedBy,
      })

      return updated as unknown as ICycleCountWithRelations
    } catch (error) {
      logger.error('Error al aplicar ciclo de conteo', { error, id, appliedBy })
      throw error
    }
  }

  /**
   * Rechazar ciclo de conteo
   */
  async reject(id: string, reason: string): Promise<ICycleCountWithRelations> {
    try {
      const cycleCount = await prisma.cycleCount.findUnique({
        where: { id },
      })

      if (!cycleCount) {
        throw new NotFoundError('Ciclo de conteo no encontrado')
      }

      const updated = await prisma.cycleCount.update({
        where: { id },
        data: {
          status: CycleCountStatus.REJECTED,
          remarks: reason,
        },
        include: {
          warehouse: true,
          items: true,
        },
      })

      logger.info(`Ciclo de conteo rechazado: ${id}`, { reason })

      // Emit event
      const eventService = EventService.getInstance()
      await eventService.emit({
        type: EventType.CYCLE_COUNT_REJECTED,
        entityId: updated.id,
        entityType: 'cycleCount',
        data: {},
        userId: 'system',
      })

      return updated as unknown as ICycleCountWithRelations
    } catch (error) {
      logger.error('Error al rechazar ciclo de conteo', { error, id })
      throw error
    }
  }

  /**
   * Cancelar ciclo de conteo
   */
  async cancel(id: string): Promise<ICycleCountWithRelations> {
    try {
      const cycleCount = await prisma.cycleCount.findUnique({
        where: { id },
      })

      if (!cycleCount) {
        throw new NotFoundError('Ciclo de conteo no encontrado')
      }

      // No se pueden cancelar ciclos ya aplicados
      if (cycleCount.status === CycleCountStatus.APPLIED) {
        throw new BadRequestError(
          'No se puede cancelar un ciclo que ya ha sido aplicado'
        )
      }

      const updated = await prisma.cycleCount.update({
        where: { id },
        data: {
          status: CycleCountStatus.CANCELLED,
        },
        include: {
          warehouse: true,
          items: true,
        },
      })

      logger.info(`Ciclo de conteo cancelado: ${id}`)

      // Emit event
      const eventService = EventService.getInstance()
      await eventService.emit({
        type: EventType.CYCLE_COUNT_REJECTED, // No CANCELLED event defined, use REJECTED
        entityId: updated.id,
        entityType: 'cycleCount',
        data: {},
        userId: 'system',
      })

      return updated as unknown as ICycleCountWithRelations
    } catch (error) {
      logger.error('Error al cancelar ciclo de conteo', { error, id })
      throw error
    }
  }

  /**
   * Agregar item al ciclo después de creación
   */
  async addItem(
    id: string,
    item: {
      itemId: string
      expectedQuantity: number
      location?: string | null
      notes?: string | null
    }
  ): Promise<ICycleCountItem> {
    try {
      const cycleCount = await prisma.cycleCount.findUnique({
        where: { id },
      })

      if (!cycleCount) {
        throw new NotFoundError('Ciclo de conteo no encontrado')
      }

      if (cycleCount.status !== CycleCountStatus.DRAFT) {
        throw new BadRequestError(
          'Solo se pueden agregar items a ciclos en estado DRAFT'
        )
      }

      // Verificar que el item existe
      const existingItem = await prisma.item.findUnique({
        where: { id: item.itemId },
      })
      if (!existingItem) {
        throw new NotFoundError('Artículo no encontrado')
      }

      const cycleCountItem = await prisma.cycleCountItem.create({
        data: {
          cycleCountId: id,
          itemId: item.itemId,
          expectedQuantity: item.expectedQuantity,
          location: item.location ?? null,
          notes: item.notes ?? null,
        },
      })

      logger.info(`Item agregado al ciclo de conteo: ${id}`, {
        itemId: item.itemId,
      })

      return cycleCountItem as unknown as ICycleCountItem
    } catch (error) {
      logger.error('Error al agregar item al ciclo de conteo', {
        error,
        cycleCountId: id,
      })
      throw error
    }
  }

  /**
   * Obtener items del ciclo de conteo
   */
  async getItems(id: string): Promise<ICycleCountItem[]> {
    try {
      const cycleCount = await prisma.cycleCount.findUnique({
        where: { id },
      })

      if (!cycleCount) {
        throw new NotFoundError('Ciclo de conteo no encontrado')
      }

      const items = await prisma.cycleCountItem.findMany({
        where: { cycleCountId: id },
        orderBy: { createdAt: 'asc' },
      })

      return items as unknown as ICycleCountItem[]
    } catch (error) {
      logger.error('Error al obtener items del ciclo de conteo', {
        error,
        cycleCountId: id,
      })
      throw error
    }
  }

  /**
   * Actualizar cantidad contada de un item
   */
  async updateItemCountedQuantity(
    cycleCountId: string,
    itemId: string,
    countedQuantity: number
  ): Promise<ICycleCountItem> {
    try {
      const cycleCount = await prisma.cycleCount.findUnique({
        where: { id: cycleCountId },
      })

      if (!cycleCount) {
        throw new NotFoundError('Ciclo de conteo no encontrado')
      }

      const item = await prisma.cycleCountItem.findFirst({
        where: {
          cycleCountId,
          itemId,
        },
      })

      if (!item) {
        throw new NotFoundError('Item no encontrado en este ciclo de conteo')
      }

      const updated = await prisma.cycleCountItem.update({
        where: { id: item.id },
        data: {
          countedQuantity,
        },
      })

      logger.info(`Cantidad contada actualizada: ${cycleCountId}/${itemId}`, {
        countedQuantity,
      })

      return updated as unknown as ICycleCountItem
    } catch (error) {
      logger.error('Error al actualizar cantidad contada', {
        error,
        cycleCountId,
        itemId,
      })
      throw error
    }
  }

  /**
   * Eliminar ciclo de conteo (solo DRAFT)
   */
  async delete(id: string): Promise<void> {
    try {
      const cycleCount = await prisma.cycleCount.findUnique({
        where: { id },
      })

      if (!cycleCount) {
        throw new NotFoundError('Ciclo de conteo no encontrado')
      }

      if (cycleCount.status !== CycleCountStatus.DRAFT) {
        throw new BadRequestError(
          'Solo se pueden eliminar ciclos en estado DRAFT'
        )
      }

      await prisma.cycleCountItem.deleteMany({
        where: { cycleCountId: id },
      })

      await prisma.cycleCount.delete({ where: { id } })

      logger.info(`Ciclo de conteo eliminado: ${id}`)
    } catch (error) {
      logger.error('Error al eliminar ciclo de conteo', { error, id })
      throw error
    }
  }
}

export const CycleCountServiceInstance = new CycleCountService()
