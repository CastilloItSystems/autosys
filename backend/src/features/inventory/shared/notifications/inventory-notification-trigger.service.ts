import prisma from '../../../../services/prisma.service.js'
import { domainEventBus } from '../../../../shared/events/domain-event-bus.js'
import { toDomainEvent } from '../../../../shared/events/domain-events.js'
import { ExitNoteType } from '../../exitNotes/exitNotes.interface.js'
import { MovementType } from '../../movements/movements.interface.js'

interface NotifyExitNoteCreatedInput {
  empresaId: string
  exitNoteId: string
  exitNoteNumber: string
  exitNoteType: ExitNoteType | string
  warehouseId: string
  totalItems: number
  actorUserId?: string
}

interface NotifyLowStockAfterExitNoteReserveInput {
  empresaId: string
  exitNoteId: string
  exitNoteNumber: string
  warehouseId: string
  itemIds: string[]
  actorUserId?: string
}

interface NotifyLowStockAfterMovementInput {
  empresaId: string
  movementId: string
  movementNumber: string
  movementType: MovementType | string
  warehouseId: string
  itemId: string
  actorUserId?: string
}

class InventoryNotificationTriggerService {
  private async resolveActorName(actorUserId?: string): Promise<string | undefined> {
    if (!actorUserId) return undefined

    const actor = await prisma.user.findUnique({
      where: { id: actorUserId },
      select: { nombre: true },
    })

    if (typeof actor?.nombre === 'string' && actor.nombre.trim()) {
      return actor.nombre.trim()
    }

    return undefined
  }

  async notifyExitNoteCreated(input: NotifyExitNoteCreatedInput): Promise<void> {
    const createdByName = (await this.resolveActorName(input.actorUserId)) ?? 'Sistema'
    const encodedSearch = encodeURIComponent(input.exitNoteNumber)

    await domainEventBus.publish(
      toDomainEvent({
        empresaId: input.empresaId,
        eventCode: 'inventory.exit_note.created',
        module: 'inventory',
        title: `Nueva nota de salida ${input.exitNoteNumber}`,
        message: `Se creó la nota ${input.exitNoteNumber} (${input.exitNoteType}) con ${input.totalItems} item(s).`,
        type: 'info',
        entityType: 'EXIT_NOTE',
        entityId: input.exitNoteId,
        priority: 'MEDIUM',
        severity: 'INFO',
        link: `/empresa/inventario/notas-salida?search=${encodedSearch}`,
        source: 'inventory.exit_note',
        dedupKey: `inventory.exit_note.created:${input.exitNoteId}`,
        metadata: {
          exitNoteId: input.exitNoteId,
          exitNoteNumber: input.exitNoteNumber,
          exitNoteType: input.exitNoteType,
          warehouseId: input.warehouseId,
          totalItems: input.totalItems,
        },
        createdById: input.actorUserId ?? 'SYSTEM',
        createdByName,
      })
    )
  }

  async notifyLowStockAfterExitNoteReserve(
    input: NotifyLowStockAfterExitNoteReserveInput
  ): Promise<void> {
    await this.notifyLowStockForItems({
      empresaId: input.empresaId,
      warehouseId: input.warehouseId,
      itemIds: input.itemIds,
      actorUserId: input.actorUserId,
      source: {
        type: 'EXIT_NOTE_RESERVE',
        entityType: 'EXIT_NOTE',
        entityId: input.exitNoteId,
        reference: input.exitNoteNumber,
        link: `/empresa/inventario/notas-salida?search=${encodeURIComponent(
          input.exitNoteNumber
        )}`,
      },
    })
  }

  async notifyLowStockAfterMovement(
    input: NotifyLowStockAfterMovementInput
  ): Promise<void> {
    await this.notifyLowStockForItems({
      empresaId: input.empresaId,
      warehouseId: input.warehouseId,
      itemIds: [input.itemId],
      actorUserId: input.actorUserId,
      source: {
        type: 'MOVEMENT_OUT',
        entityType: 'MOVEMENT',
        entityId: input.movementId,
        reference: input.movementNumber,
        movementType: input.movementType,
        link: '/empresa/inventario/stock/low-stock',
      },
    })
  }

  private async notifyLowStockForItems(input: {
    empresaId: string
    warehouseId: string
    itemIds: string[]
    actorUserId?: string
    source: {
      type: 'EXIT_NOTE_RESERVE' | 'MOVEMENT_OUT'
      entityType: string
      entityId: string
      reference: string
      movementType?: MovementType | string
      link: string
    }
  }): Promise<void> {
    const uniqueItemIds = Array.from(
      new Set(
        input.itemIds
          .filter((itemId) => typeof itemId === 'string')
          .map((itemId) => itemId.trim())
          .filter(Boolean)
      )
    )
    if (uniqueItemIds.length === 0) return

    const stocks = await prisma.stock.findMany({
      where: {
        warehouseId: input.warehouseId,
        itemId: { in: uniqueItemIds },
      },
      include: {
        item: {
          select: {
            id: true,
            name: true,
            sku: true,
            minStock: true,
          },
        },
      },
    })

    if (stocks.length === 0) return

    const createdByName = (await this.resolveActorName(input.actorUserId)) ?? 'Sistema'

    for (const stock of stocks) {
      const minStock = typeof stock.item?.minStock === 'number' ? stock.item.minStock : 10
      const currentQuantity =
        typeof stock.quantityAvailable === 'number' ? stock.quantityAvailable : 0

      if (currentQuantity > minStock) continue

      const itemLabel =
        (typeof stock.item?.name === 'string' && stock.item.name) ||
        (typeof stock.item?.sku === 'string' && stock.item.sku) ||
        stock.itemId

      const isCritical = currentQuantity <= Math.max(0, Math.floor(minStock * 0.2))
      const eventCode = isCritical ? 'inventory.stock.critical' : 'inventory.stock.low'
      const priority = isCritical ? 'CRITICAL' : 'HIGH'
      const severity = isCritical ? 'ERROR' : 'WARNING'
      const type = isCritical ? 'error' : 'warning'

      await domainEventBus.publish(
        toDomainEvent({
          empresaId: input.empresaId,
          eventCode,
          module: 'inventory',
          title: isCritical ? 'Alerta de stock crítico' : 'Alerta de stock bajo',
          message: `El articulo ${itemLabel} quedo en ${currentQuantity} (minimo ${minStock}).`,
          type,
          entityType: 'ITEM',
          entityId: stock.itemId,
          priority,
          severity,
          link: input.source.link,
          source: `inventory.${input.source.type.toLowerCase()}`,
          dedupKey: `${eventCode}:${input.warehouseId}:${stock.itemId}`,
          metadata: {
            sourceType: input.source.type,
            sourceEntityType: input.source.entityType,
            sourceEntityId: input.source.entityId,
            sourceReference: input.source.reference,
            movementType: input.source.movementType,
            itemId: stock.itemId,
            itemName: stock.item?.name,
            itemSku: stock.item?.sku,
            warehouseId: input.warehouseId,
            currentQuantity,
            threshold: minStock,
          },
          createdById: input.actorUserId ?? 'SYSTEM',
          createdByName,
        })
      )
    }
  }
}

export default new InventoryNotificationTriggerService()
