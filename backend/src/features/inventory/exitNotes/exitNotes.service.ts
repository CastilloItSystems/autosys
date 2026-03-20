/**
 * Exit Notes Service
 * Handles creation, management, and status transitions for all types of inventory exits.
 */

import { PrismaClient, Prisma } from '../../../generated/prisma/client.js'
import { MovementNumberGenerator } from '../shared/utils/movementNumberGenerator.js'
import {
  NotFoundError,
  BadRequestError,
} from '../../../shared/utils/apiError.js'
import { logger } from '../../../shared/utils/logger.js'
import { INVENTORY_MESSAGES } from '../shared/constants/messages.js'
import { PaginationHelper } from '../../../shared/utils/pagination.js'
import { CreateExitNoteDTO, UpdateExitNoteDTO } from './exitNotes.dto.js'
import {
  IExitNote,
  ExitNoteStatus,
  ExitNoteType,
  IExitNoteStatusInfo,
  IExitNoteSummary,
} from './exitNotes.interface.js'

type PrismaClientType = PrismaClient | Prisma.TransactionClient

const MSG = INVENTORY_MESSAGES.exitNote

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const EXIT_NOTE_INCLUDE = {
  items: {
    include: {
      item: { select: { id: true, sku: true, name: true } },
    },
  },
  warehouse: { select: { id: true, name: true, empresaId: true } },
} as const

/** Exit types that DO deduct stock on create (reserve) and cancel (release) */
const STOCK_DEDUCTING_TYPES = new Set<ExitNoteType>([
  ExitNoteType.SALE,
  ExitNoteType.WARRANTY,
  ExitNoteType.LOAN,
  ExitNoteType.INTERNAL_USE,
  ExitNoteType.SAMPLE,
  ExitNoteType.DONATION,
  ExitNoteType.OWNER_PICKUP,
  ExitNoteType.DEMO,
  ExitNoteType.TRANSFER,
  ExitNoteType.OTHER,
])

