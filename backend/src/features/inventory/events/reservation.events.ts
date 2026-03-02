/**
 * Reservation Events Handler
 * Listens for reservation events and manages reserved stock
 */

import EventService from '../shared/events/event.service'
import { EventType } from '../shared/events/event.types'
import prisma from '../../../services/prisma.service'

const eventService = EventService.getInstance()

/**
 * Register reservation event listeners
 */
export function registerReservationEventHandlers(): void {
  // Handle reservation creation
  eventService.on(EventType.RESERVATION_CREATED, async (data: any) => {
    try {
      // Decrement available, increment reserved
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

      console.log(
        `Reservation created for ${data.quantity} units of item ${data.itemId}`
      )
    } catch (error) {
      console.error('Error handling RESERVATION_CREATED event:', error)
    }
  })

  // Handle reservation confirmation (provisional becomes confirmed)
  eventService.on(EventType.RESERVATION_CONFIRMED, async (data: any) => {
    try {
      // Just log - quantities already reserved
      console.log(`Reservation ${data.reservationId} confirmed`)
    } catch (error) {
      console.error('Error handling RESERVATION_CONFIRMED event:', error)
    }
  })

  // Handle reservation fulfillment (converted to actual delivery/exit)
  eventService.on(EventType.RESERVATION_FULFILLED, async (data: any) => {
    try {
      // Quantities already deducted, reserved counts stay same
      // When actually delivered, exit note will handle final deduction
      console.log(
        `Reservation ${data.reservationId} fulfilled via ${data.fulfillmentType}`
      )
    } catch (error) {
      console.error('Error handling RESERVATION_FULFILLED event:', error)
    }
  })

  // Handle reservation cancellation
  eventService.on(EventType.RESERVATION_CANCELLED, async (data: any) => {
    try {
      // Return reserved quantity back to available
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

      console.log(
        `Reservation cancelled - ${data.quantity} units released back to available stock`
      )
    } catch (error) {
      console.error('Error handling RESERVATION_CANCELLED event:', error)
    }
  })

  // Handle reservation expiry
  eventService.on(EventType.RESERVATION_EXPIRED, async (data: any) => {
    try {
      // Treat as cancellation - release reserved quantities
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

      // Create audit record
      await prisma.movement.create({
        data: {
          itemId: data.itemId,
          warehouseFromId: data.warehouseId,
          type: 'RESERVATION_RELEASE' as any,
          quantity: data.quantity,
          reference: data.reservationId,
          notes: 'Reservation expired - stock released',
        } as any,
      })

      console.log(`Reservation ${data.reservationId} expired - stock released`)
    } catch (error) {
      console.error('Error handling RESERVATION_EXPIRED event:', error)
    }
  })

  // Handle pre-invoice link to reservation
  eventService.on(EventType.PRE_INVOICE_CREATED, async (data: any) => {
    try {
      // Create reservations for pre-invoice items if not already reserved
      for (const item of data.items || []) {
        const existing = await prisma.stock.findUnique({
          where: {
            itemId_warehouseId: {
              itemId: item.itemId,
              warehouseId: data.warehouseId,
            },
          },
        })

        if (existing && existing.quantityAvailable >= item.quantity) {
          // Reserve
          await prisma.stock.update({
            where: {
              itemId_warehouseId: {
                itemId: item.itemId,
                warehouseId: data.warehouseId,
              },
            },
            data: {
              quantityReserved: { increment: item.quantity },
              quantityAvailable: { decrement: item.quantity },
              updatedAt: new Date(),
            },
          })
        }
      }

      console.log(`Pre-invoice ${data.preInvoiceId} created - items reserved`)
    } catch (error) {
      console.error('Error handling PRE_INVOICE_CREATED event:', error)
    }
  })

  // Handle pre-invoice cancellation
  eventService.on(EventType.PRE_INVOICE_CANCELLED, async (data: any) => {
    try {
      // Release all reservations
      for (const item of data.items || []) {
        await prisma.stock.updateMany({
          where: {
            itemId: item.itemId,
            warehouseId: data.warehouseId,
          },
          data: {
            quantityReserved: { decrement: item.quantity },
            quantityAvailable: { increment: item.quantity },
            updatedAt: new Date(),
          },
        })
      }

      console.log(
        `Pre-invoice ${data.preInvoiceId} cancelled - reservations released`
      )
    } catch (error) {
      console.error('Error handling PRE_INVOICE_CANCELLED event:', error)
    }
  })

  // Handle sales order from pre-invoice
  eventService.on(EventType.SALES_ORDER_CREATED, async (data: any) => {
    try {
      // Reservations already made via pre-invoice
      console.log(`Sales order ${data.salesOrderId} created from pre-invoice`)
    } catch (error) {
      console.error('Error handling SALES_ORDER_CREATED event:', error)
    }
  })

  // Handle sales order shipment (final deduction)
  eventService.on(EventType.SALES_ORDER_SHIPPED, async (data: any) => {
    try {
      // Deduct from real inventory when actually shipped
      for (const item of data.items || []) {
        await prisma.stock.updateMany({
          where: {
            itemId: item.itemId,
            warehouseId: data.warehouseId,
          },
          data: {
            quantityReal: { decrement: item.quantity },
            quantityReserved: { decrement: item.quantity },
            updatedAt: new Date(),
          },
        })

        // Create movement record
        await prisma.movement.create({
          data: {
            itemId: item.itemId,
            warehouseFromId: data.warehouseId,
            type: 'SALE' as any,
            quantity: -item.quantity, // Negative for outgoing
            reference: data.salesOrderId,
            notes: `Order shipped`,
          } as any,
        })
      }

      console.log(`Sales order ${data.salesOrderId} shipped - stock deducted`)
    } catch (error) {
      console.error('Error handling SALES_ORDER_SHIPPED event:', error)
    }
  })

  // Handle sales order cancellation
  eventService.on(EventType.SALES_ORDER_CANCELLED, async (data: any) => {
    try {
      // Release reservations
      for (const item of data.items || []) {
        await prisma.stock.updateMany({
          where: {
            itemId: item.itemId,
            warehouseId: data.warehouseId,
          },
          data: {
            quantityReserved: { decrement: item.quantity },
            quantityAvailable: { increment: item.quantity },
            updatedAt: new Date(),
          },
        })
      }

      console.log(
        `Sales order ${data.salesOrderId} cancelled - reservations released`
      )
    } catch (error) {
      console.error('Error handling SALES_ORDER_CANCELLED event:', error)
    }
  })
}

/**
 * Unregister reservation event handlers
 */
export function unregisterReservationEventHandlers(): void {
  eventService.removeAllListeners(EventType.RESERVATION_CREATED)
  eventService.removeAllListeners(EventType.RESERVATION_CONFIRMED)
  eventService.removeAllListeners(EventType.RESERVATION_FULFILLED)
  eventService.removeAllListeners(EventType.RESERVATION_CANCELLED)
  eventService.removeAllListeners(EventType.RESERVATION_EXPIRED)
  eventService.removeAllListeners(EventType.PRE_INVOICE_CREATED)
  eventService.removeAllListeners(EventType.PRE_INVOICE_CANCELLED)
  eventService.removeAllListeners(EventType.SALES_ORDER_CREATED)
  eventService.removeAllListeners(EventType.SALES_ORDER_SHIPPED)
  eventService.removeAllListeners(EventType.SALES_ORDER_CANCELLED)
}

export default {
  registerReservationEventHandlers,
  unregisterReservationEventHandlers,
}
