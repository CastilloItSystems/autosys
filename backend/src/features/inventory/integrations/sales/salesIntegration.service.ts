/**
 * Sales Integration Service
 * Handles pre-invoice linking and sales order integration
 */

import { EventType } from '../../shared/events/event.types.js'
import { prisma } from '../../../../config/database.js'

import {
  BadRequestError,
  NotFoundError,
} from '../../../../shared/utils/errors.js'
import { logger } from '../../../../shared/utils/logger.js'
import EventService from '../../shared/events/event.service.js'

interface PreInvoiceLinkResult {
  preInvoiceId: string
  exitNoteId: string
  linkedAt: Date
  itemCount: number
  totalQuantity: number
  totalValue: number
}

interface SalesOrderFulfillment {
  salesOrderId: string
  fulfillmentStatus: 'PARTIAL' | 'COMPLETE' | 'PENDING'
  fulfilledQuantity: number
  totalQuantity: number
  remainingQuantity: number
  estimatedDeliveryDate: Date
}

interface SalesOrderIntegration {
  salesOrderId: string
  exitNoteId: string
  linkedAt: Date
  status: 'LINKED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED'
  tracking: {
    shipmentDate?: Date
    deliveryDate?: Date
    carrier?: string
    trackingNumber?: string
  }
}

class SalesIntegrationService {
  private static instance: SalesIntegrationService

  public static getInstance(): SalesIntegrationService {
    if (!SalesIntegrationService.instance) {
      SalesIntegrationService.instance = new SalesIntegrationService()
    }
    return SalesIntegrationService.instance
  }

  /**
   * Link exit note to pre-invoice
   */
  async linkExitNoteToPreInvoice(
    exitNoteId: string,
    preInvoiceId: string
  ): Promise<PreInvoiceLinkResult> {
    const exitNote = await prisma.exitNote.findUnique({
      where: { id: exitNoteId },
      include: { items: true },
    })

    if (!exitNote) throw new NotFoundError('Exit note not found')

    // Update exit note with pre-invoice reference
    const updated = await prisma.exitNote.update({
      where: { id: exitNoteId },
      data: { preInvoiceId },
      include: { items: true },
    })

    // Calculate totals
    const totalQuantity = updated.items.reduce(
      (sum, item) => sum + item.quantity,
      0
    )
    // Note: Direct value calculation may need to be adjusted based on actual schema
    const totalValue = totalQuantity * 100 // Placeholder - should be derived from item prices

    // Emit pre-invoice linked event
    EventService.getInstance().emit({
      type: EventType.PRE_INVOICE_LINKED,
      entityId: exitNoteId,
      entityType: 'ExitNote',
      data: { exitNoteId, preInvoiceId, itemCount: updated.items.length, totalQuantity },
    })

    return {
      preInvoiceId,
      exitNoteId,
      linkedAt: new Date(),
      itemCount: updated.items.length,
      totalQuantity,
      totalValue,
    }
  }

  /**
   * Link exit note to sales order and create shipment
   */
  async linkExitNoteToSalesOrder(
    exitNoteId: string,
    salesOrderId: string,
    trackingInfo?: {
      carrier?: string
      trackingNumber?: string
    }
  ): Promise<SalesOrderIntegration> {
    const exitNote = await prisma.exitNote.findUnique({
      where: { id: exitNoteId },
    })

    if (!exitNote) throw new NotFoundError('Exit note not found')

    // Update exit note with sales order reference (stored in reference field)
    const updated = await prisma.exitNote.update({
      where: { id: exitNoteId },
      data: {
        reference: salesOrderId,
        status: 'DELIVERED',
      },
    })

    // Emit sales order linked event
    EventService.getInstance().emit({
      type: EventType.SHIPMENT_CONFIRMED,
      entityId: exitNoteId,
      entityType: 'ExitNote',
      data: {
        exitNoteId,
        salesOrderId,
        shipmentDate: new Date(),
        carrier: trackingInfo?.carrier,
        trackingNumber: trackingInfo?.trackingNumber,
      },
    })

    return {
      salesOrderId,
      exitNoteId,
      linkedAt: new Date(),
      status: 'SHIPPED',
      tracking: {
        shipmentDate: new Date(),
        carrier: trackingInfo?.carrier,
        trackingNumber: trackingInfo?.trackingNumber,
      },
    }
  }

  /**
   * Get sales order fulfillment status
   */
  async getSalesOrderFulfillmentStatus(
    salesOrderId: string
  ): Promise<SalesOrderFulfillment> {
    // Get exit notes linked to this sales order (reference field stores salesOrderId)
    const exitNotes = await prisma.exitNote.findMany({
      where: {
        reference: salesOrderId,
        status: 'DELIVERED',
      },
      include: { items: true },
    })

    const fulfilledQuantity = exitNotes.reduce((sum, note) => {
      const noteTotal = note.items.reduce(
        (itemSum, item) => itemSum + item.quantity,
        0
      )
      return sum + noteTotal
    }, 0)

    // Placeholder for total quantity - should come from sales order system
    const totalQuantity = 100 // Placeholder
    const remainingQuantity = Math.max(0, totalQuantity - fulfilledQuantity)

    let fulfillmentStatus: 'PARTIAL' | 'COMPLETE' | 'PENDING' = 'PENDING'
    if (fulfilledQuantity === 0) {
      fulfillmentStatus = 'PENDING'
    } else if (fulfilledQuantity >= totalQuantity) {
      fulfillmentStatus = 'COMPLETE'
    } else {
      fulfillmentStatus = 'PARTIAL'
    }

    // Calculate estimated delivery (placeholder)
    const estimatedDeliveryDate = new Date()
    estimatedDeliveryDate.setDate(estimatedDeliveryDate.getDate() + 3)

    return {
      salesOrderId,
      fulfillmentStatus,
      fulfilledQuantity,
      totalQuantity,
      remainingQuantity,
      estimatedDeliveryDate,
    }
  }

