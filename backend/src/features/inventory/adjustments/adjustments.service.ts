// backend/src/features/inventory/adjustments/adjustments.service.ts

import { PrismaClient, Prisma } from '../../../generated/prisma/client.js'
import { logger } from '../../../shared/utils/logger.js'
import {
  NotFoundError,
  BadRequestError,
} from '../../../shared/utils/apiError.js'
import { MovementNumberGenerator } from '../shared/utils/movementNumberGenerator.js'
import { PaginationHelper } from '../../../shared/utils/pagination.js'
import { INVENTORY_MESSAGES } from '../shared/constants/messages.js'
import { domainEventBus } from '../../../shared/events/domain-event-bus.js'
import { toDomainEvent } from '../../../shared/events/domain-events.js'
import { resolveUserNames } from '../../sales/shared/userNameResolver.js'
import {
  IAdjustmentWithRelations,
  IAdjustmentItem,
  ICreateAdjustmentInput,
  IUpdateAdjustmentInput,
  IAdjustmentFilters,
  ICreateAdjustmentItemInput,
  AdjustmentStatus,
} from './adjustments.interface.js'

type PrismaClientType = PrismaClient | Prisma.TransactionClient

const MSG = INVENTORY_MESSAGES.adjustment

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ADJUSTMENT_INCLUDE = {
  items: { include: { item: true } },
  warehouse: { select: { id: true, name: true, empresaId: true } },
} as const

