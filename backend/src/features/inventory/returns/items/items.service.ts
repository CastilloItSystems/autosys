/**
 * Return Items Service
 * Handles return item management and processing
 */

import { prisma } from '../../../../config/database.js'
import { MovementType } from '../../../../generated/prisma/client.js'
import EventService from '../../shared/events/event.service.js'
import { EventType } from '../../shared/events/event.types.js'
import {
  BadRequestError,
  NotFoundError,
  ConflictError,
} from '../../../../shared/utils/errors.js'
import { logger } from '../../../../shared/utils/logger.js'
import { MovementNumberGenerator } from '../../shared/utils/movementNumberGenerator.js'

interface ReturnItemDetail {
  itemId: string
  returnOrderId: string
  itemSku: string
  itemName: string
  quantity: number
  unitPrice?: number | null
  notes?: string | null
  createdAt: Date
}

interface ReturnItemAnalysis {
  itemId: string
  totalReturns: number
  failureRate: number
  commonReasons: string[]
  estimatedLoss: number
  recommendation:
    | 'INVESTIGATE'
    | 'IMPROVE_QUALITY'
    | 'STOP_SELLING'
    | 'MONITOR'
    | 'OK'
}

class ReturnItemsService {
  private static instance: ReturnItemsService

  public static getInstance(): ReturnItemsService {
    if (!ReturnItemsService.instance) {
      ReturnItemsService.instance = new ReturnItemsService()
    }
    return ReturnItemsService.instance
  }

  /**
   * Add item to return
   */
  async addItemToReturn(
    returnId: string,
    itemId: string,
    quantity: number,
    reason: string,
    condition: 'DEFECTIVE' | 'DAMAGED' | 'WRONG_ITEM' | 'UNWANTED' | 'OTHER',
    notes?: string
  ): Promise<ReturnItemDetail> {
    // Verify return exists
    const returnRecord = await prisma.returnOrder.findUnique({
      where: { id: returnId },
    })

    if (!returnRecord) throw new NotFoundError('Return not found')

    // Verify item exists
    const item = await prisma.item.findUnique({
      where: { id: itemId },
    })

    if (!item) throw new NotFoundError('Item not found')

    // Check if item already exists in return
    const existingItem = await prisma.returnOrderItem.findUnique({
      where: {
        returnOrderId_itemId: {
          returnOrderId: returnId,
          itemId,
        },
      },
    })

    if (existingItem) {
      throw new ConflictError('Item already added to this return')
    }

    // Add item to return
    const returnItem = await prisma.returnOrderItem.create({
      data: {
        returnOrderId: returnId,
        itemId,
        quantity,
        unitPrice: null,
        notes,
      },
    })

    // Calculate refund amount (should be based on original invoice)
    const refundAmount = quantity * Number(item.salePrice || item.costPrice || 0)

    // Emit item added event
    EventService.getInstance().emit({
      type: EventType.RETURN_ITEM_ADDED,
      entityId: returnId,
      entityType: 'ReturnOrder',
      data: { returnId, itemId, quantity, reason, condition },
    })

    return {
      itemId,
      returnOrderId: returnId,
      itemSku: item.sku,
      itemName: item.name,
      quantity,
      unitPrice: null,
      notes,
      createdAt: returnItem.createdAt,
    }
  }

  /**
   * Process return item (approve/reject/restock/scrap)
   */
  async processReturnItem(
    returnId: string,
    itemId: string,
    action: 'APPROVE' | 'REJECT' | 'RESTOCK' | 'SCRAP',
    notes?: string
  ): Promise<ReturnItemDetail> {
    const returnItem = await prisma.returnOrderItem.findUnique({
      where: {
        returnOrderId_itemId: {
          returnOrderId: returnId,
          itemId,
        },
      },
      include: { item: true },
    })

    if (!returnItem) throw new NotFoundError('Return item not found')

    // Determine action and create movements if needed
    let newStatus: string
    switch (action) {
      case 'APPROVE':
        newStatus = 'APPROVED'
        break
      case 'REJECT':
        newStatus = 'REJECTED'
        break
      case 'RESTOCK':
        newStatus = 'RESTOCKED'
        // Create inbound movement to restore stock
        await this.createRestockMovement(returnId, itemId, returnItem.quantity)
        break
      case 'SCRAP':
        newStatus = 'SCRAPED'
        // Create write-off movement
        await this.createWriteoffMovement(returnId, itemId, returnItem.quantity)
        break
    }

    // Update return item notes (status is not stored in schema)
    const updated = await prisma.returnOrderItem.update({
      where: {
        returnOrderId_itemId: {
          returnOrderId: returnId,
          itemId,
        },
      },
      data: {
        notes,
      },
    })

    // Calculate refund
    const refundAmount =
      newStatus === 'APPROVED'
        ? returnItem.quantity *
          Number(returnItem.item.salePrice || returnItem.item.costPrice || 0)
        : 0

    // Emit item processed event
    EventService.getInstance().emit({
      type: EventType.RETURN_ITEM_PROCESSED,
      entityId: returnId,
      entityType: 'ReturnOrder',
      data: {
        returnId,
        itemId,
        action,
        newStatus,
        refundAmount: refundAmount > 0 ? refundAmount : undefined,
      },
    })

    return {
      itemId,
      returnOrderId: returnId,
      itemSku: returnItem.item.sku,
      itemName: returnItem.item.name,
      quantity: returnItem.quantity,
      unitPrice: Number(returnItem.unitPrice || 0),
      notes: updated.notes || undefined,
      createdAt: returnItem.createdAt,
    }
  }

