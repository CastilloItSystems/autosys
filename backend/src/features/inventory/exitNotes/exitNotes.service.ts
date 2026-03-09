/**
 * Exit Notes Service
 * Handles creation, management, and status transitions for all types of inventory exits
 *
 * Each exit type has specific requirements:
 * - SALE: Must link to PreInvoice
 * - WARRANTY: Validates SerialNumber, affects warranty balance
 * - LOAN: Creates Loan record, expects return
 * - INTERNAL_USE: Simple consumption
 * - SAMPLE: Promotional/sample units
 * - DONATION: Charitable, requires authorization
 * - OWNER_PICKUP: Owner collecting items, requires verification
 * - DEMO: Demonstration unit with expected return
 * - TRANSFER: To another warehouse
 * - LOAN_RETURN: Return of previous loan
 * - OTHER: Miscellaneous with free-text reason
 */

import prismaClient from '../../../services/prisma.service'
import { EventService } from '../../../shared/events/event.service'
import { EventType } from '../../../shared/types/event.types'
import { MovementNumberGenerator } from '../shared/utils/movementNumberGenerator'
import {
  CreateExitNoteDTO,
  UpdateExitNoteDTO,
  ExitNoteResponseDTO,
  ExitNoteListResponseDTO,
} from './exitNotes.dto'
import {
  IExitNote,
  ExitNoteStatus,
  ExitNoteType,
  IExitNoteStatusInfo,
  IExitNoteSummary,
} from './exitNotes.interface'
import reservationService from '../reservations/reservations.service'

export class ExitNotesService {
  private static instance: ExitNotesService
  private prisma: PrismaClient
  private eventService: EventService

  private constructor() {
    this.prisma = prismaClient
    this.eventService = EventService.getInstance()
  }

  public static getInstance(): ExitNotesService {
    if (!ExitNotesService.instance) {
      ExitNotesService.instance = new ExitNotesService()
    }
    return ExitNotesService.instance
  }

