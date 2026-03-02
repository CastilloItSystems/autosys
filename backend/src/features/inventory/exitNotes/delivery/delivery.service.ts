/**
 * Exit Notes Delivery Service
 * Handles delivery workflow: confirmation, tracking, and completion
 */

import prismaClient from '../../../../services/prisma.service'
import { EventService } from '../../../../shared/events/event.service'
import { EventType } from '../../../../shared/types/event.types'
import { ExitNotesService } from '../exitNotes.service'

export class ExitNoteDeliveryService {
  private static instance: ExitNoteDeliveryService
  private prisma: PrismaClient
  private eventService: EventService
  private exitNotesService: ExitNotesService

  private constructor() {
    this.prisma = prismaClient
    this.eventService = EventService.getInstance()
    this.exitNotesService = ExitNotesService.getInstance()
  }

  public static getInstance(): ExitNoteDeliveryService {
    if (!ExitNoteDeliveryService.instance) {
      ExitNoteDeliveryService.instance = new ExitNoteDeliveryService()
    }
    return ExitNoteDeliveryService.instance
  }

  /**
   * Get delivery information
   */
  async getDeliveryInfo(exitNoteId: string): Promise<{
    exitNoteId: string
    exitNoteNumber: string
    type: string
    recipientName?: string
    recipientId?: string
    recipientPhone?: string
    itemCount: number
    totalQuantity: number
    status: string
    readyForDelivery: boolean
  }> {
    const exitNote = await this.exitNotesService.findById(exitNoteId)
    if (!exitNote) {
      throw new Error(`Exit note ${exitNoteId} not found`)
    }

    const totalQuantity = exitNote.items.reduce(
      (sum, item) => sum + item.quantity,
      0
    )

    return {
      exitNoteId,
      exitNoteNumber: exitNote.exitNoteNumber,
      type: exitNote.type,
      recipientName: exitNote.recipientName,
      recipientId: exitNote.recipientId,
      recipientPhone: exitNote.recipientPhone,
      itemCount: exitNote.items.length,
      totalQuantity,
      status: exitNote.status,
      readyForDelivery: exitNote.status === 'READY',
    }
  }

  /**
   * Confirm delivery - mark as delivered
   */
  async confirmDelivery(
    exitNoteId: string,
    userId: string
  ): Promise<{
    exitNoteId: string
    exitNoteNumber: string
    status: string
    deliveredAt: Date
    deliveredBy: string
    message: string
  }> {
    const exitNote = await this.exitNotesService.findById(exitNoteId)
    if (!exitNote) {
      throw new Error(`Exit note ${exitNoteId} not found`)
    }

    if (exitNote.status !== 'READY') {
      throw new Error(
        `Cannot deliver exit note in ${exitNote.status} status. Must be in READY status.`
      )
    }

    // Deliver using main service
    const delivered = await this.exitNotesService.deliver(exitNoteId, userId)

    this.eventService.emit(EventType.EXIT_NOTE_DELIVERY_CONFIRMED, {
      exitNoteId,
      exitNoteNumber: delivered.exitNoteNumber,
      type: delivered.type,
      deliveredBy: userId,
      itemCount: delivered.items.length,
    })

    return {
      exitNoteId,
      exitNoteNumber: delivered.exitNoteNumber,
      status: delivered.status,
      deliveredAt: delivered.deliveredAt || new Date(),
      deliveredBy: userId,
      message: `Exit note ${delivered.exitNoteNumber} delivered successfully`,
    }
  }

  /**
   * Record delivery signature/confirmation
   */
  async recordDeliveryConfirmation(
    exitNoteId: string,
    data: {
      signatureUrl?: string
      deliveryNotes?: string
      recipientName?: string
      deliveredAt?: Date
    },
    userId: string
  ): Promise<{
    exitNoteId: string
    confirmed: boolean
    confirmedAt: Date
    confirmedBy: string
  }> {
    const exitNote = await this.exitNotesService.findById(exitNoteId)
    if (!exitNote) {
      throw new Error(`Exit note ${exitNoteId} not found`)
    }

    // Update with delivery confirmation details
    const updated = await this.prisma.exitNote
      .update({
        where: { id: exitNoteId },
        data: {
          deliveredAt: data.deliveredAt || new Date(),
          notes: `${exitNote.notes || ''}\n[DELIVERY CONFIRMED]\nNotes: ${data.deliveryNotes || 'N/A'}`,
          updatedAt: new Date(),
        },
      })
      .catch((error) => {
        throw new Error(`Failed to record delivery: ${error.message}`)
      })

    this.eventService.emit(EventType.EXIT_NOTE_DELIVERY_CONFIRMED, {
      exitNoteId,
      exitNoteNumber: updated.exitNoteNumber,
      confirmedBy: userId,
      recipientName: data.recipientName,
    })

    return {
      exitNoteId,
      confirmed: true,
      confirmedAt: updated.deliveredAt || new Date(),
      confirmedBy: userId,
    }
  }