  /**
   * Get return items by return ID
   */
  async getReturnItems(returnId: string): Promise<ReturnItemDetail[]> {
    const returnRecord = await prisma.returnOrder.findUnique({
      where: { id: returnId },
    })

    if (!returnRecord) throw new NotFoundError('Return not found')

    const items = await prisma.returnOrderItem.findMany({
      where: { returnOrderId: returnId },
      include: { item: true },
    })

    return items.map((ri) => ({
      itemId: ri.itemId,
      returnOrderId: ri.returnOrderId,
      itemSku: ri.item.sku,
      itemName: ri.item.name,
      quantity: ri.quantity,
      unitPrice: Number(ri.unitPrice || 0),
      notes: ri.notes || undefined,
      createdAt: ri.createdAt,
    }))
  }

  /**
   * Get return analysis by item
   */
  async getReturnAnalysisByItem(
    itemId: string,
    days: number = 90
  ): Promise<ReturnItemAnalysis> {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const returnItems = await prisma.returnOrderItem.findMany({
      where: {
        itemId,
        createdAt: { gte: startDate },
      },
    })

    // Failure rate = returns / sales (based on movement records)
    const sales = await prisma.movement.count({
      where: {
        itemId,
        type: 'SALE',
        createdAt: { gte: startDate },
      },
    })

    const failureRate = sales > 0 ? (returnItems.length / sales) * 100 : 0

    // No per-reason data available in schema; return empty array
    const commonReasons: string[] = []

    // Get item for cost calculation
    const item = await prisma.item.findUnique({
      where: { id: itemId },
    })

    const estimatedLoss = returnItems.length * Number(item?.costPrice || 0)

    // Recommend action
    let recommendation:
      | 'INVESTIGATE'
      | 'IMPROVE_QUALITY'
      | 'STOP_SELLING'
      | 'MONITOR'
      | 'OK' = 'OK'
    if (failureRate > 10) {
      recommendation = 'STOP_SELLING'
    } else if (failureRate > 5) {
      recommendation = 'IMPROVE_QUALITY'
    } else if (failureRate > 2) {
      recommendation = 'INVESTIGATE'
    } else if (failureRate > 0.5) {
      recommendation = 'MONITOR'
    }

    return {
      itemId,
      totalReturns: returnItems.length,
      failureRate: Math.round(failureRate * 100) / 100,
      commonReasons,
      estimatedLoss: Math.round(estimatedLoss * 100) / 100,
      recommendation,
    }
  }

  /**
   * Create restock movement
   */
  private async createRestockMovement(
    returnId: string,
    itemId: string,
    quantity: number
  ) {
    await prisma.movement.create({
      data: {
        movementNumber: MovementNumberGenerator.generateMovementNumber(),
        type: MovementType.SUPPLIER_RETURN,
        quantity,
        reference: returnId,
        notes: `Authorized return restock from return ${returnId}`,
        item: { connect: { id: itemId } },
      },
    })
  }

  /**
   * Create write-off movement
   */
  private async createWriteoffMovement(
    returnId: string,
    itemId: string,
    quantity: number
  ) {
    await prisma.movement.create({
      data: {
        movementNumber: MovementNumberGenerator.generateMovementNumber(),
        type: MovementType.ADJUSTMENT_OUT,
        quantity,
        reference: returnId,
        notes: `Return item scrapped from return ${returnId}`,
        item: { connect: { id: itemId } },
      },
    })
  }

  /**
   * Get all return items summary (paginated)
   */
  async getAllReturnItems(
    page: number = 1,
    limit: number = 50
  ): Promise<{ data: ReturnItemDetail[]; total: number }> {
    const skip = (page - 1) * limit

    const items = await prisma.returnOrderItem.findMany({
      include: { item: true },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    })

    const total = await prisma.returnOrderItem.count()

    const data = items.map((ri) => ({
      itemId: ri.itemId,
      returnOrderId: ri.returnOrderId,
      itemSku: ri.item.sku,
      itemName: ri.item.name,
      quantity: ri.quantity,
      unitPrice: Number(ri.unitPrice || 0),
      notes: ri.notes || undefined,
      createdAt: ri.createdAt,
    }))

    return { data, total }
  }
}

export const addItemToReturn = (
  returnId: string,
  itemId: string,
  quantity: number,
  reason: string,
  condition: 'DEFECTIVE' | 'DAMAGED' | 'WRONG_ITEM' | 'UNWANTED' | 'OTHER',
  notes?: string
) =>
  ReturnItemsService.getInstance().addItemToReturn(
    returnId,
    itemId,
    quantity,
    reason,
    condition,
    notes
  )

export const processReturnItem = (
  returnId: string,
  itemId: string,
  action: 'APPROVE' | 'REJECT' | 'RESTOCK' | 'SCRAP',
  notes?: string
) =>
  ReturnItemsService.getInstance().processReturnItem(
    returnId,
    itemId,
    action,
    notes
  )

export const getReturnItems = (returnId: string) =>
  ReturnItemsService.getInstance().getReturnItems(returnId)

export const getReturnAnalysisByItem = (itemId: string, days?: number) =>
  ReturnItemsService.getInstance().getReturnAnalysisByItem(itemId, days)

export const getAllReturnItems = (page?: number, limit?: number) =>
  ReturnItemsService.getInstance().getAllReturnItems(page, limit)

export default ReturnItemsService