const MOVEMENT_TYPE_MAP: Record<ExitNoteType, string> = {
  [ExitNoteType.SALE]: 'SALE',
  [ExitNoteType.WARRANTY]: 'SUPPLIER_RETURN',
  [ExitNoteType.LOAN]: 'LOAN_OUT',
  [ExitNoteType.INTERNAL_USE]: 'ADJUSTMENT_OUT',
  [ExitNoteType.SAMPLE]: 'ADJUSTMENT_OUT',
  [ExitNoteType.DONATION]: 'ADJUSTMENT_OUT',
  [ExitNoteType.OWNER_PICKUP]: 'ADJUSTMENT_OUT',
  [ExitNoteType.DEMO]: 'ADJUSTMENT_OUT',
  [ExitNoteType.TRANSFER]: 'TRANSFER',
  [ExitNoteType.LOAN_RETURN]: 'LOAN_RETURN',
  [ExitNoteType.OTHER]: 'ADJUSTMENT_OUT',
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateExitNoteNumber(): string {
  return MovementNumberGenerator.generate('EXIT')
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

class ExitNotesService {
  // -------------------------------------------------------------------------
  // CREATE
  // -------------------------------------------------------------------------

  async create(
    data: CreateExitNoteDTO,
    empresaId: string,
    userId: string,
    db: PrismaClientType
  ): Promise<IExitNote> {
    // TENANT-SAFE: validate warehouse belongs to this company
    const warehouse = await (db as PrismaClient).warehouse.findFirst({
      where: { id: data.warehouseId, empresaId },
    })
    if (!warehouse)
      throw new NotFoundError(INVENTORY_MESSAGES.warehouse.notFound)

    this.validateTypeRequirements(data)

    // Validate items + stock
    const itemNameMap = new Map<string, string>()
    for (const item of data.items) {
      const dbItem = await (db as PrismaClient).item.findFirst({
        where: { id: item.itemId, empresaId },
        select: { id: true, name: true },
      })
      if (!dbItem)
        throw new NotFoundError(`Artículo ${item.itemId} no encontrado`)
      itemNameMap.set(item.itemId, dbItem.name)

      if (STOCK_DEDUCTING_TYPES.has(data.type)) {
        const stock = await (db as PrismaClient).stock.findUnique({
          where: {
            itemId_warehouseId: {
              itemId: item.itemId,
              warehouseId: data.warehouseId,
            },
          },
        })
        if (!stock || stock.quantityAvailable < item.quantity) {
          throw new BadRequestError(
            `Stock insuficiente para artículo ${item.itemId}. ` +
              `Disponible: ${stock?.quantityAvailable ?? 0}, Requerido: ${item.quantity}`
          )
        }
      }

      if (item.serialNumberId) {
        const serial = await (db as PrismaClient).serialNumber.findUnique({
          where: { id: item.serialNumberId },
        })
        if (!serial)
          throw new NotFoundError(
            `Número de serie ${item.serialNumberId} no encontrado`
          )
      }

      if (item.batchId) {
        const batch = await (db as PrismaClient).batch.findUnique({
          where: { id: item.batchId },
        })
        if (!batch)
          throw new NotFoundError(`Lote ${item.batchId} no encontrado`)
      }
    }

    if (data.type === ExitNoteType.SALE && data.preInvoiceId) {
      const preInvoice = await (db as PrismaClient).preInvoice.findFirst({
        where: { id: data.preInvoiceId, empresaId },
      })
      if (!preInvoice)
        throw new NotFoundError(`PreInvoice ${data.preInvoiceId} no encontrada`)
    }

    const exitNote = await (db as PrismaClient).$transaction(async (tx) => {
      const note = await tx.exitNote.create({
        data: {
          exitNoteNumber: generateExitNoteNumber(),
          type: data.type,
          status: ExitNoteStatus.PENDING,
          warehouseId: data.warehouseId,
          preInvoiceId: data.preInvoiceId ?? null,
          recipientName: data.recipientName ?? null,
          recipientId: data.recipientId ?? null,
          recipientPhone: data.recipientPhone ?? null,
          reason: data.reason ?? null,
          reference: data.reference ?? null,
          expectedReturnDate: data.expectedReturnDate ?? null,
          notes: data.notes ?? null,
          authorizedBy: data.authorizedBy ?? userId,
          items: {
            create: data.items.map((item) => ({
              itemId: item.itemId,
              itemName: item.itemName || itemNameMap.get(item.itemId) || null,
              quantity: item.quantity,
              pickedFromLocation: item.pickedFromLocation ?? null,
              batchId: item.batchId ?? null,
              serialNumberId: item.serialNumberId ?? null,
              notes: item.notes ?? null,
            })),
          },
        },
        include: EXIT_NOTE_INCLUDE,
      })

      if (STOCK_DEDUCTING_TYPES.has(data.type)) {
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
            },
          })
        }
      }

      return note
    })

    logger.info(`Nota de salida creada: ${exitNote.id}`, {
      exitNoteNumber: exitNote.exitNoteNumber,
      type: data.type,
      empresaId,
      userId,
    })

    return exitNote as unknown as IExitNote
  }

  // -------------------------------------------------------------------------
  // READ
  // -------------------------------------------------------------------------

  async findById(
    id: string,
    empresaId: string,
    db: PrismaClientType
  ): Promise<IExitNote> {
    const note = await (db as PrismaClient).exitNote.findFirst({
      where: { id, warehouse: { empresaId } },
      include: EXIT_NOTE_INCLUDE,
    })
    if (!note) throw new NotFoundError(MSG.notFound)
    return note as unknown as IExitNote
  }

  async findByNumber(
    exitNoteNumber: string,
    empresaId: string,
    db: PrismaClientType
  ): Promise<IExitNote> {
    const note = await (db as PrismaClient).exitNote.findFirst({
      where: { exitNoteNumber, warehouse: { empresaId } },
      include: EXIT_NOTE_INCLUDE,
    })
    if (!note) throw new NotFoundError(MSG.notFound)
    return note as unknown as IExitNote
  }

  async findAll(
    filters: {
      type?: ExitNoteType
      status?: ExitNoteStatus
      warehouseId?: string
      recipientId?: string
      startDate?: Date
      endDate?: Date
      search?: string
    },
    page: number,
    limit: number,
    empresaId: string,
    db: PrismaClientType,
    sortBy: string = 'createdAt',
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Promise<{ data: IExitNote[]; total: number }> {
    const { skip, take } = PaginationHelper.validateAndParse({ page, limit })

    const where: Prisma.ExitNoteWhereInput = { warehouse: { empresaId } }
    if (filters.type) where.type = filters.type as any
    if (filters.status) where.status = filters.status as any
    if (filters.warehouseId) where.warehouseId = filters.warehouseId
    if (filters.recipientId) where.recipientId = filters.recipientId
    if (filters.startDate || filters.endDate) {
      where.createdAt = {}
      if (filters.startDate) (where.createdAt as any).gte = filters.startDate
      if (filters.endDate) (where.createdAt as any).lte = filters.endDate
    }

    if (filters.search) {
      const search = filters.search.trim()
      where.OR = [
        { exitNoteNumber: { contains: search, mode: 'insensitive' } },
        { recipientName: { contains: search, mode: 'insensitive' } },
        { reference: { contains: search, mode: 'insensitive' } },
        { reason: { contains: search, mode: 'insensitive' } },
      ]
    }

    const validSortFields = new Set([
      'createdAt',
      'exitNoteNumber',
      'type',
      'status',
    ])
    const safeSortBy = validSortFields.has(sortBy) ? sortBy : 'createdAt'

    const [data, total] = await Promise.all([
      (db as PrismaClient).exitNote.findMany({
        where,
        include: EXIT_NOTE_INCLUDE,
        orderBy: { [safeSortBy]: sortOrder },
        skip,
        take,
      }),
      (db as PrismaClient).exitNote.count({ where }),
    ])

    return { data: data as unknown as IExitNote[], total }
  }

  // -------------------------------------------------------------------------
  // UPDATE
  // -------------------------------------------------------------------------

  async update(
    id: string,
    data: UpdateExitNoteDTO,
    empresaId: string,
    db: PrismaClientType
  ): Promise<IExitNote> {
    const exitNote = await (db as PrismaClient).exitNote.findFirst({
      where: { id, warehouse: { empresaId } },
      include: { ...EXIT_NOTE_INCLUDE },
    })
    if (!exitNote) throw new NotFoundError(MSG.notFound)

    if (exitNote.status !== ExitNoteStatus.PENDING) {
      throw new BadRequestError(MSG.cannotEdit)
    }

    const updateData: Prisma.ExitNoteUpdateInput = {}
    if (data.recipientName !== undefined)
      updateData.recipientName = data.recipientName
    if (data.recipientId !== undefined)
      updateData.recipientId = data.recipientId
    if (data.recipientPhone !== undefined)
      updateData.recipientPhone = data.recipientPhone
    if (data.reason !== undefined) updateData.reason = data.reason
    if (data.reference !== undefined) updateData.reference = data.reference
    if (data.notes !== undefined) updateData.notes = data.notes
    if (data.expectedReturnDate !== undefined)
      updateData.expectedReturnDate = data.expectedReturnDate

    // If items provided, replace all items in a transaction
    const itemsProvided = Array.isArray(data.items) && data.items.length > 0

    if (itemsProvided) {
      // Validate all items belong to this company
      const itemIds = data.items!.map((i) => i.itemId)
      const existingItems = await (db as PrismaClient).item.findMany({
        where: { id: { in: itemIds }, empresaId },
        select: { id: true, name: true },
      })
      if (existingItems.length !== itemIds.length) {
        throw new BadRequestError(
          'Uno o más artículos no existen o no pertenecen a esta empresa'
        )
      }
      const itemNameMap = new Map(existingItems.map((i) => [i.id, i.name]))

      // Validate stock for new items
      if (STOCK_DEDUCTING_TYPES.has(exitNote.type as ExitNoteType)) {
        for (const item of data.items!) {
          const stock = await (db as PrismaClient).stock.findUnique({
            where: {
              itemId_warehouseId: {
                itemId: item.itemId,
                warehouseId: exitNote.warehouseId,
              },
            },
          })
          // Add back the old reserved qty for this item if it existed before
          const oldItem = (exitNote.items as any[]).find(
            (i: any) => i.itemId === item.itemId
          )
          const oldReserved = oldItem?.quantity ?? 0
          const available = (stock?.quantityAvailable ?? 0) + oldReserved
          if (available < item.quantity) {
            throw new BadRequestError(
              `Stock insuficiente para artículo ${item.itemId}. ` +
                `Disponible: ${available}, Requerido: ${item.quantity}`
            )
          }
        }
      }

      const updated = await (db as PrismaClient).$transaction(async (tx) => {
        // Release old stock reservations
        if (STOCK_DEDUCTING_TYPES.has(exitNote.type as ExitNoteType)) {
          for (const oldItem of exitNote.items as any[]) {
            await tx.stock.update({
              where: {
                itemId_warehouseId: {
                  itemId: oldItem.itemId,
                  warehouseId: exitNote.warehouseId,
                },
              },
              data: {
                quantityReserved: { decrement: oldItem.quantity },
                quantityAvailable: { increment: oldItem.quantity },
              },
            })
          }
        }

        // Delete old items
        await tx.exitNoteItem.deleteMany({ where: { exitNoteId: id } })

        // Create new items
        for (const item of data.items!) {
          await tx.exitNoteItem.create({
            data: {
              exitNoteId: id,
              itemId: item.itemId,
              itemName: item.itemName || itemNameMap.get(item.itemId) || null,
              quantity: item.quantity,
              pickedFromLocation: item.pickedFromLocation ?? null,
              batchId: item.batchId ?? null,
              serialNumberId: item.serialNumberId ?? null,
              notes: item.notes ?? null,
            },
          })
        }

        // Reserve new stock
        if (STOCK_DEDUCTING_TYPES.has(exitNote.type as ExitNoteType)) {
          for (const item of data.items!) {
            await tx.stock.update({
              where: {
                itemId_warehouseId: {
                  itemId: item.itemId,
                  warehouseId: exitNote.warehouseId,
                },
              },
              data: {
                quantityReserved: { increment: item.quantity },
                quantityAvailable: { decrement: item.quantity },
              },
            })
          }
        }

        // Update header
        return tx.exitNote.update({
          where: { id },
          data: updateData,
          include: EXIT_NOTE_INCLUDE,
        })
      })

      logger.info(`Nota de salida actualizada con items: ${id}`, { empresaId })
      return updated as unknown as IExitNote
    }

    // No items — just update header
    const updated = await (db as PrismaClient).exitNote.update({
      where: { id },
      data: updateData,
      include: EXIT_NOTE_INCLUDE,
    })

    logger.info(`Nota de salida actualizada: ${id}`, { empresaId })
    return updated as unknown as IExitNote
  }

  // -------------------------------------------------------------------------
  // LIFECYCLE TRANSITIONS
  // -------------------------------------------------------------------------

  async startPreparing(
    id: string,
    empresaId: string,
    userId: string,
    db: PrismaClientType
  ): Promise<IExitNote> {
    const exitNote = await this.findById(id, empresaId, db)

    if (exitNote.status !== ExitNoteStatus.PENDING) {
      throw new BadRequestError(MSG.cannotEdit)
    }

    const updated = await (db as PrismaClient).exitNote.update({
      where: { id },
      data: { status: ExitNoteStatus.IN_PROGRESS, reservedAt: new Date() },
      include: EXIT_NOTE_INCLUDE,
    })

    logger.info(`Nota de salida iniciada: ${id}`, { empresaId, userId })

    return updated as unknown as IExitNote
  }

  async markAsReady(
    id: string,
    empresaId: string,
    userId: string,
    db: PrismaClientType
  ): Promise<IExitNote> {
    const exitNote = await this.findById(id, empresaId, db)

    if (exitNote.status !== ExitNoteStatus.IN_PROGRESS) {
      throw new BadRequestError(MSG.cannotDeliver)
    }

    const updated = await (db as PrismaClient).exitNote.update({
      where: { id },
      data: {
        status: ExitNoteStatus.READY,
        preparedAt: new Date(),
        preparedBy: userId,
      },
      include: EXIT_NOTE_INCLUDE,
    })

    logger.info(`Nota de salida lista: ${id}`, { empresaId, userId })

    return updated as unknown as IExitNote
  }

  async deliver(
    id: string,
    empresaId: string,
    userId: string,
    db: PrismaClientType
  ): Promise<IExitNote> {
    const exitNote = await this.findById(id, empresaId, db)

    if (exitNote.status !== ExitNoteStatus.READY) {
      throw new BadRequestError(MSG.cannotDeliver)
    }

    const updated = await (db as PrismaClient).$transaction(async (tx) => {
      const note = await tx.exitNote.update({
        where: { id },
        data: {
          status: ExitNoteStatus.DELIVERED,
          deliveredAt: new Date(),
          deliveredBy: userId,
        },
        include: EXIT_NOTE_INCLUDE,
      })

      for (const item of note.items as Array<{
        itemId: string
        quantity: number
      }>) {
        await tx.movement.create({
          data: {
            movementNumber: MovementNumberGenerator.generate('MOV'),
            itemId: item.itemId,
            warehouseFromId: note.warehouseId,
            type: MOVEMENT_TYPE_MAP[note.type as ExitNoteType] as never,
            quantity: item.quantity,
            reference: note.exitNoteNumber,
            notes: note.notes ?? '',
            createdBy: userId,
            exitNoteId: note.id,
          },
        })

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
            lastMovementAt: new Date(),
          },
        })
      }

      await this.handleTypeSpecificDelivery(tx, note, userId)

      return note
    })

    logger.info(`Nota de salida entregada: ${id}`, { empresaId, userId })

    return updated as unknown as IExitNote
  }

  async cancel(
    id: string,
    empresaId: string,
    reason: string,
    userId: string,
    db: PrismaClientType
  ): Promise<IExitNote> {
    const exitNote = await this.findById(id, empresaId, db)

    if (
      exitNote.status !== ExitNoteStatus.PENDING &&
      exitNote.status !== ExitNoteStatus.IN_PROGRESS
    ) {
      throw new BadRequestError(MSG.cancelled)
    }

    const updated = await (db as PrismaClient).$transaction(async (tx) => {
      if (STOCK_DEDUCTING_TYPES.has(exitNote.type)) {
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
            },
          })
        }
      }

      return tx.exitNote.update({
        where: { id },
        data: {
          status: ExitNoteStatus.CANCELLED,
          notes: exitNote.notes
            ? `${exitNote.notes} [CANCELADO: ${reason}]`
            : `[CANCELADO: ${reason}]`,
        },
        include: EXIT_NOTE_INCLUDE,
      })
    })

    logger.info(`Nota de salida cancelada: ${id}`, {
      empresaId,
      userId,
      reason,
    })

    return updated as unknown as IExitNote
  }

  // -------------------------------------------------------------------------
  // INFO QUERIES
  // -------------------------------------------------------------------------

  async getStatusInfo(
    id: string,
    empresaId: string,
    db: PrismaClientType
  ): Promise<IExitNoteStatusInfo> {
    const exitNote = await this.findById(id, empresaId, db)

    const result: IExitNoteStatusInfo = {
      id: exitNote.id,
      exitNoteNumber: exitNote.exitNoteNumber,
      currentStatus: exitNote.status,
      type: exitNote.type,
      totalItems: exitNote.items.length,
      itemsPicked: exitNote.items.length,
      isReadyForDelivery: exitNote.status === ExitNoteStatus.READY,
      canBeCancelled:
        exitNote.status === ExitNoteStatus.PENDING ||
        exitNote.status === ExitNoteStatus.IN_PROGRESS,
      canBeResumed: exitNote.status === ExitNoteStatus.PENDING,
      lastStatusChangeAt: exitNote.updatedAt,
    }

    const lastModifiedBy = exitNote.preparedBy ?? exitNote.deliveredBy
    if (lastModifiedBy) result.lastModifiedBy = lastModifiedBy

    return result
  }

  async getSummary(
    id: string,
    empresaId: string,
    db: PrismaClientType
  ): Promise<IExitNoteSummary> {
    const exitNote = await this.findById(id, empresaId, db)

    const result: IExitNoteSummary = {
      id: exitNote.id,
      exitNoteNumber: exitNote.exitNoteNumber,
      type: exitNote.type,
      status: exitNote.status,
      itemCount: exitNote.items.length,
      createdAt: exitNote.createdAt,
    }

    if (exitNote.recipientName) result.recipientName = exitNote.recipientName
    if (exitNote.preparedAt) result.preparedAt = exitNote.preparedAt
    if (exitNote.deliveredAt) result.deliveredAt = exitNote.deliveredAt

    return result
  }

  // -------------------------------------------------------------------------
  // Private helpers
  // -------------------------------------------------------------------------

  private validateTypeRequirements(data: CreateExitNoteDTO): void {
    switch (data.type) {
      case ExitNoteType.SALE:
        if (!data.preInvoiceId)
          throw new BadRequestError('preInvoiceId es requerido para SALE')
        break
      case ExitNoteType.WARRANTY:
        if (!data.recipientName)
          throw new BadRequestError('recipientName es requerido para WARRANTY')
        break
      case ExitNoteType.LOAN:
        if (!data.recipientName)
          throw new BadRequestError('recipientName es requerido para LOAN')
        if (!data.expectedReturnDate)
          throw new BadRequestError('expectedReturnDate es requerido para LOAN')
        break
      case ExitNoteType.DONATION:
        if (!data.authorizedBy)
          throw new BadRequestError('authorizedBy es requerido para DONATION')
        break
      case ExitNoteType.OWNER_PICKUP:
        if (!data.recipientId)
          throw new BadRequestError(
            'recipientId es requerido para OWNER_PICKUP'
          )
        if (!data.authorizedBy)
          throw new BadRequestError(
            'authorizedBy es requerido para OWNER_PICKUP'
          )
        break
      case ExitNoteType.OTHER:
        if (!data.reason)
          throw new BadRequestError('reason es requerido para OTHER')
        break
    }
  }

  private async handleTypeSpecificDelivery(
    tx: Prisma.TransactionClient,
    exitNote: Record<string, unknown>,
    userId: string
  ): Promise<void> {
    const type = exitNote.type as ExitNoteType
    const items = exitNote.items as Array<{
      itemId: string
      serialNumberId?: string
    }>

    switch (type) {
      case ExitNoteType.LOAN:
        await tx.loan.create({
          data: {
            loanNumber: MovementNumberGenerator.generate('LOAN'),
            borrowerName: exitNote.recipientName as string,
            borrowerId: (exitNote.recipientId as string) ?? null,
            warehouseId: exitNote.warehouseId as string,
            startDate: new Date(),
            dueDate: (exitNote.expectedReturnDate as Date) ?? null,
            createdBy: userId,
            exitNote: { connect: { id: exitNote.id as string } },
          },
        })
        break

      case ExitNoteType.WARRANTY:
        for (const item of items) {
          if (item.serialNumberId) {
            await tx.serialNumber.update({
              where: { id: item.serialNumberId },
              data: { status: 'WARRANTY' as never },
            })
          }
        }
        break
    }
  }
}

export default new ExitNotesService()
