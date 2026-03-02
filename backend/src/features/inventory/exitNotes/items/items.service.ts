/**
 * Exit Notes Items Service
 * Handles picking, batch assignment, serial number tracking, and verification
 */

import prismaClient from '../../../../services/prisma.service'
import { EventService } from '../../../../shared/events/event.service'
import { EventType } from '../../../../shared/types/event.types'
import {
  IExitNoteItemDetails,
  ItemPickingStatus,
  IItemPickingInfo,
  IItemVerificationResult,
  IBatchAssignment,
  ISerialAssignment,
  IExitNoteItemsSummary,
} from './items.interface'

export class ExitNoteItemsService {
  private static instance: ExitNoteItemsService
  private prisma: PrismaClient
  private eventService: EventService

  private constructor() {
    this.prisma = prismaClient
    this.eventService = EventService.getInstance()
  }

  public static getInstance(): ExitNoteItemsService {
    if (!ExitNoteItemsService.instance) {
      ExitNoteItemsService.instance = new ExitNoteItemsService()
    }
    return ExitNoteItemsService.instance
  }

  /**
   * Get all items for an exit note
   */
  async getItems(exitNoteId: string): Promise<IExitNoteItemDetails[]> {
    const items = await this.prisma.exitNoteItem.findMany({
      where: { exitNoteId },
      orderBy: { createdAt: 'asc' },
    })

    return items.map((item) => this.mapToItemDetails(item))
  }

  /**
   * Get a specific item from exit note
   */
  async getItem(itemId: string): Promise<IExitNoteItemDetails | null> {
    const item = await this.prisma.exitNoteItem.findUnique({
      where: { id: itemId },
    })

    return item ? this.mapToItemDetails(item) : null
  }

  /**
   * Record item picking
   */
  async recordPicking(
    exitNoteItemId: string,
    quantityPicked: number,
    pickedFromLocation: string,
    userId: string,
    notes?: string
  ): Promise<IExitNoteItemDetails> {
    const item = await this.prisma.exitNoteItem.findUnique({
      where: { id: exitNoteItemId },
      include: { exitNote: true },
    })

    if (!item) {
      throw new Error(`Exit note item ${exitNoteItemId} not found`)
    }

    if (quantityPicked > item.quantity) {
      throw new Error(
        `Cannot pick ${quantityPicked} items. Only ${item.quantity} required.`
      )
    }

    // Update tracking fields (using JSON fields if needed)
    const updated = await this.prisma.exitNoteItem.update({
      where: { id: exitNoteItemId },
      data: {
        pickedFromLocation,
        notes: notes ? `${item.notes || ''}\nPicked: ${notes}` : item.notes,
        updatedAt: new Date(),
      },
    })

    // Emit event
    this.eventService.emit(EventType.ITEM_PICKED, {
      exitNoteItemId,
      exitNoteId: item.exitNoteId,
      itemId: item.itemId,
      quantityPicked,
      pickedBy: userId,
    })

    return this.mapToItemDetails(updated)
  }

  /**
   * Assign batch to item
   */
  async assignBatch(
    exitNoteItemId: string,
    batchId: string,
    userId: string
  ): Promise<IExitNoteItemDetails> {
    const item = await this.prisma.exitNoteItem.findUnique({
      where: { id: exitNoteItemId },
    })

    if (!item) {
      throw new Error(`Exit note item ${exitNoteItemId} not found`)
    }

    // Validate batch exists and has available quantity
    const batch = await this.prisma.batch.findUnique({
      where: { id: batchId },
    })

    if (!batch) {
      throw new Error(`Batch ${batchId} not found`)
    }

    if (batch.itemId !== item.itemId) {
      throw new Error(`Batch does not belong to the specified item`)
    }

    if (batch.currentQuantity < item.quantity) {
      throw new Error(
        `Batch does not have sufficient quantity. Available: ${batch.currentQuantity}, Required: ${item.quantity}`
      )
    }

    const updated = await this.prisma.exitNoteItem.update({
      where: { id: exitNoteItemId },
      data: {
        batchId,
        updatedAt: new Date(),
      },
    })

    this.eventService.emit(EventType.ITEM_BATCH_ASSIGNED, {
      exitNoteItemId,
      itemId: item.itemId,
      batchId,
      assignedBy: userId,
    })

    return this.mapToItemDetails(updated)
  }

  /**
   * Assign serial number to item
   */
  async assignSerialNumber(
    exitNoteItemId: string,
    serialNumberId: string,
    userId: string
  ): Promise<IExitNoteItemDetails> {
    const item = await this.prisma.exitNoteItem.findUnique({
      where: { id: exitNoteItemId },
    })

    if (!item) {
      throw new Error(`Exit note item ${exitNoteItemId} not found`)
    }

    // Validate serial number exists and belongs to item
    const serial = await this.prisma.serialNumber.findUnique({
      where: { id: serialNumberId },
    })

    if (!serial) {
      throw new Error(`Serial number ${serialNumberId} not found`)
    }

    if (serial.itemId !== item.itemId) {
      throw new Error(`Serial number does not belong to the specified item`)
    }

    const updated = await this.prisma.exitNoteItem.update({
      where: { id: exitNoteItemId },
      data: {
        serialNumberId,
        updatedAt: new Date(),
      },
    })

    this.eventService.emit(EventType.ITEM_SERIAL_ASSIGNED, {
      exitNoteItemId,
      itemId: item.itemId,
      serialNumberId,
      serialNumber: serial.serialNumber,
      assignedBy: userId,
    })

    return this.mapToItemDetails(updated)
  }

