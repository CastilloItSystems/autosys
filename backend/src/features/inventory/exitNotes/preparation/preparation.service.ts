/**
 * Exit Notes Preparation Service
 * Handles preparation workflow: picking, verification, and readiness
 */

import prismaClient from '../../../../services/prisma.service'
import { EventService } from '../../../../shared/events/event.service'
import { EventType } from '../../../../shared/types/event.types'
import { ExitNotesService } from '../exitNotes.service'
import { ExitNoteItemsService } from '../items/items.service'

export class ExitNotePreparationService {
  private static instance: ExitNotePreparationService
  private prisma: PrismaClient
  private eventService: EventService
  private exitNotesService: ExitNotesService
  private itemsService: ExitNoteItemsService

  private constructor() {
    this.prisma = prismaClient
    this.eventService = EventService.getInstance()
    this.exitNotesService = ExitNotesService.getInstance()
    this.itemsService = ExitNoteItemsService.getInstance()
  }

  public static getInstance(): ExitNotePreparationService {
    if (!ExitNotePreparationService.instance) {
      ExitNotePreparationService.instance = new ExitNotePreparationService()
    }
    return ExitNotePreparationService.instance
  }

  /**
   * Start preparation: generate picking list
   */
  async startPreparation(
    exitNoteId: string,
    userId: string
  ): Promise<{
    exitNoteId: string
    pickingList: any[]
    totalItems: number
    status: string
  }> {
    const exitNote = await this.exitNotesService.findById(exitNoteId)
    if (!exitNote) {
      throw new Error(`Exit note ${exitNoteId} not found`)
    }

    // Start preparing in main service
    await this.exitNotesService.startPreparing(exitNoteId, userId)

    // Get picking list items
    const items = await this.itemsService.getItems(exitNoteId)

    this.eventService.emit(EventType.EXIT_NOTE_PREPARATION_STARTED, {
      exitNoteId,
      exitNoteNumber: exitNote.exitNoteNumber,
      itemCount: items.length,
      startedBy: userId,
    })

    return {
      exitNoteId,
      pickingList: items,
      totalItems: items.length,
      status: 'PREPARATION_STARTED',
    }
  }

  /**
   * Get picking list for an exit note
   */
  async getPickingList(exitNoteId: string): Promise<{
    exitNoteId: string
    exitNoteNumber: string
    items: any[]
    warehouseId: string
    recipientName?: string
    notes?: string
  }> {
    const exitNote = await this.exitNotesService.findById(exitNoteId)
    if (!exitNote) {
      throw new Error(`Exit note ${exitNoteId} not found`)
    }

    const items = await this.itemsService.getItems(exitNoteId)

    // Enhance items with location info
    const enhancedItems = await Promise.all(
      items.map(async (item) => {
        const itemData = await this.prisma.item.findUnique({
          where: { id: item.itemId },
          include: {
            warehouseLocations: {
              where: { warehouseId: exitNote.warehouseId },
              take: 1,
            },
          },
        })

        return {
          ...item,
          itemName: itemData?.name,
          itemSKU: itemData?.sku,
          defaultLocation:
            itemData?.warehouseLocations[0]?.location || 'Default',
        }
      })
    )

    return {
      exitNoteId,
      exitNoteNumber: exitNote.exitNoteNumber,
      items: enhancedItems,
      warehouseId: exitNote.warehouseId,
      recipientName: exitNote.recipientName,
      notes: exitNote.notes,
    }
  }

  /**
   * Mark items as picked
   */
  async markItemsAsPicked(
    exitNoteId: string,
    pickedItems: Array<{ itemId: string; location: string; quantity?: number }>,
    userId: string
  ): Promise<{
    exitNoteId: string
    itemsPicked: number
    totalItems: number
    completionPercentage: number
  }> {
    const exitNote = await this.exitNotesService.findById(exitNoteId)
    if (!exitNote) {
      throw new Error(`Exit note ${exitNoteId} not found`)
    }

    const items = await this.itemsService.getItems(exitNoteId)

    // Mark items as picked
    for (const pickedItem of pickedItems) {
      const item = items.find((i) => i.itemId === pickedItem.itemId)
      if (item) {
        await this.itemsService.updateItemPickingStatus(
          exitNoteId,
          pickedItem.itemId,
          'PICKED',
          pickedItem.location,
          userId
        )
      }
    }

    // Get updated summary
    const summary = await this.itemsService.getItemsSummary(exitNoteId)

    this.eventService.emit(EventType.EXIT_NOTE_ITEMS_PICKED, {
      exitNoteId,
      exitNoteNumber: exitNote.exitNoteNumber,
      itemsPickedCount: pickedItems.length,
      pickedBy: userId,
    })

    return {
      exitNoteId,
      itemsPicked: summary.itemsPicked,
      totalItems: summary.totalItems,
      completionPercentage: summary.completionPercentage,
    }
  }

