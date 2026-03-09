/**
 * Movement Events Handler
 * Listens for inventory movement changes and triggers auditing and reporting
 */

import { EventService } from '../../../shared/events/event.service'
import { EventType } from '../../../shared/types/event.types'
import prisma from '../../../../services/prisma.service'

const eventService = EventService.getInstance()

/**
 * Register movement event listeners
 */
export function registerMovementEventHandlers(): void {
  // Transfer movements are now handled by ExitNote (deliver) and EntryNote (complete)
  // Transfer events are logged for auditing only
  eventService.on(EventType.TRANSFER_CREATED, async (data: any) => {
    console.log(`Transfer ${data.transferNumber} created`)
  })

  // Handle return movements
  eventService.on(EventType.RETURN_CREATED, async (data: any) => {
    try {
      console.log(`Return ${data.returnNumber} created as ${data.returnType}`)

      // Movements are created when return is processed, not when created
    } catch (error) {
      console.error('Error handling RETURN_CREATED event:', error)
    }
  })

  eventService.on(EventType.RETURN_PROCESSED, async (data: any) => {
    try {
      // Create RETURN_IN movements for each item
      for (const item of data.items || []) {
        await prisma.movement.create({
          data: {
            itemId: item.itemId,
            warehouseId: data.toWarehouseId,
            movementType: 'RETURN_IN',
            quantity: item.quantity,
            reference: data.returnNumber,
            notes: `Return processed - ${data.returnType}`,
            status: 'COMPLETED',
          },
        })
      }

      console.log(`Return ${data.returnNumber} processed - movements created`)
    } catch (error) {
      console.error('Error handling RETURN_PROCESSED event:', error)
    }
  })

  // Handle exit note movements
  eventService.on(EventType.EXIT_NOTE_CREATED, async (data: any) => {
    try {
      console.log(
        `Exit note ${data.exitNoteNumber} created as type ${data.type}`
      )
    } catch (error) {
      console.error('Error handling EXIT_NOTE_CREATED event:', error)
    }
  })

  eventService.on(EventType.EXIT_NOTE_DELIVERED, async (data: any) => {
    try {
      // Movement creation is handled in exit note service
      console.log(
        `Exit note ${data.exitNoteNumber} delivered - movements logged`
      )
    } catch (error) {
      console.error('Error handling EXIT_NOTE_DELIVERED event:', error)
    }
  })

  // Handle purchase order receipt
  eventService.on(EventType.PURCHASE_ORDER_RECEIVED, async (data: any) => {
    try {
      // Create PURCHASE_IN movement
      for (const item of data.items || []) {
        await prisma.movement.create({
          data: {
            itemId: item.itemId,
            warehouseId: data.toWarehouseId,
            movementType: 'PURCHASE_IN',
            quantity: item.quantity,
            reference: data.poNumber,
            notes: `Purchase order received`,
            status: 'COMPLETED',
          },
        })
      }

      console.log(`PO ${data.poNumber} received - movements created`)
    } catch (error) {
      console.error('Error handling PURCHASE_ORDER_RECEIVED event:', error)
    }
  })

  // Handle adjustments
  eventService.on(EventType.ADJUSTMENT_CREATED, async (data: any) => {
    try {
      const movementType =
        data.adjustmentType === 'INCREASE' ? 'ADJUSTMENT_IN' : 'ADJUSTMENT_OUT'
      const quantity =
        data.adjustmentType === 'INCREASE' ? data.quantity : -data.quantity

      await prisma.movement.create({
        data: {
          itemId: data.itemId,
          warehouseId: data.warehouseId,
          movementType,
          quantity,
          reference: data.adjustmentNumber,
          notes: data.reason || 'Inventory adjustment',
          status: 'COMPLETED',
        },
      })

      console.log(
        `Adjustment ${data.adjustmentNumber} recorded - ${movementType}`
      )
    } catch (error) {
      console.error('Error handling ADJUSTMENT_CREATED event:', error)
    }
  })
}

/**
 * Unregister movement event handlers
 */
export function unregisterMovementEventHandlers(): void {
  eventService.removeAllListeners(EventType.TRANSFER_CREATED)
  eventService.removeAllListeners(EventType.RETURN_CREATED)
  eventService.removeAllListeners(EventType.RETURN_PROCESSED)
  eventService.removeAllListeners(EventType.EXIT_NOTE_CREATED)
  eventService.removeAllListeners(EventType.EXIT_NOTE_DELIVERED)
  eventService.removeAllListeners(EventType.PURCHASE_ORDER_RECEIVED)
  eventService.removeAllListeners(EventType.ADJUSTMENT_CREATED)
}

export default {
  registerMovementEventHandlers,
  unregisterMovementEventHandlers,
}