  /**
   * Verify item picking
   */
  async verifyItem(
    exitNoteItemId: string,
    quantityVerified: number,
    userId: string,
    notes?: string
  ): Promise<IExitNoteItemDetails> {
    const item = await this.prisma.exitNoteItem.findUnique({
      where: { id: exitNoteItemId },
    })

    if (!item) {
      throw new Error(`Exit note item ${exitNoteItemId} not found`)
    }

    if (quantityVerified > item.quantity) {
      throw new Error(
        `Cannot verify ${quantityVerified} items. Only ${item.quantity} required.`
      )
    }

    // Update with verification info
    const updated = await this.prisma.exitNoteItem.update({
      where: { id: exitNoteItemId },
      data: {
        notes: notes ? `${item.notes || ''}\nVerified: ${notes}` : item.notes,
        updatedAt: new Date(),
      },
    })

    // If discrepancy, emit event
    if (quantityVerified !== item.quantity) {
      this.eventService.emit(EventType.ITEM_VERIFICATION_DISCREPANCY, {
        exitNoteItemId,
        itemId: item.itemId,
        expected: item.quantity,
        found: quantityVerified,
        verifiedBy: userId,
      })
    } else {
      this.eventService.emit(EventType.ITEM_VERIFIED, {
        exitNoteItemId,
        itemId: item.itemId,
        quantity: quantityVerified,
        verifiedBy: userId,
      })
    }

    return this.mapToItemDetails(updated)
  }

  /**
   * Reject item (cannot fulfill)
   */
  async rejectItem(
    exitNoteItemId: string,
    reason: string,
    userId: string
  ): Promise<IExitNoteItemDetails> {
    const item = await this.prisma.exitNoteItem.findUnique({
      where: { id: exitNoteItemId },
    })

    if (!item) {
      throw new Error(`Exit note item ${exitNoteItemId} not found`)
    }

    const updated = await this.prisma.exitNoteItem.update({
      where: { id: exitNoteItemId },
      data: {
        notes: `${item.notes || ''}\nREJECTED: ${reason}`,
        updatedAt: new Date(),
      },
    })

    this.eventService.emit(EventType.ITEM_REJECTED, {
      exitNoteItemId,
      itemId: item.itemId,
      reason,
      rejectedBy: userId,
    })

    return this.mapToItemDetails(updated)
  }

  /**
   * Get items summary for exit note
   */
  async getItemsSummary(exitNoteId: string): Promise<IExitNoteItemsSummary> {
    const items = await this.prisma.exitNoteItem.findMany({
      where: { exitNoteId },
    })

    if (items.length === 0) {
      return {
        exitNoteId,
        totalItems: 0,
        totalQuantity: 0,
        itemsNotPicked: 0,
        itemsPicked: 0,
        itemsVerified: 0,
        itemsRejected: 0,
        completionPercentage: 0,
        pickingStatus: 'NOT_STARTED',
      }
    }

    const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0)

    // Simplified counts - would track in detail with additional fields
    const itemsPicked = items.filter((i) => i.pickedFromLocation).length
    const itemsRejected = items.filter((i) =>
      i.notes?.includes('REJECTED')
    ).length
    const itemsVerified = items.filter((i) =>
      i.notes?.includes('Verified')
    ).length

    let pickingStatus:
      | 'NOT_STARTED'
      | 'IN_PROGRESS'
      | 'COMPLETE'
      | 'COMPLETE_WITH_ISSUES' = 'NOT_STARTED'

    if (itemsPicked === 0) {
      pickingStatus = 'NOT_STARTED'
    } else if (itemsVerified === items.length) {
      pickingStatus = 'COMPLETE'
    } else if (itemsVerified + itemsRejected === items.length) {
      pickingStatus = 'COMPLETE_WITH_ISSUES'
    } else {
      pickingStatus = 'IN_PROGRESS'
    }

    return {
      exitNoteId,
      totalItems: items.length,
      totalQuantity,
      itemsNotPicked: items.length - itemsPicked,
      itemsPicked,
      itemsVerified,
      itemsRejected,
      completionPercentage:
        items.length > 0
          ? Math.round(((itemsPicked + itemsRejected) / items.length) * 100)
          : 0,
      pickingStatus,
    }
  }

  /**
   * Get items by batch
   */
  async getItemsByBatch(batchId: string): Promise<IExitNoteItemDetails[]> {
    const items = await this.prisma.exitNoteItem.findMany({
      where: { batchId },
    })

    return items.map((item) => this.mapToItemDetails(item))
  }

  /**
   * Get items by serial number
   */
  async getItemsBySerial(
    serialNumberId: string
  ): Promise<IExitNoteItemDetails[]> {
    const items = await this.prisma.exitNoteItem.findMany({
      where: { serialNumberId },
    })

    return items.map((item) => this.mapToItemDetails(item))
  }

  /**
   * Helper: Map to item details interface
   */
  private mapToItemDetails(item: any): IExitNoteItemDetails {
    return {
      id: item.id,
      exitNoteId: item.exitNoteId,
      itemId: item.itemId,
      quantity: item.quantity,
      quantityPicked: 0, // Would track in detail
      quantityVerified: 0, // Would track in detail
      pickedFromLocation: item.pickedFromLocation,
      batchId: item.batchId,
      serialNumberId: item.serialNumberId,
      pickingStatus: this.determinePickingStatus(item),
      notes: item.notes,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    }
  }

  /**
   * Helper: Determine picking status from item data
   */
  private determinePickingStatus(item: any): ItemPickingStatus {
    if (item.notes?.includes('REJECTED')) {
      return ItemPickingStatus.REJECTED
    }
    if (item.notes?.includes('Verified')) {
      return ItemPickingStatus.VERIFIED
    }
    if (item.pickedFromLocation) {
      return ItemPickingStatus.PICKED
    }
    return ItemPickingStatus.NOT_STARTED
  }
}