  /**
   * Verify picked items against expected quantities
   */
  async verifyPickedItems(
    exitNoteId: string,
    verifications: Array<{
      itemId: string
      quantityExpected: number
      quantityFound: number
      notes?: string
    }>,
    userId: string
  ): Promise<{
    exitNoteId: string
    allVerified: boolean
    discrepancies: Array<{
      itemId: string
      itemName: string
      expected: number
      found: number
      discrepancy: number
    }>
    status: string
  }> {
    const exitNote = await this.exitNotesService.findById(exitNoteId)
    if (!exitNote) {
      throw new Error(`Exit note ${exitNoteId} not found`)
    }

    const discrepancies = []
    let allVerified = true

    // Verify each item
    for (const verification of verifications) {
      const itemData = await this.prisma.item.findUnique({
        where: { id: verification.itemId },
      })

      const discrepancy =
        verification.quantityExpected - verification.quantityFound

      if (discrepancy !== 0) {
        allVerified = false
        discrepancies.push({
          itemId: verification.itemId,
          itemName: itemData?.name || 'Unknown',
          expected: verification.quantityExpected,
          found: verification.quantityFound,
          discrepancy: Math.abs(discrepancy),
        })
      }

      // Mark as verified
      await this.itemsService.updateItemVerificationStatus(
        exitNoteId,
        verification.itemId,
        'VERIFIED',
        userId,
        verification.notes
      )
    }

    this.eventService.emit(EventType.EXIT_NOTE_ITEMS_VERIFIED, {
      exitNoteId,
      exitNoteNumber: exitNote.exitNoteNumber,
      allVerified,
      discrepanciesCount: discrepancies.length,
      verifiedBy: userId,
    })

    return {
      exitNoteId,
      allVerified,
      discrepancies,
      status: allVerified
        ? 'VERIFICATION_COMPLETE'
        : 'VERIFICATION_WITH_ISSUES',
    }
  }

  /**
   * Get preparation status
   */
  async getPreparationStatus(exitNoteId: string): Promise<{
    exitNoteId: string
    status: string
    itemsStatus: {
      totalItems: number
      notStarted: number
      picking: number
      picked: number
      verified: number
      rejected: number
    }
    percentageComplete: number
    canMarkAsReady: boolean
  }> {
    const summary = await this.itemsService.getItemsSummary(exitNoteId)

    return {
      exitNoteId,
      status: summary.pickingStatus,
      itemsStatus: {
        totalItems: summary.totalItems,
        notStarted: summary.totalItems - summary.itemsPicked,
        picking: 0, // Would be tracked separately in enhanced version
        picked: summary.itemsPicked,
        verified: summary.itemsVerified,
        rejected: summary.itemsRejected,
      },
      percentageComplete: summary.completionPercentage,
      canMarkAsReady:
        summary.completionPercentage === 100 && summary.itemsRejected === 0,
    }
  }

  /**
   * Mark preparation as complete (ready for delivery)
   */
  async completePreparation(
    exitNoteId: string,
    userId: string
  ): Promise<{
    exitNoteId: string
    status: string
    readyForDelivery: boolean
    completedAt: Date
  }> {
    const exitNote = await this.exitNotesService.findById(exitNoteId)
    if (!exitNote) {
      throw new Error(`Exit note ${exitNoteId} not found`)
    }

    const preparationStatus = await this.getPreparationStatus(exitNoteId)

    if (!preparationStatus.canMarkAsReady) {
      throw new Error(
        'Cannot complete preparation: not all items are picked and verified'
      )
    }

    // Mark as ready in main service
    const updated = await this.exitNotesService.markAsReady(exitNoteId, userId)

    this.eventService.emit(EventType.EXIT_NOTE_PREPARATION_COMPLETE, {
      exitNoteId,
      exitNoteNumber: exitNote.exitNoteNumber,
      completedBy: userId,
    })

    return {
      exitNoteId,
      status: 'READY_FOR_DELIVERY',
      readyForDelivery: true,
      completedAt: updated.preparedAt || new Date(),
    }
  }

  /**
   * Get preparation summary
   */
  async getPreparationSummary(exitNoteId: string): Promise<any> {
    const exitNote = await this.exitNotesService.findById(exitNoteId)
    if (!exitNote) {
      throw new Error(`Exit note ${exitNoteId} not found`)
    }

    const pickingList = await this.getPickingList(exitNoteId)
    const preparationStatus = await this.getPreparationStatus(exitNoteId)

    return {
      exitNoteId,
      exitNoteNumber: exitNote.exitNoteNumber,
      type: exitNote.type,
      status: exitNote.status,
      pickingStatus: preparationStatus,
      pickingList: pickingList.items,
      recipientName: exitNote.recipientName,
      notes: exitNote.notes,
      createdAt: exitNote.createdAt,
      reservedAt: exitNote.reservedAt,
    }
  }
}