  /**
   * Create a new exit note
   * Validates type-specific requirements before creation
   */
  async create(data: CreateExitNoteDTO, userId: string): Promise<IExitNote> {
    // Validate type-specific requirements
    await this.validateExitNoteType(data)

    // Validate warehouse exists
    const warehouse = await this.prisma.warehouse.findUnique({
      where: { id: data.warehouseId },
    })
    if (!warehouse) {
      throw new Error(`Warehouse ${data.warehouseId} not found`)
    }

    // Validate all items exist and have stock
    for (const item of data.items) {
      const dbItem = await this.prisma.item.findUnique({
        where: { id: item.itemId },
      })
      if (!dbItem) {
        throw new Error(`Item ${item.itemId} not found`)
      }

      // For non-LOAN_RETURN, validate stock availability
      if (data.type !== ExitNoteType.LOAN_RETURN) {
        const stock = await this.prisma.stock.findUnique({
          where: {
            itemId_warehouseId: {
              itemId: item.itemId,
              warehouseId: data.warehouseId,
            },
          },
        })

        if (!stock || stock.quantityAvailable < item.quantity) {
          throw new Error(
            `Insufficient stock for item ${item.itemId} in warehouse. ` +
              `Available: ${stock?.quantityAvailable || 0}, Requested: ${item.quantity}`
          )
        }
      }

      // Validate serial number if provided
      if (item.serialNumberId) {
        const serial = await this.prisma.serialNumber.findUnique({
          where: { id: item.serialNumberId },
        })
        if (!serial) {
          throw new Error(`Serial number ${item.serialNumberId} not found`)
        }
      }

      // Validate batch if provided
      if (item.batchId) {
        const batch = await this.prisma.batch.findUnique({
          where: { id: item.batchId },
        })
        if (!batch) {
          throw new Error(`Batch ${item.batchId} not found`)
        }
      }
    }

    // Generate exit note number
    const exitNoteNumber = await this.generateExitNoteNumber()

    // Create exit note and update stock reservations in transaction
    const exitNote = await this.prisma.$transaction(async (tx) => {
      // 1. Create exit note
      const note = await tx.exitNote.create({
        data: {
          exitNoteNumber,
          type: data.type,
          status: ExitNoteStatus.PENDING,
          warehouseId: data.warehouseId,
          preInvoiceId: data.preInvoiceId,
          recipientName: data.recipientName,
          recipientId: data.recipientId,
          recipientPhone: data.recipientPhone,
          reason: data.reason,
          reference: data.reference,
          expectedReturnDate: data.expectedReturnDate,
          notes: data.notes,
          authorizedBy: data.authorizedBy,
          items: {
            create: data.items.map((item) => ({
              itemId: item.itemId,
              quantity: item.quantity,
              pickedFromLocation: item.pickedFromLocation,
              batchId: item.batchId,
              serialNumberId: item.serialNumberId,
              notes: item.notes,
            })),
          },
        },
        include: { items: true },
      })

      // 2. Reserve stock (increase reserved, decrease available)
      if (data.type !== ExitNoteType.LOAN_RETURN) {
        for (const item of data.items) {
          await tx.stock.update({
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

      return note
    })

    // Emit event
    this.eventService.emit({
      type: EventType.EXIT_NOTE_CREATED,
      entityId: exitNote.id,
      entityType: 'exitNote',
      userId: data.authorizedBy || userId,
      data: {
        exitNoteNumber,
        exitType: data.type,
        itemCount: data.items.length,
        warehouseId: data.warehouseId,
      },
    })

    // 3. Auto-create reservations for each item (PHASE 1: Auto-reserve)
    if (data.type !== ExitNoteType.LOAN_RETURN) {
      for (const item of data.items) {
        try {
          await reservationService.create(
            {
              itemId: item.itemId,
              warehouseId: data.warehouseId,
              quantity: item.quantity,
              exitNoteId: exitNote.id,
              reference: `Auto-created for ExitNote ${exitNote.exitNoteNumber}`,
              notes: data.notes,
              createdBy: userId || data.authorizedBy,
            },
            userId || data.authorizedBy
          )
        } catch (reservationError) {
          // Log warning but don't fail the exit note creation
          console.warn(
            `Failed to create auto-reservation for item ${item.itemId} in exit note ${exitNote.id}:`,
            reservationError
          )
        }
      }
    }

    return exitNote as IExitNote
  }

  /**
   * Find exit note by ID
   */
  async findById(id: string): Promise<IExitNote | null> {
    return this.prisma.exitNote.findUnique({
      where: { id },
      include: { items: true },
    }) as Promise<IExitNote | null>
  }

  /**
   * Find exit note by number
   */
  async findByNumber(exitNoteNumber: string): Promise<IExitNote | null> {
    return this.prisma.exitNote.findUnique({
      where: { exitNoteNumber },
      include: { items: true },
    }) as Promise<IExitNote | null>
  }

  /**
   * Get all exit notes with filters
   */
  async findAll(
    filters: {
      type?: ExitNoteType
      status?: ExitNoteStatus
      warehouseId?: string
      recipientId?: string
      startDate?: Date
      endDate?: Date
    },
    page: number = 1,
    limit: number = 20
  ): Promise<{ data: IExitNote[]; total: number }> {
    const skip = (page - 1) * limit

    const where: any = {}
    if (filters.type) where.type = filters.type
    if (filters.status) where.status = filters.status
    if (filters.warehouseId) where.warehouseId = filters.warehouseId
    if (filters.recipientId) where.recipientId = filters.recipientId
    if (filters.startDate || filters.endDate) {
      where.createdAt = {}
      if (filters.startDate) where.createdAt.gte = filters.startDate
      if (filters.endDate) where.createdAt.lte = filters.endDate
    }

    const [data, total] = await Promise.all([
      this.prisma.exitNote.findMany({
        where,
        include: { items: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.exitNote.count({ where }),
    ])

    return { data: data as IExitNote[], total }
  }

  /**
   * Find exit notes by warehouse
   */
  async findByWarehouse(
    warehouseId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{ data: IExitNote[]; total: number }> {
    return this.findAll({ warehouseId }, page, limit)
  }

  /**
   * Find exit notes by type
   */
  async findByType(
    type: ExitNoteType,
    page: number = 1,
    limit: number = 20
  ): Promise<{ data: IExitNote[]; total: number }> {
    return this.findAll({ type }, page, limit)
  }

  /**
   * Find exit notes by status
   */
  async findByStatus(
    status: ExitNoteStatus,
    page: number = 1,
    limit: number = 20
  ): Promise<{ data: IExitNote[]; total: number }> {
    return this.findAll({ status }, page, limit)
  }

  /**
   * Update exit note (only in PENDING status)
   */
  async update(id: string, data: UpdateExitNoteDTO): Promise<IExitNote> {
    const exitNote = await this.findById(id)
    if (!exitNote) {
      throw new Error(`Exit note ${id} not found`)
    }

    if (exitNote.status !== ExitNoteStatus.PENDING) {
      throw new Error(
        `Cannot update exit note in ${exitNote.status} status. Only PENDING notes can be updated.`
      )
    }

    const updated = await this.prisma.exitNote.update({
      where: { id },
      data: {
        recipientName: data.recipientName,
        recipientId: data.recipientId,
        recipientPhone: data.recipientPhone,
        reason: data.reason,
        reference: data.reference,
        notes: data.notes,
        expectedReturnDate: data.expectedReturnDate,
        updatedAt: new Date(),
      },
      include: { items: true },
    })

    this.eventService.emit({
      type: EventType.EXIT_NOTE_UPDATED,
      entityId: id,
      entityType: 'exitNote',
      userId,
      data: {
        exitNoteNumber: updated.exitNoteNumber,
        status: updated.status,
      },
    })

    return updated as IExitNote
  }

  /**
   * Start preparing exit note (PENDING -> IN_PROGRESS)
   */
  async startPreparing(id: string, userId: string): Promise<IExitNote> {
    const exitNote = await this.findById(id)
    if (!exitNote) {
      throw new Error(`Exit note ${id} not found`)
    }

    if (exitNote.status !== ExitNoteStatus.PENDING) {
      throw new Error(
        `Cannot start preparing. Exit note is in ${exitNote.status} status.`
      )
    }

    const updated = await this.prisma.exitNote.update({
      where: { id },
      data: {
        status: ExitNoteStatus.IN_PROGRESS,
        reservedAt: new Date(),
        updatedAt: new Date(),
      },
      include: { items: true },
    })

    this.eventService.emit({
      type: EventType.EXIT_NOTE_STARTED,
      entityId: id,
      entityType: 'exitNote',
      userId,
      data: {
        exitNoteNumber: updated.exitNoteNumber,
        status: ExitNoteStatus.IN_PROGRESS,
      },
    })

    return updated as IExitNote
  }

  /**
   * Mark as ready for delivery (IN_PROGRESS -> READY)
   */
  async markAsReady(id: string, userId: string): Promise<IExitNote> {
    const exitNote = await this.findById(id)
    if (!exitNote) {
      throw new Error(`Exit note ${id} not found`)
    }

    if (exitNote.status !== ExitNoteStatus.IN_PROGRESS) {
      throw new Error(
        `Cannot mark as ready. Exit note is in ${exitNote.status} status.`
      )
    }

    const updated = await this.prisma.exitNote.update({
      where: { id },
      data: {
        status: ExitNoteStatus.READY,
        preparedAt: new Date(),
        preparedBy: userId,
        updatedAt: new Date(),
      },
      include: { items: true },
    })

    this.eventService.emit({
      type: EventType.EXIT_NOTE_READY,
      entityId: id,
      entityType: 'exitNote',
      userId,
      data: {
        exitNoteNumber: updated.exitNoteNumber,
        status: ExitNoteStatus.READY_FOR_DELIVERY,
      },
    })

    return updated as IExitNote
  }

  /**
   * Deliver exit note (READY -> DELIVERED)
   * Creates movements and updates stock based on type
   */
  async deliver(id: string, userId: string): Promise<IExitNote> {
    const exitNote = await this.findById(id)
    if (!exitNote) {
      throw new Error(`Exit note ${id} not found`)
    }

    if (exitNote.status !== ExitNoteStatus.READY) {
      throw new Error(
        `Cannot deliver. Exit note is in ${exitNote.status} status.`
      )
    }

    // Use transaction to ensure atomicity
    const updated = await this.prisma.$transaction(async (tx) => {
      // Update exit note status
      const note = await tx.exitNote.update({
        where: { id },
        data: {
          status: ExitNoteStatus.DELIVERED,
          deliveredAt: new Date(),
          deliveredBy: userId,
          updatedAt: new Date(),
        },
        include: { items: true },
      })

      // Create movements for each item (deduct from source warehouse)
      const movements = []
      for (const item of note.items) {
        const movementNumber =
          await MovementNumberGenerator.generateMovementNumber(tx, 'MOV')
        const movement = await tx.movement.create({
          data: {
            movementNumber,
            itemId: item.itemId,
            warehouseFromId: note.warehouseId,
            type: this.getMovementType(note.type),
            quantity: item.quantity,
            reference: note.exitNoteNumber,
            notes: note.notes || '',
            createdBy: userId,
            exitNoteId: note.id,
            exitType: note.type,
          },
        })
        movements.push(movement)
      }

      // Update stock (deduct quantities)
      for (const item of note.items) {
        const stock = await tx.stock.findUnique({
          where: {
            itemId_warehouseId: {
              itemId: item.itemId,
              warehouseId: note.warehouseId,
            },
          },
        })

        if (stock) {
          await tx.stock.update({
            where: {
              itemId_warehouseId: {
                itemId: item.itemId,
                warehouseId: note.warehouseId,
              },
            },
            data: {
              quantityReal: { decrement: item.quantity },
              quantityReserved: { decrement: item.quantity },
              updatedAt: new Date(),
            },
          })
        }
      }

      // Handle type-specific logic
      await this.handleTypeSpecificDelivery(tx, note, userId)

      return note
    })

    this.eventService.emit({
      type: EventType.EXIT_NOTE_DELIVERED,
      entityId: id,
      entityType: 'exitNote',
      userId,
      data: {
        exitNoteNumber: updated.exitNoteNumber,
        status: ExitNoteStatus.DELIVERED,
      },
    })

    return updated as IExitNote
  }

  /**
   * Cancel exit note (only from PENDING or IN_PROGRESS status)
   */
  async cancel(id: string, userId: string, reason: string): Promise<IExitNote> {
    const exitNote = await this.findById(id)
    if (!exitNote) {
      throw new Error(`Exit note ${id} not found`)
    }

    if (
      exitNote.status !== ExitNoteStatus.PENDING &&
      exitNote.status !== ExitNoteStatus.IN_PROGRESS
    ) {
      throw new Error(
        `Cannot cancel. Exit note in ${exitNote.status} status cannot be cancelled.`
      )
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      // 1. Release reserved stock
      if (exitNote.type !== ExitNoteType.LOAN_RETURN) {
        for (const item of exitNote.items) {
          await tx.stock.update({
            where: {
              itemId_warehouseId: {
                itemId: item.itemId,
                warehouseId: exitNote.warehouseId,
              },
            },
            data: {
              quantityReserved: { decrement: item.quantity },
              quantityAvailable: { increment: item.quantity },
              updatedAt: new Date(),
            },
          })
        }
      }

      // 2. Update status
      return tx.exitNote.update({
        where: { id },
        data: {
          status: ExitNoteStatus.CANCELLED,
          notes: `${exitNote.notes || ''} [CANCELLED: ${reason}]`,
          updatedAt: new Date(),
        },
        include: { items: true },
      })
    })

    this.eventService.emit({
      type: EventType.EXIT_NOTE_CANCELLED,
      entityId: id,
      entityType: 'exitNote',
      userId,
      data: {
        exitNoteNumber: updated.exitNoteNumber,
        status: ExitNoteStatus.CANCELLED,
      },
    })

    // 3. Auto-release reservations for this exit note (PHASE 1: Auto-reserve)
    if (exitNote.type !== ExitNoteType.LOAN_RETURN) {
      try {
        const reservations = await this.prisma.reservation.findMany({
          where: {
            exitNoteId: id,
            status: { in: ['ACTIVE', 'PENDING_PICKUP'] },
          },
        })

        for (const reservation of reservations) {
          try {
            await reservationService.release(
              reservation.id,
              `Auto-released due to ExitNote ${updated.exitNoteNumber} cancellation: ${reason}`,
              userId
            )
          } catch (releaseError) {
            console.warn(
              `Failed to release reservation ${reservation.id}:`,
              releaseError
            )
          }
        }
      } catch (reservationError) {
        console.warn(
          `Failed to auto-release reservations for exit note ${id}:`,
          reservationError
        )
      }
    }

    return updated as IExitNote
  }

  /**
   * Get exit note status info
   */
  async getStatusInfo(id: string): Promise<IExitNoteStatusInfo> {
    const exitNote = await this.findById(id)
    if (!exitNote) {
      throw new Error(`Exit note ${id} not found`)
    }

    return {
      id: exitNote.id,
      exitNoteNumber: exitNote.exitNoteNumber,
      currentStatus: exitNote.status,
      type: exitNote.type,
      totalItems: exitNote.items.length,
      itemsPicked: exitNote.items.length, // Simplified - would track actual picked items in detailed tracking
      isReadyForDelivery: exitNote.status === ExitNoteStatus.READY,
      canBeCancelled:
        exitNote.status === ExitNoteStatus.PENDING ||
        exitNote.status === ExitNoteStatus.IN_PROGRESS,
      canBeResumed: exitNote.status === ExitNoteStatus.PENDING,
      lastStatusChangeAt: exitNote.updatedAt,
      lastModifiedBy: exitNote.preparedBy || exitNote.deliveredBy,
    }
  }

  /**
   * Get summary of exit notes
   */
  async getSummary(id: string): Promise<IExitNoteSummary> {
    const exitNote = await this.findById(id)
    if (!exitNote) {
      throw new Error(`Exit note ${id} not found`)
    }

    return {
      id: exitNote.id,
      exitNoteNumber: exitNote.exitNoteNumber,
      type: exitNote.type,
      status: exitNote.status,
      recipientName: exitNote.recipientName,
      itemCount: exitNote.items.length,
      createdAt: exitNote.createdAt,
      preparedAt: exitNote.preparedAt,
      deliveredAt: exitNote.deliveredAt,
    }
  }

  /**
   * Validate type-specific requirements
   */
  private async validateExitNoteType(data: CreateExitNoteDTO): Promise<void> {
    switch (data.type) {
      case ExitNoteType.SALE:
        if (!data.preInvoiceId) {
          throw new Error('preInvoiceId is required for SALE exits')
        }
        const preInvoice = await this.prisma.preInvoice.findUnique({
          where: { id: data.preInvoiceId },
        })
        if (!preInvoice) {
          throw new Error(`PreInvoice ${data.preInvoiceId} not found`)
        }
        break

      case ExitNoteType.WARRANTY:
        if (!data.recipientName) {
          throw new Error('recipientName is required for WARRANTY exits')
        }
        break

      case ExitNoteType.LOAN:
        if (!data.recipientName) {
          throw new Error('recipientName is required for LOAN exits')
        }
        if (!data.expectedReturnDate) {
          throw new Error('expectedReturnDate is required for LOAN exits')
        }
        break

      case ExitNoteType.DONATION:
        if (!data.authorizedBy) {
          throw new Error('authorizedBy is required for DONATION exits')
        }
        break

      case ExitNoteType.OWNER_PICKUP:
        if (!data.recipientId) {
          throw new Error('recipientId is required for OWNER_PICKUP exits')
        }
        if (!data.authorizedBy) {
          throw new Error('authorizedBy is required for OWNER_PICKUP exits')
        }
        break

      case ExitNoteType.OTHER:
        if (!data.reason) {
          throw new Error('reason is required for OTHER type exits')
        }
        break

      // Other types have minimal requirements
    }
  }

  /**
   * Handle type-specific logic after delivery
   */
  private async handleTypeSpecificDelivery(
    tx: any,
    exitNote: any,
    userId: string
  ): Promise<void> {
    switch (exitNote.type) {
      case ExitNoteType.LOAN:
        // Create Loan record
        await tx.loan.create({
          data: {
            loanNumber: `LOAN-${Date.now()}`,
            borrowerName: exitNote.recipientName,
            borrowerId: exitNote.recipientId,
            warehouseId: exitNote.warehouseId,
            startDate: new Date(),
            dueDate: exitNote.expectedReturnDate,
            createdBy: userId,
            exitNote: { connect: { id: exitNote.id } },
          },
        })
        break

      case ExitNoteType.SALE:
        // Update PreInvoice status if needed
        if (exitNote.preInvoiceId) {
          // Could update pre-invoice status to reflect that items have been delivered
        }
        break

      case ExitNoteType.WARRANTY:
        // Update SerialNumber tracking
        for (const item of exitNote.items) {
          if (item.serialNumberId) {
            await tx.serialNumber.update({
              where: { id: item.serialNumberId },
              data: {
                status: 'WARRANTY', // Assuming WARRANTY is a valid status
              },
            })
          }
        }
        break

      // Other types don't require additional logic yet
    }
  }

  /**
   * Get movement type based on exit note type
   */
  private getMovementType(exitNoteType: ExitNoteType): string {
    switch (exitNoteType) {
      case ExitNoteType.SALE:
        return 'SALE'
      case ExitNoteType.WARRANTY:
        return 'SUPPLIER_RETURN'
      case ExitNoteType.LOAN:
        return 'LOAN_OUT'
      case ExitNoteType.INTERNAL_USE:
        return 'ADJUSTMENT_OUT'
      case ExitNoteType.SAMPLE:
        return 'ADJUSTMENT_OUT'
      case ExitNoteType.DONATION:
        return 'ADJUSTMENT_OUT'
      case ExitNoteType.OWNER_PICKUP:
        return 'ADJUSTMENT_OUT'
      case ExitNoteType.DEMO:
        return 'ADJUSTMENT_OUT'
      case ExitNoteType.TRANSFER:
        return 'TRANSFER'
      case ExitNoteType.LOAN_RETURN:
        return 'LOAN_RETURN'
      case ExitNoteType.OTHER:
        return 'ADJUSTMENT_OUT'
      default:
        return 'ADJUSTMENT_OUT'
    }
  }

  /**
   * Generate sequential exit note number
   */
  private async generateExitNoteNumber(): Promise<string> {
    const count = await this.prisma.exitNote.count()
    const year = new Date().getFullYear()
    const sequence = String(count + 1).padStart(5, '0')
    return `EXIT-${year}-${sequence}`
  }
}
