/**
 * Return Items Service
 * Handles return item management and processing
 */

import { prisma } from '../../../../config/database'
import {
  EventService,
  EventType,
} from '../../../../shared/services/event.service'
import {
  BadRequestError,
  NotFoundError,
  ConflictError,
} from '../../../../shared/utils/errors'
import { logger } from '../../../../shared/utils/logger'

interface ReturnItemDetail {
  itemId: string
  returnId: string
  itemSku: string
  itemName: string
  quantity: number
  reason: string
  condition: 'DEFECTIVE' | 'DAMAGED' | 'WRONG_ITEM' | 'UNWANTED' | 'OTHER'
  notes?: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'RESTOCKED' | 'SCRAPED'
  refundAmount?: number
  createdAt: Date
  updatedAt: Date
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
    const returnRecord = await prisma.return.findUnique({
      where: { id: returnId },
    })

    if (!returnRecord) throw new NotFoundError('Return not found')

    // Verify item exists
    const item = await prisma.item.findUnique({
      where: { id: itemId },
    })

    if (!item) throw new NotFoundError('Item not found')

    // Check if item already exists in return
    const existingItem = await prisma.returnItem.findUnique({
      where: {
        returnId_itemId: {
          returnId,
          itemId,
        },
      },
    })

    if (existingItem) {
      throw new ConflictError('Item already added to this return')
    }

    // Add item to return
    const returnItem = await prisma.returnItem.create({
      data: {
        returnId,
        itemId,
        quantity,
        reason,
        condition,
        notes,
        status: 'PENDING',
      },
    })

    // Calculate refund amount (should be based on original invoice)
    const refundAmount = quantity * (item.sellPrice || item.costPrice || 0)

    // Emit item added event
    EventService.getInstance().emit(EventType.RETURN_ITEM_ADDED, {
      returnId,
      itemId,
      quantity,
      reason,
      condition,
    })

    return {
      itemId,
      returnId,
      itemSku: item.sku,
      itemName: item.name,
      quantity,
      reason,
      condition,
      notes,
      status: 'PENDING',
      refundAmount: Math.round(refundAmount * 100) / 100,
      createdAt: returnItem.createdAt,
      updatedAt: returnItem.updatedAt,
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
    const returnItem = await prisma.returnItem.findUnique({
      where: {
        returnId_itemId: {
          returnId,
          itemId,
        },
      },
      include: { item: true },
    })

    if (!returnItem) throw new NotFoundError('Return item not found')

    // Update status based on action
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

    // Update return item
    const updated = await prisma.returnItem.update({
      where: {
        returnId_itemId: {
          returnId,
          itemId,
        },
      },
      data: {
        status: newStatus,
        notes,
      },
    })

    // Calculate refund
    const refundAmount =
      newStatus === 'APPROVED'
        ? returnItem.quantity *
          (returnItem.item.sellPrice || returnItem.item.costPrice || 0)
        : 0

    // Emit item processed event
    EventService.getInstance().emit(EventType.RETURN_ITEM_PROCESSED, {
      returnId,
      itemId,
      action,
      newStatus,
      refundAmount: refundAmount > 0 ? refundAmount : undefined,
    })

    return {
      itemId,
      returnId,
      itemSku: returnItem.item.sku,
      itemName: returnItem.item.name,
      quantity: returnItem.quantity,
      reason: returnItem.reason,
      condition: returnItem.condition as any,
      notes: updated.notes || undefined,
      status: newStatus as any,
      refundAmount: Math.round(refundAmount * 100) / 100,
      createdAt: returnItem.createdAt,
      updatedAt: updated.updatedAt,
    }
  }

  /**
   * Get return items by return ID
   */
  async getReturnItems(returnId: string): Promise<ReturnItemDetail[]> {
    const returnRecord = await prisma.return.findUnique({
      where: { id: returnId },
    })

    if (!returnRecord) throw new NotFoundError('Return not found')

    const items = await prisma.returnItem.findMany({
      where: { returnId },
      include: { item: true },
    })

    return items.map((ri) => ({
      itemId: ri.itemId,
      returnId: ri.returnId,
      itemSku: ri.item.sku,
      itemName: ri.item.name,
      quantity: ri.quantity,
      reason: ri.reason,
      condition: ri.condition as any,
      notes: ri.notes || undefined,
      status: ri.status as any,
      refundAmount:
        ri.status === 'APPROVED'
          ? ri.quantity * (ri.item.sellPrice || ri.item.costPrice || 0)
          : 0,
      createdAt: ri.createdAt,
      updatedAt: ri.updatedAt,
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

    const returnItems = await prisma.returnItem.findMany({
      where: {
        itemId,
        createdAt: { gte: startDate },
      },
    })

    // Count reasons
    const reasonCounts: { [key: string]: number } = {}
    returnItems.forEach((ri) => {
      reasonCounts[ri.reason] = (reasonCounts[ri.reason] || 0) + 1
    })

    // Get common reasons
    const commonReasons = Object.entries(reasonCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([reason]) => reason)

    // Get sales count for failure rate
    const sales = await prisma.movement.count({
      where: {
        itemId,
        type: 'SALE',
        createdAt: { gte: startDate },
      },
    })

    const failureRate = sales > 0 ? (returnItems.length / sales) * 100 : 0

    // Get item for cost calculation
    const item = await prisma.item.findUnique({
      where: { id: itemId },
    })

    const estimatedLoss = returnItems.length * (item?.costPrice || 0)

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
        type: 'RETURN_IN',
        itemId,
        quantity,
        referenceId: returnId,
        notes: `Authorized return restock from return ${returnId}`,
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
        type: 'WRITE_OFF',
        itemId,
        quantity,
        referenceId: returnId,
        notes: `Return item scrapped from return ${returnId}`,
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

    const items = await prisma.returnItem.findMany({
      include: { item: true },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    })

    const total = await prisma.returnItem.count()

    const data = items.map((ri) => ({
      itemId: ri.itemId,
      returnId: ri.returnId,
      itemSku: ri.item.sku,
      itemName: ri.item.name,
      quantity: ri.quantity,
      reason: ri.reason,
      condition: ri.condition as any,
      notes: ri.notes || undefined,
      status: ri.status as any,
      refundAmount:
        ri.status === 'APPROVED'
          ? ri.quantity * (ri.item.sellPrice || ri.item.costPrice || 0)
          : 0,
      createdAt: ri.createdAt,
      updatedAt: ri.updatedAt,
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