function generateAdjustmentNumber(): string {
  return MovementNumberGenerator.generate('ADJ')
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

class AdjustmentService {
  private async publishAdjustmentEvent(input: {
    empresaId: string
    eventCode:
      | 'inventory.adjustment.created'
      | 'inventory.adjustment.approved'
      | 'inventory.adjustment.applied'
      | 'inventory.adjustment.rejected'
      | 'inventory.adjustment.cancelled'
    adjustment: {
      id: string
      adjustmentNumber: string
      status?: string
      warehouseId?: string
      reason?: string | null
    }
    userId?: string
    title: string
    message: string
    type: 'info' | 'success' | 'warning'
    priority: 'MEDIUM' | 'HIGH'
    severity: 'INFO' | 'SUCCESS' | 'WARNING'
    dedupSuffix?: string
    extraMetadata?: Record<string, unknown>
  }): Promise<void> {
    try {
      await domainEventBus.publish(
        toDomainEvent({
          empresaId: input.empresaId,
          eventCode: input.eventCode,
          module: 'inventory',
          title: input.title,
          message: input.message,
          type: input.type,
          entityType: 'ADJUSTMENT',
          entityId: input.adjustment.id,
          priority: input.priority,
          severity: input.severity,
          link: `/empresa/inventario`,
          source: 'inventory.adjustments',
          dedupKey: `${input.eventCode}:${input.adjustment.id}${input.dedupSuffix ? `:${input.dedupSuffix}` : ''}`,
          metadata: {
            adjustmentId: input.adjustment.id,
            adjustmentNumber: input.adjustment.adjustmentNumber,
            status: input.adjustment.status,
            warehouseId: input.adjustment.warehouseId,
            reason: input.adjustment.reason ?? null,
            ...(input.extraMetadata ?? {}),
          },
          createdById: input.userId ?? 'SYSTEM',
          createdByName: 'Sistema',
        })
      )
    } catch (publishError) {
      logger.error(`Error publicando evento ${input.eventCode}`, {
        adjustmentId: input.adjustment.id,
        empresaId: input.empresaId,
        error: publishError,
      })
    }
  }

  // -------------------------------------------------------------------------
  // READ
  // -------------------------------------------------------------------------

  async findById(
    id: string,
    empresaId: string,
    db: PrismaClientType
  ): Promise<IAdjustmentWithRelations> {
    const adjustment = await (db as PrismaClient).adjustment.findFirst({
      where: { id, warehouse: { empresaId } },
      include: ADJUSTMENT_INCLUDE,
    })
    if (!adjustment) throw new NotFoundError(MSG.notFound)

    const nameMap = await resolveUserNames(db, [
      adjustment.createdBy,
      adjustment.approvedBy,
      adjustment.appliedBy,
    ])
    return {
      ...adjustment,
      createdByName: nameMap.get(adjustment.createdBy) ?? null,
      approvedByName: adjustment.approvedBy ? (nameMap.get(adjustment.approvedBy) ?? null) : null,
      appliedByName: adjustment.appliedBy ? (nameMap.get(adjustment.appliedBy) ?? null) : null,
    } as unknown as IAdjustmentWithRelations
  }

  async findAll(
    filters: IAdjustmentFilters,
    page: number,
    limit: number,
    empresaId: string,
    sortBy: string = 'createdAt',
    sortOrder: 'asc' | 'desc' = 'desc',
    db: PrismaClientType
  ): Promise<{
    items: IAdjustmentWithRelations[]
    total: number
    page: number
    limit: number
  }> {
    const { skip, take } = PaginationHelper.validateAndParse({ page, limit })

    const SORT_WHITELIST = new Set([
      'createdAt',
      'updatedAt',
      'adjustmentNumber',
      'status',
      'appliedAt',
    ])
    const orderField = SORT_WHITELIST.has(sortBy) ? sortBy : 'createdAt'

    const where: Prisma.AdjustmentWhereInput = { warehouse: { empresaId } }
    if (filters.warehouseId) where.warehouseId = filters.warehouseId
    if (filters.status) where.status = filters.status
    if (filters.reason)
      where.reason = { contains: filters.reason, mode: 'insensitive' }
    if (filters.createdFrom || filters.createdTo) {
      where.createdAt = {}
      if (filters.createdFrom)
        (where.createdAt as Prisma.DateTimeFilter).gte = filters.createdFrom
      if (filters.createdTo)
        (where.createdAt as Prisma.DateTimeFilter).lte = filters.createdTo
    }
    if (filters.approvedFrom || filters.approvedTo) {
      where.approvedAt = {}
      if (filters.approvedFrom)
        (where.approvedAt as Prisma.DateTimeNullableFilter).gte =
          filters.approvedFrom
      if (filters.approvedTo)
        (where.approvedAt as Prisma.DateTimeNullableFilter).lte =
          filters.approvedTo
    }

    const [total, adjustments] = await Promise.all([
      (db as PrismaClient).adjustment.count({ where }),
      (db as PrismaClient).adjustment.findMany({
        where,
        include: ADJUSTMENT_INCLUDE,
        skip,
        take,
        orderBy: { [orderField]: sortOrder },
      }),
    ])

    const allUserIds = adjustments.flatMap((a) => [
      a.createdBy,
      a.approvedBy ?? null,
      a.appliedBy ?? null,
    ])
    const nameMap = await resolveUserNames(db, allUserIds)

    const enriched = adjustments.map((a) => ({
      ...a,
      createdByName: nameMap.get(a.createdBy) ?? null,
      approvedByName: a.approvedBy ? (nameMap.get(a.approvedBy) ?? null) : null,
      appliedByName: a.appliedBy ? (nameMap.get(a.appliedBy) ?? null) : null,
    }))

    return {
      items: enriched as unknown as IAdjustmentWithRelations[],
      total,
      page,
      limit,
    }
  }

  // -------------------------------------------------------------------------
  // CREATE
  // -------------------------------------------------------------------------

  async create(
    data: ICreateAdjustmentInput,
    empresaId: string,
    userId: string,
    db: PrismaClientType
  ): Promise<IAdjustmentWithRelations> {
    const warehouse = await (db as PrismaClient).warehouse.findFirst({
      where: { id: data.warehouseId, empresaId },
    })
    if (!warehouse)
      throw new NotFoundError(INVENTORY_MESSAGES.warehouse.notFound)

    const itemIds = data.items.map((i) => i.itemId)
    const existingItems = await (db as PrismaClient).item.findMany({
      where: { id: { in: itemIds }, empresaId },
      select: { id: true },
    })
    if (existingItems.length !== itemIds.length) {
      throw new BadRequestError(INVENTORY_MESSAGES.item.notFound)
    }

    const adjustment = await (db as PrismaClient).adjustment.create({
      data: {
        adjustmentNumber: generateAdjustmentNumber(),
        warehouseId: data.warehouseId,
        status: AdjustmentStatus.DRAFT,
        reason: data.reason,
        ...(data.notes != null ? { notes: data.notes } : {}),
        createdBy: userId,
        items: {
          create: data.items.map((item) => ({
            itemId: item.itemId,
            quantityChange: item.quantityChange,
            ...(item.unitCost != null ? { unitCost: item.unitCost } : {}),
            ...(item.notes != null ? { notes: item.notes } : {}),
          })),
        },
      },
      include: ADJUSTMENT_INCLUDE,
    })

    logger.info(`Ajuste creado: ${adjustment.adjustmentNumber}`, {
      empresaId,
      userId,
    })

    await this.publishAdjustmentEvent({
      empresaId,
      eventCode: 'inventory.adjustment.created',
      adjustment,
      userId,
      title: `Ajuste ${adjustment.adjustmentNumber} creado`,
      message: `Se creó el ajuste ${adjustment.adjustmentNumber}.`,
      type: 'info',
      priority: 'MEDIUM',
      severity: 'INFO',
    })

    return adjustment as unknown as IAdjustmentWithRelations
  }

  // -------------------------------------------------------------------------
  // UPDATE
  // -------------------------------------------------------------------------

  async update(
    id: string,
    data: IUpdateAdjustmentInput,
    empresaId: string,
    db: PrismaClientType
  ): Promise<IAdjustmentWithRelations> {
    const adjustment = await (db as PrismaClient).adjustment.findFirst({
      where: { id, warehouse: { empresaId } },
    })
    if (!adjustment) throw new NotFoundError(MSG.notFound)
    if (adjustment.status !== AdjustmentStatus.DRAFT) {
      throw new BadRequestError(MSG.invalidStatus)
    }

    const updateData: Record<string, unknown> = {}
    if (data.reason !== undefined) updateData.reason = data.reason
    if (data.notes !== undefined) updateData.notes = data.notes ?? null

    const updated = await (db as PrismaClient).adjustment.update({
      where: { id },
      data: updateData,
      include: ADJUSTMENT_INCLUDE,
    })

    logger.info(`Ajuste actualizado: ${id}`, { empresaId })
    return updated as unknown as IAdjustmentWithRelations
  }

  // -------------------------------------------------------------------------
  // LIFECYCLE TRANSITIONS
  // -------------------------------------------------------------------------

  async approve(
    id: string,
    empresaId: string,
    userId: string,
    db: PrismaClientType
  ): Promise<IAdjustmentWithRelations> {
    const adjustment = await (db as PrismaClient).adjustment.findFirst({
      where: { id, warehouse: { empresaId } },
    })
    if (!adjustment) throw new NotFoundError(MSG.notFound)
    if (adjustment.status !== AdjustmentStatus.DRAFT) {
      throw new BadRequestError(MSG.invalidStatus)
    }

    const updated = await (db as PrismaClient).adjustment.update({
      where: { id },
      data: {
        status: AdjustmentStatus.APPROVED,
        approvedBy: userId,
        approvedAt: new Date(),
      },
      include: ADJUSTMENT_INCLUDE,
    })

    logger.info(`Ajuste aprobado: ${id}`, { empresaId, userId })

    await this.publishAdjustmentEvent({
      empresaId,
      eventCode: 'inventory.adjustment.approved',
      adjustment: updated,
      userId,
      title: `Ajuste ${updated.adjustmentNumber} aprobado`,
      message: `El ajuste ${updated.adjustmentNumber} fue aprobado.`,
      type: 'success',
      priority: 'MEDIUM',
      severity: 'SUCCESS',
    })

    return updated as unknown as IAdjustmentWithRelations
  }

  /**
   * Aplica el ajuste al inventario.
   * Operación completamente atómica: stock + movements + status en una sola transacción.
   */
  async apply(
    id: string,
    empresaId: string,
    userId: string,
    db: PrismaClientType
  ): Promise<IAdjustmentWithRelations> {
    const adjustment = await (db as PrismaClient).adjustment.findFirst({
      where: { id, warehouse: { empresaId } },
      include: { items: true },
    })
    if (!adjustment) throw new NotFoundError(MSG.notFound)
    if (adjustment.status !== AdjustmentStatus.APPROVED) {
      throw new BadRequestError(MSG.invalidStatus)
    }
    if (adjustment.items.length === 0) {
      throw new BadRequestError(MSG.invalidStatus)
    }

    const updated = await (db as PrismaClient).$transaction(async (tx) => {
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
            `Stock no encontrado para ítem ${item.itemId}`
          )
        }

        const newQuantity = stock.quantityReal + item.quantityChange
        if (newQuantity < 0) {
          throw new BadRequestError(
            `Stock insuficiente para ítem ${item.itemId}. Disponible: ${stock.quantityReal}, Cambio: ${item.quantityChange}`
          )
        }

        await tx.stock.update({
          where: {
            itemId_warehouseId: {
              itemId: item.itemId,
              warehouseId: adjustment.warehouseId,
            },
          },
          data: {
            quantityReal: newQuantity,
            quantityAvailable: stock.quantityAvailable + item.quantityChange,
            lastMovementAt: new Date(),
          },
        })

        await tx.adjustmentItem.update({
          where: { id: item.id },
          data: {
            currentQuantity: stock.quantityReal,
            newQuantity,
          },
        })

        if (item.quantityChange !== 0) {
          const movementType =
            item.quantityChange > 0 ? 'ADJUSTMENT_IN' : 'ADJUSTMENT_OUT'
          const movementData: Record<string, unknown> = {
            movementNumber: MovementNumberGenerator.generate('MOV'),
            type: movementType,
            itemId: item.itemId,
            quantity: Math.abs(item.quantityChange),
            unitCost: item.unitCost ?? 0,
            totalCost:
              Math.abs(item.quantityChange) * Number(item.unitCost ?? 0),
            reference: adjustment.adjustmentNumber,
            notes: item.notes ?? adjustment.reason,
            createdBy: userId,
          }
          if (item.quantityChange > 0) {
            movementData.warehouseToId = adjustment.warehouseId
          } else {
            movementData.warehouseFromId = adjustment.warehouseId
          }

          await tx.movement.create({ data: movementData as never })
        }
      }

      return tx.adjustment.update({
        where: { id },
        data: {
          status: AdjustmentStatus.APPLIED,
          appliedBy: userId,
          appliedAt: new Date(),
        },
        include: ADJUSTMENT_INCLUDE,
      })
    })

    logger.info(`Ajuste aplicado: ${id}`, { empresaId, userId })

    await this.publishAdjustmentEvent({
      empresaId,
      eventCode: 'inventory.adjustment.applied',
      adjustment: updated,
      userId,
      title: `Ajuste ${updated.adjustmentNumber} aplicado`,
      message: `El ajuste ${updated.adjustmentNumber} fue aplicado.`,
      type: 'success',
      priority: 'MEDIUM',
      severity: 'SUCCESS',
    })

    return updated as unknown as IAdjustmentWithRelations
  }

  async reject(
    id: string,
    reason: string,
    empresaId: string,
    db: PrismaClientType
  ): Promise<IAdjustmentWithRelations> {
    const adjustment = await (db as PrismaClient).adjustment.findFirst({
      where: { id, warehouse: { empresaId } },
    })
    if (!adjustment) throw new NotFoundError(MSG.notFound)
    if (adjustment.status !== AdjustmentStatus.DRAFT) {
      throw new BadRequestError(MSG.invalidStatus)
    }

    const updated = await (db as PrismaClient).adjustment.update({
      where: { id },
      data: {
        status: AdjustmentStatus.REJECTED,
        notes: `Rechazado: ${reason}`,
      },
      include: ADJUSTMENT_INCLUDE,
    })

    logger.info(`Ajuste rechazado: ${id}`, { reason, empresaId })

    await this.publishAdjustmentEvent({
      empresaId,
      eventCode: 'inventory.adjustment.rejected',
      adjustment: updated,
      title: `Ajuste ${updated.adjustmentNumber} rechazado`,
      message: `El ajuste ${updated.adjustmentNumber} fue rechazado.`,
      type: 'warning',
      priority: 'HIGH',
      severity: 'WARNING',
      dedupSuffix: reason,
      extraMetadata: { rejectedReason: reason },
    })

    return updated as unknown as IAdjustmentWithRelations
  }

  async cancel(
    id: string,
    empresaId: string,
    db: PrismaClientType
  ): Promise<IAdjustmentWithRelations> {
    const adjustment = await (db as PrismaClient).adjustment.findFirst({
      where: { id, warehouse: { empresaId } },
    })
    if (!adjustment) throw new NotFoundError(MSG.notFound)
    if (adjustment.status === AdjustmentStatus.APPLIED) {
      throw new BadRequestError(MSG.cannotApplyAlreadyApplied)
    }
    if (adjustment.status === AdjustmentStatus.CANCELLED) {
      throw new BadRequestError(MSG.invalidStatus)
    }

    const updated = await (db as PrismaClient).adjustment.update({
      where: { id },
      data: { status: AdjustmentStatus.CANCELLED },
      include: ADJUSTMENT_INCLUDE,
    })

    logger.info(`Ajuste cancelado: ${id}`, { empresaId })

    await this.publishAdjustmentEvent({
      empresaId,
      eventCode: 'inventory.adjustment.cancelled',
      adjustment: updated,
      title: `Ajuste ${updated.adjustmentNumber} cancelado`,
      message: `El ajuste ${updated.adjustmentNumber} fue cancelado.`,
      type: 'warning',
      priority: 'HIGH',
      severity: 'WARNING',
    })

    return updated as unknown as IAdjustmentWithRelations
  }

  // -------------------------------------------------------------------------
  // ITEMS
  // -------------------------------------------------------------------------

  async addItem(
    adjustmentId: string,
    data: ICreateAdjustmentItemInput,
    empresaId: string,
    db: PrismaClientType
  ): Promise<IAdjustmentItem> {
    const adjustment = await (db as PrismaClient).adjustment.findFirst({
      where: { id: adjustmentId, warehouse: { empresaId } },
    })
    if (!adjustment) throw new NotFoundError(MSG.notFound)
    if (adjustment.status !== AdjustmentStatus.DRAFT) {
      throw new BadRequestError(MSG.invalidStatus)
    }

    const item = await (db as PrismaClient).item.findFirst({
      where: { id: data.itemId, empresaId },
    })
    if (!item) throw new NotFoundError(INVENTORY_MESSAGES.item.notFound)

    const adjustmentItem = await (db as PrismaClient).adjustmentItem.create({
      data: {
        adjustmentId,
        itemId: data.itemId,
        quantityChange: data.quantityChange,
        ...(data.unitCost != null ? { unitCost: data.unitCost } : {}),
        ...(data.notes != null ? { notes: data.notes } : {}),
      },
    })

    logger.info(`Ítem agregado a ajuste: ${adjustmentId}`, {
      itemId: data.itemId,
    })
    return adjustmentItem as unknown as IAdjustmentItem
  }

  async getItems(
    adjustmentId: string,
    empresaId: string,
    db: PrismaClientType
  ): Promise<IAdjustmentItem[]> {
    const adjustment = await (db as PrismaClient).adjustment.findFirst({
      where: { id: adjustmentId, warehouse: { empresaId } },
      select: { id: true },
    })
    if (!adjustment) throw new NotFoundError(MSG.notFound)

    const items = await (db as PrismaClient).adjustmentItem.findMany({
      where: { adjustmentId },
      include: { item: true },
    })
    return items as unknown as IAdjustmentItem[]
  }

  // -------------------------------------------------------------------------
  // DELETE
  // -------------------------------------------------------------------------

  async delete(
    id: string,
    empresaId: string,
    db: PrismaClientType
  ): Promise<void> {
    const adjustment = await (db as PrismaClient).adjustment.findFirst({
      where: { id, warehouse: { empresaId } },
    })
    if (!adjustment) throw new NotFoundError(MSG.notFound)
    if (adjustment.status !== AdjustmentStatus.DRAFT) {
      throw new BadRequestError(MSG.invalidStatus)
    }

    await (db as PrismaClient).adjustment.delete({ where: { id } })
    logger.info(`Ajuste eliminado: ${id}`, { empresaId })
  }
}

export default new AdjustmentService()
