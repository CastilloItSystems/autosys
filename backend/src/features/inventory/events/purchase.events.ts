/**
 * Purchase Order Events Handler
 * Listens for purchase order events and triggers related actions
 */

import { EventService } from '../../../shared/events/event.service.js'
import { EventType } from '../../../shared/types/event.types.js'
import prisma from '../../../../services/prisma.service.js'

const eventService = EventService.getInstance()

/**
 * Register purchase order event listeners
 */
export function registerPurchaseEventHandlers(): void {
  // Handle PO creation
  eventService.on(EventType.PURCHASE_ORDER_CREATED, async (data: any) => {
    try {
      console.log(`Purchase Order ${data.poNumber} created`)
      // No stock impact yet - waiting for receipt
    } catch (error) {
      console.error('Error handling PURCHASE_ORDER_CREATED event:', error)
    }
  })

  // Handle PO approved
  eventService.on(EventType.PURCHASE_ORDER_APPROVED, async (data: any) => {
    try {
      console.log(`PO ${data.poNumber} approved - vendor notified`)
    } catch (error) {
      console.error('Error handling PURCHASE_ORDER_APPROVED event:', error)
    }
  })

  // Handle PO partial receipt
  eventService.on(
    EventType.PURCHASE_ORDER_PARTIAL_RECEIPT,
    async (data: any) => {
      try {
        // Create movements for received items
        for (const item of data.items || []) {
          await prisma.stock.updateMany({
            where: {
              itemId: item.itemId,
              warehouseId: data.warehouseId,
            },
            data: {
              quantityReal: { increment: item.quantityReceived },
              quantityAvailable: { increment: item.quantityReceived },
              updatedAt: new Date(),
            },
          })

          // Create movement record
          await prisma.movement.create({
            data: {
              itemId: item.itemId,
              warehouseId: data.warehouseId,
              movementType: 'PURCHASE_IN',
              quantity: item.quantityReceived,
              reference: data.poNumber,
              notes: `Partial receipt: ${item.quantityReceived}/${item.quantityOrdered} units`,
              status: 'COMPLETED',
            },
          })
        }

        console.log(
          `PO ${data.poNumber} partial receipt recorded - stock updated`
        )
      } catch (error) {
        console.error(
          'Error handling PURCHASE_ORDER_PARTIAL_RECEIPT event:',
          error
        )
      }
    }
  )

  // Handle PO complete receipt
  eventService.on(EventType.PURCHASE_ORDER_RECEIVED, async (data: any) => {
    try {
      // Create movements for all items
      for (const item of data.items || []) {
        await prisma.stock.updateMany({
          where: {
            itemId: item.itemId,
            warehouseId: data.warehouseId,
          },
          data: {
            quantityReal: { increment: item.quantity },
            quantityAvailable: { increment: item.quantity },
            updatedAt: new Date(),
          },
        })

        // Create movement record
        await prisma.movement.create({
          data: {
            itemId: item.itemId,
            warehouseId: data.warehouseId,
            movementType: 'PURCHASE_IN',
            quantity: item.quantity,
            reference: data.poNumber,
            notes: `Complete receipt: ${item.quantity} units`,
            status: 'COMPLETED',
          },
        })
      }

      console.log(`PO ${data.poNumber} complete receipt - order closed`)
    } catch (error) {
      console.error('Error handling PURCHASE_ORDER_RECEIVED event:', error)
    }
  })

  // Handle PO cancellation - clean up reservations
  eventService.on(EventType.PURCHASE_ORDER_CANCELLED, async (data: any) => {
    try {
      // Release any reserved quantities
      for (const item of data.items || []) {
        await prisma.stock.updateMany({
          where: {
            itemId: item.itemId,
          },
          data: {
            quantityReserved: { decrement: Math.max(0, item.quantity) },
            updatedAt: new Date(),
          },
        })
      }

      console.log(`PO ${data.poNumber} cancelled - reservations released`)
    } catch (error) {
      console.error('Error handling PURCHASE_ORDER_CANCELLED event:', error)
    }
  })

  // Handle invoice reception
  eventService.on(EventType.PURCHASE_INVOICE_RECEIVED, async (data: any) => {
    try {
      console.log(`Invoice for PO ${data.poNumber} received - payment pending`)
    } catch (error) {
      console.error('Error handling PURCHASE_INVOICE_RECEIVED event:', error)
    }
  })

  // Handle invoice payment
  eventService.on(EventType.PURCHASE_INVOICE_PAID, async (data: any) => {
    try {
      console.log(`Invoice for PO ${data.poNumber} paid - order complete`)
    } catch (error) {
      console.error('Error handling PURCHASE_INVOICE_PAID event:', error)
    }
  })

  // Handle quality control rejection
  eventService.on(EventType.PURCHASE_QC_REJECTION, async (data: any) => {
    try {
      // Deduct rejected items from stock
      await prisma.stock.updateMany({
        where: {
          itemId: data.itemId,
          warehouseId: data.warehouseId,
        },
        data: {
          quantityReal: { decrement: data.quantity },
          quantityAvailable: { decrement: data.quantity },
          updatedAt: new Date(),
        },
      })

      // Create write-off movement
      await prisma.movement.create({
        data: {
          itemId: data.itemId,
          warehouseId: data.warehouseId,
          movementType: 'WRITE_OFF',
          quantity: -data.quantity,
          reference: data.poNumber,
          notes: `QC Rejection - ${data.reason || 'Quality issues'}`,
          status: 'COMPLETED',
        },
      })

      console.log(
        `QC rejection recorded - ${data.quantity} units removed from stock`
      )
    } catch (error) {
      console.error('Error handling PURCHASE_QC_REJECTION event:', error)
    }
  })

  // Handle delivery confirmation
  eventService.on(EventType.PURCHASE_DELIVERY_CONFIRMED, async (data: any) => {
    try {
      console.log(`PO ${data.poNumber} delivery confirmed - items available`)
    } catch (error) {
      console.error('Error handling PURCHASE_DELIVERY_CONFIRMED event:', error)
    }
  })
}

/**
 * Unregister purchase order event handlers
 */
export function unregisterPurchaseEventHandlers(): void {
  eventService.removeAllListeners(EventType.PURCHASE_ORDER_CREATED)
  eventService.removeAllListeners(EventType.PURCHASE_ORDER_APPROVED)
  eventService.removeAllListeners(EventType.PURCHASE_ORDER_PARTIAL_RECEIPT)
  eventService.removeAllListeners(EventType.PURCHASE_ORDER_RECEIVED)
  eventService.removeAllListeners(EventType.PURCHASE_ORDER_CANCELLED)
  eventService.removeAllListeners(EventType.PURCHASE_INVOICE_RECEIVED)
  eventService.removeAllListeners(EventType.PURCHASE_INVOICE_PAID)
  eventService.removeAllListeners(EventType.PURCHASE_QC_REJECTION)
  eventService.removeAllListeners(EventType.PURCHASE_DELIVERY_CONFIRMED)
}

export default {
  registerPurchaseEventHandlers,
  unregisterPurchaseEventHandlers,
}