  /**
   * Get delivery history
   */
  async getDeliveryHistory(exitNoteId: string): Promise<any> {
    const exitNote = await this.exitNotesService.findById(exitNoteId)
    if (!exitNote) {
      throw new Error(`Exit note ${exitNoteId} not found`)
    }

    // Get movement records related to this exit note
    const movements = await this.prisma.movement.findMany({
      where: {
        reference: exitNote.exitNoteNumber,
      },
      orderBy: { createdAt: 'desc' },
    })

    return {
      exitNoteId,
      exitNoteNumber: exitNote.exitNoteNumber,
      status: exitNote.status,
      createdAt: exitNote.createdAt,
      reservedAt: exitNote.reservedAt,
      preparedAt: exitNote.preparedAt,
      deliveredAt: exitNote.deliveredAt,
      deliveredBy: exitNote.deliveredBy,
      movements: movements,
      timeline: [
        {
          event: 'CREATED',
          timestamp: exitNote.createdAt,
          by: 'System',
        },
        ...(exitNote.reservedAt
          ? [
              {
                event: 'PREPARATION_STARTED',
                timestamp: exitNote.reservedAt,
                by: 'System',
              },
            ]
          : []),
        ...(exitNote.preparedAt
          ? [
              {
                event: 'PREPARATION_COMPLETED',
                timestamp: exitNote.preparedAt,
                by: exitNote.preparedBy || 'System',
              },
            ]
          : []),
        ...(exitNote.deliveredAt
          ? [
              {
                event: 'DELIVERED',
                timestamp: exitNote.deliveredAt,
                by: exitNote.deliveredBy || 'System',
              },
            ]
          : []),
      ],
    }
  }

  /**
   * Get delivery tracking
   */
  async getDeliveryTracking(exitNoteId: string): Promise<{
    exitNoteId: string
    currentStatus: string
    statusHistory: Array<{
      status: string
      timestamp: Date
      completedBy?: string
    }>
    estimatedDeliveryDate?: Date
    actualDeliveryDate?: Date
    deliveryProgress: number
  }> {
    const exitNote = await this.exitNotesService.findById(exitNoteId)
    if (!exitNote) {
      throw new Error(`Exit note ${exitNoteId} not found`)
    }

    const statusHistory = []

    statusHistory.push({
      status: 'PENDING',
      timestamp: exitNote.createdAt,
    })

    if (exitNote.reservedAt) {
      statusHistory.push({
        status: 'IN_PROGRESS',
        timestamp: exitNote.reservedAt,
      })
    }

    if (exitNote.preparedAt) {
      statusHistory.push({
        status: 'READY',
        timestamp: exitNote.preparedAt,
        completedBy: exitNote.preparedBy,
      })
    }

    if (exitNote.deliveredAt) {
      statusHistory.push({
        status: 'DELIVERED',
        timestamp: exitNote.deliveredAt,
        completedBy: exitNote.deliveredBy,
      })
    }

    const statusProgression = ['PENDING', 'IN_PROGRESS', 'READY', 'DELIVERED']
    const currentIndex = statusProgression.indexOf(exitNote.status)
    const deliveryProgress = Math.round(((currentIndex + 1) / 4) * 100)

    return {
      exitNoteId,
      currentStatus: exitNote.status,
      statusHistory,
      estimatedDeliveryDate: exitNote.expectedReturnDate,
      actualDeliveryDate: exitNote.deliveredAt,
      deliveryProgress,
    }
  }

  /**
   * Cancel delivery
   */
  async cancelDelivery(
    exitNoteId: string,
    reason: string,
    userId: string
  ): Promise<{
    exitNoteId: string
    exitNoteNumber: string
    status: string
    cancelledAt: Date
    cancelledBy: string
  }> {
    const exitNote = await this.exitNotesService.findById(exitNoteId)
    if (!exitNote) {
      throw new Error(`Exit note ${exitNoteId} not found`)
    }

    if (exitNote.status === 'DELIVERED' || exitNote.status === 'CANCELLED') {
      throw new Error(`Cannot cancel exit note in ${exitNote.status} status`)
    }

    // Cancel using main service
    const cancelled = await this.exitNotesService.cancel(
      exitNoteId,
      userId,
      reason
    )

    this.eventService.emit(EventType.EXIT_NOTE_DELIVERY_CANCELLED, {
      exitNoteId,
      exitNoteNumber: cancelled.exitNoteNumber,
      reason,
      cancelledBy: userId,
    })

    return {
      exitNoteId,
      exitNoteNumber: cancelled.exitNoteNumber,
      status: cancelled.status,
      cancelledAt: cancelled.updatedAt,
      cancelledBy: userId,
    }
  }
}