  /**
   * Get pending exit notes for sales orders
   */
  async getPendingExitNotesForSalesOrders(
    page: number = 1,
    limit: number = 50
  ): Promise<{ data: any[]; total: number }> {
    const skip = (page - 1) * limit

    const exitNotes = await prisma.exitNote.findMany({
      where: {
        reference: { not: null },
        status: { not: 'DELIVERED' },
      },
      include: {
        items: true,
      },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    })

    const total = await prisma.exitNote.count({
      where: {
        reference: { not: null },
        status: { not: 'DELIVERED' },
      },
    })

    return {
      data: exitNotes.map((note) => ({
        exitNoteId: note.id,
        salesOrderId: note.reference,
        status: note.status,
        itemCount: note.items.length,
        createdAt: note.createdAt,
      })),
      total,
    }
  }

  /**
   * Confirm shipment for sale
   */
  async confirmShipment(
    exitNoteId: string,
    deliveryDate: Date,
    signature?: string,
    notes?: string
  ): Promise<{ exitNoteId: string; status: string; deliveredAt: Date }> {
    const updated = await prisma.exitNote.update({
      where: { id: exitNoteId },
      data: {
        status: 'DELIVERED',
        deliveredAt: deliveryDate,
      },
    })

    // Emit shipment confirmed event
    EventService.getInstance().emit({
      type: EventType.SHIPMENT_CONFIRMED,
      entityId: exitNoteId,
      entityType: 'ExitNote',
      data: { exitNoteId, deliveredAt: deliveryDate, signature, notes },
    })

    return {
      exitNoteId,
      status: 'DELIVERED',
      deliveredAt: deliveryDate,
    }
  }

  /**
   * Get sales metrics
   */
  async getSalesMetrics(
    startDate: Date,
    endDate: Date
  ): Promise<{
    totalSalesVALUE: number
    totalUnitsShipped: number
    averageOrderValue: number
    ordersShipped: number
    shipmentEfficency: number
  }> {
    const exitNotes = await prisma.exitNote.findMany({
      where: {
        deliveredAt: { gte: startDate, lte: endDate },
        status: 'DELIVERED',
      },
      include: { items: true },
    })

    const totalUnitsShipped = exitNotes.reduce((sum, note) => {
      const noteTotal = note.items.reduce(
        (itemSum, item) => itemSum + item.quantity,
        0
      )
      return sum + noteTotal
    }, 0)

    // Placeholder for values
    const totalSalesValue = totalUnitsShipped * 50 // Placeholder
    const ordersShipped = exitNotes.length
    const averageOrderValue =
      ordersShipped > 0 ? totalSalesValue / ordersShipped : 0
    const shipmentEfficency =
      ordersShipped > 0 ? (totalUnitsShipped / (ordersShipped * 10)) * 100 : 0 // Placeholder

    return {
      totalSalesVALUE: Math.round(totalSalesValue * 100) / 100,
      totalUnitsShipped,
      averageOrderValue: Math.round(averageOrderValue * 100) / 100,
      ordersShipped,
      shipmentEfficency: Math.round(shipmentEfficency * 100) / 100,
    }
  }
}

export const linkExitNoteToPreInvoice = (
  exitNoteId: string,
  preInvoiceId: string
) =>
  SalesIntegrationService.getInstance().linkExitNoteToPreInvoice(
    exitNoteId,
    preInvoiceId
  )

export const linkExitNoteToSalesOrder = (
  exitNoteId: string,
  salesOrderId: string,
  trackingInfo?: { carrier?: string; trackingNumber?: string }
) =>
  SalesIntegrationService.getInstance().linkExitNoteToSalesOrder(
    exitNoteId,
    salesOrderId,
    trackingInfo
  )

export const getSalesOrderFulfillmentStatus = (salesOrderId: string) =>
  SalesIntegrationService.getInstance().getSalesOrderFulfillmentStatus(
    salesOrderId
  )

export const getPendingExitNotesForSalesOrders = (
  page?: number,
  limit?: number
) =>
  SalesIntegrationService.getInstance().getPendingExitNotesForSalesOrders(
    page,
    limit
  )

export const confirmShipment = (
  exitNoteId: string,
  deliveryDate: Date,
  signature?: string,
  notes?: string
) =>
  SalesIntegrationService.getInstance().confirmShipment(
    exitNoteId,
    deliveryDate,
    signature,
    notes
  )

export const getSalesMetrics = (startDate: Date, endDate: Date) =>
  SalesIntegrationService.getInstance().getSalesMetrics(startDate, endDate)

export default SalesIntegrationService
