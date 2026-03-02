/**
 * Stock Events Handler
 * Listens for inventory stock changes and triggers related actions
 */

import { EventService } from '../../../shared/events/event.service'
import { EventType } from '../../../shared/types/event.types'
import prisma from '../../../../services/prisma.service'

const eventService = EventService.getInstance()

/**
 * Register stock event listeners
 */
export function registerStockEventHandlers(): void {
  // Handle batch creation - check initial stock
  eventService.on(EventType.BATCH_CREATED, async (data: any) => {
    try {
      const batch = await prisma.batch.findUnique({
        where: { id: data.batchId },
      })

      if (batch) {
        // Update or create stock entry with batch quantity
        await prisma.stock.update(
          {
            where: {
              itemId_warehouseId: {
                itemId: batch.itemId,
                warehouseId: data.warehouseId,
              },
            },
            data: {
              quantityReal: { increment: batch.currentQuantity },
              quantityAvailable: { increment: batch.currentQuantity },
              updatedAt: new Date(),
            },
          },
          {
            create: {
              itemId: batch.itemId,
              warehouseId: data.warehouseId,
              quantityReal: batch.currentQuantity,
              quantityAvailable: batch.currentQuantity,
              quantityReserved: 0,
              lastCountDate: new Date(),
              status: 'GOOD',
            },
          }
        )
      }
    } catch (error) {
      console.error('Error handling BATCH_CREATED event:', error)
    }
  })

  // Handle batch expiry - mark as unavailable
  eventService.on(EventType.BATCH_EXPIRED, async (data: any) => {
    try {
      const batch = await prisma.batch.findUnique({
        where: { id: data.batchId },
        include: { item: true },
      })

      if (batch) {
        // Deduct expired quantity from available stock
        await prisma.stock.update(
          {
            where: {
              itemId_warehouseId: {
                itemId: batch.itemId,
                warehouseId: data.warehouseId,
              },
            },
            data: {
              quantityAvailable: { decrement: batch.currentQuantity },
              updatedAt: new Date(),
            },
          },
          {
            create: {
              itemId: batch.itemId,
              warehouseId: data.warehouseId,
              quantityReal: 0,
              quantityAvailable: 0,
              quantityReserved: 0,
              lastCountDate: new Date(),
              status: 'EXPIRED',
            },
          }
        )

        // Create movement record
        await prisma.movement.create({
          data: {
            itemId: batch.itemId,
            warehouseId: data.warehouseId,
            movementType: 'WRITE_OFF',
            quantity: batch.currentQuantity,
            reference: `BATCH_EXPIRED:${batch.batchNumber}`,
            notes: `Batch expired on ${batch.expiryDate}`,
          },
        })
      }
    } catch (error) {
      console.error('Error handling BATCH_EXPIRED event:', error)
    }
  })

  // Handle serial number status change
  eventService.on(EventType.SERIAL_NUMBER_STATUS_CHANGED, async (data: any) => {
    try {
      const serial = await prisma.serialNumber.findUnique({
        where: { id: data.serialNumberId },
      })

      if (serial) {
        const { oldStatus, newStatus } = data

        // Track status transition in stock
        if (
          oldStatus === 'IN_STOCK' &&
          (newStatus === 'SOLD' || newStatus === 'LOANED')
        ) {
          // Decrement available quantity
          await prisma.stock.updateMany({
            where: {
              itemId: serial.itemId,
              warehouseId: serial.warehouseId,
            },
            data: {
              quantityAvailable: { decrement: 1 },
              updatedAt: new Date(),
            },
          })
        } else if (newStatus === 'IN_STOCK') {
          // Increment available quantity (e.g., when returned from warranty)
          await prisma.stock.updateMany({
            where: {
              itemId: serial.itemId,
              warehouseId: serial.warehouseId,
            },
            data: {
              quantityAvailable: { increment: 1 },
              updatedAt: new Date(),
            },
          })
        }
      }
    } catch (error) {
      console.error('Error handling SERIAL_NUMBER_STATUS_CHANGED event:', error)
    }
  })

  // Handle stock reservation
  eventService.on(EventType.RESERVATION_CREATED, async (data: any) => {
    try {
      // Update stock reserved quantity
      await prisma.stock.updateMany({
        where: {
          itemId: data.itemId,
          warehouseId: data.warehouseId,
        },
        data: {
          quantityReserved: { increment: data.quantity },
          quantityAvailable: { decrement: data.quantity },
          updatedAt: new Date(),
        },
      })
    } catch (error) {
      console.error('Error handling RESERVATION_CREATED event:', error)
    }
  })

  // Handle stock release (reservation cancelled)
  eventService.on(EventType.RESERVATION_CANCELLED, async (data: any) => {
    try {
      // Update stock - release reserved quantity
      await prisma.stock.updateMany({
        where: {
          itemId: data.itemId,
          warehouseId: data.warehouseId,
        },
        data: {
          quantityReserved: { decrement: data.quantity },
          quantityAvailable: { increment: data.quantity },
          updatedAt: new Date(),
        },
      })
    } catch (error) {
      console.error('Error handling RESERVATION_CANCELLED event:', error)
    }
  })

  // Handle exit note delivery - deduct from stock
  eventService.on(EventType.EXIT_NOTE_DELIVERED, async (data: any) => {
    try {
      // Stock movements are already handled in EXIT_NOTE service
      // This event is logged for tracking
      console.log(`Exit note ${data.exitNoteNumber} delivered - stock adjusted`)
    } catch (error) {
      console.error('Error handling EXIT_NOTE_DELIVERED event:', error)
    }
  })

  // Handle transfer received - increment destination stock
  eventService.on(EventType.TRANSFER_RECEIVED, async (data: any) => {
    try {
      // Stock movements are handled in TRANSFER service
      // This event is logged for tracking
      console.log(
        `Transfer ${data.transferId} received at ${data.toWarehouseId}`
      )
    } catch (error) {
      console.error('Error handling TRANSFER_RECEIVED event:', error)
    }
  })

  // Handle return processed - add back to stock
  eventService.on(EventType.RETURN_PROCESSED, async (data: any) => {
    try {
      // Stock movements are handled in RETURN service
      // This event is logged for tracking
      console.log(`Return ${data.returnId} processed - stock updated`)
    } catch (error) {
      console.error('Error handling RETURN_PROCESSED event:', error)
    }
  })
}

/**
 * Unregister stock event handlers
 */
export function unregisterStockEventHandlers(): void {
  eventService.removeAllListeners(EventType.BATCH_CREATED)
  eventService.removeAllListeners(EventType.BATCH_EXPIRED)
  eventService.removeAllListeners(EventType.SERIAL_NUMBER_STATUS_CHANGED)
  eventService.removeAllListeners(EventType.RESERVATION_CREATED)
  eventService.removeAllListeners(EventType.RESERVATION_CANCELLED)
  eventService.removeAllListeners(EventType.EXIT_NOTE_DELIVERED)
  eventService.removeAllListeners(EventType.TRANSFER_RECEIVED)
  eventService.removeAllListeners(EventType.RETURN_PROCESSED)
}

export default {
  registerStockEventHandlers,
  unregisterStockEventHandlers,
}
