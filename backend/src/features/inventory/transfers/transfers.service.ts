// backend/src/features/inventory/transfers/transfers.service.ts

import {
  PrismaClient,
  Prisma,
  MovementType,
} from '../../../generated/prisma/client.js'
import { logger } from '../../../shared/utils/logger.js'
import {
  NotFoundError,
  BadRequestError,
} from '../../../shared/utils/apiError.js'
import { MovementNumberGenerator } from '../shared/utils/movementNumberGenerator.js'
import { PaginationHelper } from '../../../shared/utils/pagination.js'
import { INVENTORY_MESSAGES } from '../shared/constants/messages.js'

const MSG = INVENTORY_MESSAGES.transfer
import {
  ITransferWithRelations,
  ICreateTransferInput,
  IUpdateTransferInput,
  IRejectTransferInput,
  ITransferFilters,
  TransferStatus,
} from './transfers.interface.js'

type PrismaClientType = PrismaClient | Prisma.TransactionClient

// ─── Helpers ────────────────────────────────────────────────────────────────

function generateTransferNumber(): string {
  return MovementNumberGenerator.generate('TRANS')
}

const NOTE_INCLUDE = {
  exitNote: { select: { id: true, exitNoteNumber: true, status: true } },
  entryNote: { select: { id: true, entryNoteNumber: true, status: true } },
}

const FULL_INCLUDE = {
  items: { include: { item: true } },
  fromWarehouse: true,
  toWarehouse: true,
  ...NOTE_INCLUDE,
}

const LIST_INCLUDE = {
  fromWarehouse: { select: { id: true, name: true } },
  toWarehouse: { select: { id: true, name: true } },
  ...NOTE_INCLUDE,
}

// ─── Service ────────────────────────────────────────────────────────────────

class TransfersService {
  /**
   * Create a new transfer in DRAFT status.
   * Stock validation happens at approve() — not here.
   */
  async create(
    input: ICreateTransferInput,
    userId: string,
    empresaId: string,
    db: PrismaClientType
  ): Promise<ITransferWithRelations> {
    logger.info('Creating transfer', {
      fromWarehouse: input.fromWarehouseId,
      toWarehouse: input.toWarehouseId,
    })

    // Validate warehouses belong to tenant
    const [fromWh, toWh] = await Promise.all([
      (db as PrismaClient).warehouse.findFirst({
        where: { id: input.fromWarehouseId, empresaId },
      }),
      (db as PrismaClient).warehouse.findFirst({
        where: { id: input.toWarehouseId, empresaId },
      }),
    ])

    if (!fromWh) throw new NotFoundError(MSG.warehouseNotFound)
    if (!toWh) throw new NotFoundError(MSG.warehouseNotFound)

    if (input.fromWarehouseId === input.toWarehouseId) {
      throw new BadRequestError(MSG.sameWarehouse)
    }

    // Validate all items belong to tenant
    const itemIds = input.items.map((i) => i.itemId)
    const itemRecords = await (db as PrismaClient).item.findMany({
      where: { id: { in: itemIds }, empresaId },
    })

    if (itemRecords.length !== itemIds.length) {
      throw new NotFoundError(MSG.itemNotFound)
    }

    const totalQuantity = input.items.reduce((sum, i) => sum + i.quantity, 0)

    const transfer = await (db as PrismaClient).transfer.create({
      data: {
        transferNumber: generateTransferNumber(),
        fromWarehouseId: input.fromWarehouseId,
        toWarehouseId: input.toWarehouseId,
        status: TransferStatus.DRAFT as any,
        quantity: totalQuantity,
        notes: input.notes ?? null,
        createdBy: userId,
        items: {
          create: input.items.map((item) => ({
            itemId: item.itemId,
            quantity: item.quantity,
            unitCost: item.unitCost ?? null,
            notes: item.notes ?? null,
          })),
        },
      },
      include: FULL_INCLUDE,
    })

    logger.info('Transfer created', {
      transferId: transfer.id,
      transferNumber: transfer.transferNumber,
    })

    return transfer as ITransferWithRelations
  }

  /**
   * Find transfer by ID — tenant-safe via warehouse relation
   */
  async findById(
    id: string,
    empresaId: string,
    db: PrismaClientType
  ): Promise<ITransferWithRelations> {
    const transfer = await (db as PrismaClient).transfer.findFirst({
      where: {
        id,
        fromWarehouse: { empresaId },
      },
      include: FULL_INCLUDE,
    })

    if (!transfer) throw new NotFoundError(MSG.notFound)

    return transfer as ITransferWithRelations
  }

  /**
   * List transfers with pagination and filters — tenant-safe
   */
  async findAll(
    filters: ITransferFilters,
    page: number,
    limit: number,
    empresaId: string,
    db: PrismaClientType
  ): Promise<{
    data: ITransferWithRelations[]
    total: number
    page: number
    limit: number
  }> {
    const where: Prisma.TransferWhereInput = {
      fromWarehouse: { empresaId },
    }

    if (filters.fromWarehouseId) where.fromWarehouseId = filters.fromWarehouseId
    if (filters.toWarehouseId) where.toWarehouseId = filters.toWarehouseId
    if (filters.status) where.status = filters.status as any

    if (filters.createdFrom || filters.createdTo) {
      where.createdAt = {}
      if (filters.createdFrom) where.createdAt.gte = filters.createdFrom
      if (filters.createdTo) where.createdAt.lte = filters.createdTo
    }

    if (filters.search) {
      where.OR = [
        { transferNumber: { contains: filters.search, mode: 'insensitive' } },
        { notes: { contains: filters.search, mode: 'insensitive' } },
      ]
    }

    const [total, transfers] = await Promise.all([
      (db as PrismaClient).transfer.count({ where }),
      (db as PrismaClient).transfer.findMany({
        where,
        include: LIST_INCLUDE,
        skip: PaginationHelper.getOffset(page, limit),
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
    ])

    return {
      data: transfers as ITransferWithRelations[],
      total,
      page,
      limit,
    }
  }

  /**
   * Update transfer notes (DRAFT only)
   */
  async update(
    id: string,
    input: IUpdateTransferInput,
    userId: string,
    empresaId: string,
    db: PrismaClientType
  ): Promise<ITransferWithRelations> {
    const transfer = await this.findById(id, empresaId, db)

    if (transfer.status !== TransferStatus.DRAFT) {
      throw new BadRequestError(MSG.invalidStatus)
    }

    const updateData: Prisma.TransferUpdateInput = {}
    if (input.notes !== undefined) updateData.notes = input.notes ?? null

    const updated = await (db as PrismaClient).transfer.update({
      where: { id },
      data: updateData,
      include: FULL_INCLUDE,
    })

    logger.info('Transfer updated', { transferId: id })

    return updated as ITransferWithRelations
  }

  /**
   * DRAFT → PENDING_APPROVAL
   */
  async submitForApproval(
    id: string,
    userId: string,
    empresaId: string,
    db: PrismaClientType
  ): Promise<ITransferWithRelations> {
    const transfer = await this.findById(id, empresaId, db)

    if (transfer.status !== TransferStatus.DRAFT) {
      throw new BadRequestError(MSG.invalidStatus)
    }

    const updated = await (db as PrismaClient).transfer.update({
      where: { id },
      data: { status: TransferStatus.PENDING_APPROVAL as any },
      include: FULL_INCLUDE,
    })

    logger.info('Transfer submitted for approval', { transferId: id })

    return updated as ITransferWithRelations
  }

  /**
   * PENDING_APPROVAL → APPROVED
   * Validates stock, reserves it, creates ExitNote + EntryNote
   */
  async approve(
    id: string,
    userId: string,
    empresaId: string,
    db: PrismaClientType
  ): Promise<ITransferWithRelations> {
    logger.info('Approving transfer', { transferId: id })

    const transfer = await (db as PrismaClient).transfer.findFirst({
      where: { id, fromWarehouse: { empresaId } },
      include: {
        items: { include: { item: true } },
        fromWarehouse: true,
        toWarehouse: true,
      },
    })

    if (!transfer) throw new NotFoundError(MSG.notFound)

    if (transfer.status !== TransferStatus.PENDING_APPROVAL) {
      throw new BadRequestError(MSG.invalidStatus)
    }

    // Validate stock availability
    const stockRecords = await (db as PrismaClient).stock.findMany({
      where: {
        itemId: { in: transfer.items.map((i) => i.itemId) },
        warehouseId: transfer.fromWarehouseId,
        item: { empresaId },
      },
    })

    const stockMap = new Map(stockRecords.map((s) => [s.itemId, s]))

    for (const ti of transfer.items) {
      const stock = stockMap.get(ti.itemId)
      const available = Number(stock?.quantityAvailable ?? 0)
      if (!stock || available < ti.quantity) {
        const itemName = (ti as any).item?.name ?? ti.itemId
        throw new BadRequestError(`${MSG.insufficientStock}: ${itemName}`)
      }
    }

    const updated = await (db as PrismaClient).$transaction(async (tx) => {
      // 1. Create ExitNote (type TRANSFER)
      const exitNote = await tx.exitNote.create({
        data: {
          exitNoteNumber: MovementNumberGenerator.generate('NS-TRF'),
          type: 'TRANSFER',
          status: 'PENDING',
          warehouseId: transfer.fromWarehouseId,
          reference: transfer.transferNumber,
          reason: `Transferencia ${transfer.transferNumber} al almacén ${transfer.toWarehouse?.name ?? transfer.toWarehouseId}`,
          authorizedBy: userId,
          notes: transfer.notes ?? null,
          items: {
            create: transfer.items.map((item) => ({
              itemId: item.itemId,
              quantity: item.quantity,
              notes: item.notes ?? null,
            })),
          },
        },
      })

      // 2. Reserve stock in source warehouse
      for (const item of transfer.items) {
        await tx.stock.update({
          where: {
            itemId_warehouseId: {
              itemId: item.itemId,
              warehouseId: transfer.fromWarehouseId,
            },
          },
          data: {
            quantityReserved: { increment: item.quantity },
            quantityAvailable: { decrement: item.quantity },
          },
        })
      }

      // 3. Create EntryNote (type TRANSFER)
      const entryNote = await tx.entryNote.create({
        data: {
          entryNoteNumber: MovementNumberGenerator.generate('EN-TRF'),
          type: 'TRANSFER',
          status: 'PENDING',
          warehouseId: transfer.toWarehouseId,
          reference: transfer.transferNumber,
          reason: `Transferencia ${transfer.transferNumber} desde almacén ${transfer.fromWarehouse?.name ?? transfer.fromWarehouseId}`,
          authorizedBy: userId,
          notes: transfer.notes ?? null,
          items: {
            create: transfer.items.map((item) => ({
              itemId: item.itemId,
              quantityReceived: item.quantity,
              unitCost: item.unitCost ?? 0,
              notes: item.notes ?? null,
            })),
          },
        },
      })

      // 4. Update transfer → APPROVED + link notes
      return tx.transfer.update({
        where: { id },
        data: {
          status: TransferStatus.APPROVED as any,
          approvedBy: userId,
          approvedAt: new Date(),
          exitNoteId: exitNote.id,
          entryNoteId: entryNote.id,
        },
        include: FULL_INCLUDE,
      })
    })

    logger.info('Transfer approved', {
      transferId: id,
      exitNoteId: updated.exitNoteId,
      entryNoteId: updated.entryNoteId,
    })

    return updated as ITransferWithRelations
  }

  /**
   * PENDING_APPROVAL → REJECTED
   */
  async reject(
    id: string,
    input: IRejectTransferInput,
    userId: string,
    empresaId: string,
    db: PrismaClientType
  ): Promise<ITransferWithRelations> {
    const transfer = await this.findById(id, empresaId, db)

    if (transfer.status !== TransferStatus.PENDING_APPROVAL) {
      throw new BadRequestError(MSG.invalidStatus)
    }

    const updated = await (db as PrismaClient).transfer.update({
      where: { id },
      data: {
        status: TransferStatus.REJECTED as any,
        rejectedBy: userId,
        rejectedAt: new Date(),
        rejectionReason: input.rejectionReason,
      },
      include: FULL_INCLUDE,
    })

    logger.info('Transfer rejected', { transferId: id })

    return updated as ITransferWithRelations
  }

  /**
   * APPROVED → IN_TRANSIT
   * Marks goods as physically dispatched. Stock already reserved at approve().
   * Creates OUT movement (reduces quantityReal).
   */
  async send(
    id: string,
    userId: string,
    empresaId: string,
    db: PrismaClientType
  ): Promise<ITransferWithRelations> {
    logger.info('Sending transfer', { transferId: id })

    const transfer = await (db as PrismaClient).transfer.findFirst({
      where: { id, fromWarehouse: { empresaId } },
      include: { items: true },
    })

    if (!transfer) throw new NotFoundError(MSG.notFound)

    if (transfer.status !== TransferStatus.APPROVED) {
      throw new BadRequestError(MSG.invalidStatus)
    }

    const updated = await (db as PrismaClient).$transaction(async (tx) => {
      // Mark ExitNote as DELIVERED
      if (transfer.exitNoteId) {
        await tx.exitNote.update({
          where: { id: transfer.exitNoteId },
          data: { status: 'DELIVERED' },
        })
      }

      // Reduce quantityReal + clear reservation in source warehouse
      for (const item of transfer.items) {
        await tx.stock.update({
          where: {
            itemId_warehouseId: {
              itemId: item.itemId,
              warehouseId: transfer.fromWarehouseId,
            },
          },
          data: {
            quantityReal: { decrement: item.quantity },
            quantityReserved: { decrement: item.quantity },
            // quantityAvailable already decremented at approve()
          },
        })

        // Create TRANSFER OUT movement (from → to)
        await tx.movement.create({
          data: {
            movementNumber: MovementNumberGenerator.generateMovementNumber(),
            type: MovementType.TRANSFER,
            itemId: item.itemId,
            warehouseFromId: transfer.fromWarehouseId,
            warehouseToId: transfer.toWarehouseId,
            quantity: item.quantity,
            unitCost: item.unitCost ?? 0,
            reference: transfer.transferNumber,
            notes: `Transferencia salida: ${transfer.transferNumber}`,
            createdBy: userId,
          },
        })
      }

      return tx.transfer.update({
        where: { id },
        data: {
          status: TransferStatus.IN_TRANSIT as any,
          sentAt: new Date(),
        },
        include: FULL_INCLUDE,
      })
    })

    logger.info('Transfer sent (IN_TRANSIT)', { transferId: id })

    return updated as ITransferWithRelations
  }

  /**
   * IN_TRANSIT → RECEIVED
   * Physically receives goods at destination warehouse.
   * Increases stock in toWarehouse + creates IN movement.
   */
  async receive(
    id: string,
    userId: string,
    empresaId: string,
    db: PrismaClientType
  ): Promise<ITransferWithRelations> {
    logger.info('Receiving transfer', { transferId: id })

    const transfer = await (db as PrismaClient).transfer.findFirst({
      where: { id, fromWarehouse: { empresaId } },
      include: { items: true },
    })

    if (!transfer) throw new NotFoundError(MSG.notFound)

    if (transfer.status !== TransferStatus.IN_TRANSIT) {
      throw new BadRequestError(MSG.invalidStatus)
    }

    const updated = await (db as PrismaClient).$transaction(async (tx) => {
      // Mark EntryNote as COMPLETED
      if (transfer.entryNoteId) {
        await tx.entryNote.update({
          where: { id: transfer.entryNoteId },
          data: { status: 'COMPLETED' },
        })
      }

      // Increase stock at destination warehouse (upsert to handle no prior stock)
      for (const item of transfer.items) {
        await tx.stock.upsert({
          where: {
            itemId_warehouseId: {
              itemId: item.itemId,
              warehouseId: transfer.toWarehouseId,
            },
          },
          update: {
            quantityReal: { increment: item.quantity },
            quantityAvailable: { increment: item.quantity },
          },
          create: {
            itemId: item.itemId,
            warehouseId: transfer.toWarehouseId,
            quantityReal: item.quantity,
            quantityReserved: 0,
            quantityAvailable: item.quantity,
            averageCost: item.unitCost ?? 0,
          },
        })

        // Create TRANSFER IN movement (from → to)
        await tx.movement.create({
          data: {
            movementNumber: MovementNumberGenerator.generateMovementNumber(),
            type: MovementType.TRANSFER,
            itemId: item.itemId,
            warehouseFromId: transfer.fromWarehouseId,
            warehouseToId: transfer.toWarehouseId,
            quantity: item.quantity,
            unitCost: item.unitCost ?? 0,
            reference: transfer.transferNumber,
            notes: `Transferencia recepción: ${transfer.transferNumber}`,
            createdBy: userId,
          },
        })
      }

      return tx.transfer.update({
        where: { id },
        data: {
          status: TransferStatus.RECEIVED as any,
          receivedAt: new Date(),
        },
        include: FULL_INCLUDE,
      })
    })

    logger.info('Transfer received', { transferId: id })

    return updated as ITransferWithRelations
  }

  /**
   * Cancel transfer
   * - DRAFT / PENDING_APPROVAL: simple status update
   * - APPROVED: cancel notes + restore reserved stock
   * - IN_TRANSIT: restore quantityReal + quantityAvailable in source
   * - RECEIVED / REJECTED / CANCELLED: not allowed
   */
  async cancel(
    id: string,
    userId: string,
    empresaId: string,
    db: PrismaClientType
  ): Promise<ITransferWithRelations> {
    logger.info('Cancelling transfer', { transferId: id })

    const transfer = await (db as PrismaClient).transfer.findFirst({
      where: { id, fromWarehouse: { empresaId } },
      include: {
        items: true,
        exitNote: { select: { id: true, status: true } },
        entryNote: { select: { id: true, status: true } },
      },
    })

    if (!transfer) throw new NotFoundError(MSG.notFound)

    const nonCancellable: string[] = [
      TransferStatus.CANCELLED,
      TransferStatus.REJECTED,
      TransferStatus.RECEIVED,
    ]

    if (nonCancellable.includes(transfer.status)) {
      throw new BadRequestError(MSG.cannotCancelReceived)
    }

    await (db as PrismaClient).$transaction(async (tx) => {
      if (transfer.status === TransferStatus.APPROVED) {
        // Restore reserved stock (quantityAvailable was decremented at approve)
        for (const item of transfer.items) {
          await tx.stock.update({
            where: {
              itemId_warehouseId: {
                itemId: item.itemId,
                warehouseId: transfer.fromWarehouseId,
              },
            },
            data: {
              quantityReserved: { decrement: item.quantity },
              quantityAvailable: { increment: item.quantity },
            },
          })
        }

        // Cancel linked notes
        if (
          transfer.exitNote &&
          !['DELIVERED', 'CANCELLED'].includes(transfer.exitNote.status)
        ) {
          await tx.exitNote.update({
            where: { id: transfer.exitNote.id },
            data: { status: 'CANCELLED' },
          })
        }
        if (
          transfer.entryNote &&
          !['COMPLETED', 'CANCELLED'].includes(transfer.entryNote.status)
        ) {
          await tx.entryNote.update({
            where: { id: transfer.entryNote.id },
            data: { status: 'CANCELLED' },
          })
        }
      }

      if (transfer.status === TransferStatus.IN_TRANSIT) {
        // ExitNote is DELIVERED — goods already left source. Restore quantityReal + quantityAvailable.
        for (const item of transfer.items) {
          await tx.stock.update({
            where: {
              itemId_warehouseId: {
                itemId: item.itemId,
                warehouseId: transfer.fromWarehouseId,
              },
            },
            data: {
              quantityReal: { increment: item.quantity },
              quantityAvailable: { increment: item.quantity },
            },
          })

          // Compensating movement — reversal back to source
          await tx.movement.create({
            data: {
              movementNumber: MovementNumberGenerator.generateMovementNumber(),
              type: MovementType.TRANSFER,
              itemId: item.itemId,
              warehouseFromId: transfer.toWarehouseId,
              warehouseToId: transfer.fromWarehouseId,
              quantity: item.quantity,
              unitCost: item.unitCost ?? 0,
              reference: transfer.transferNumber,
              notes: `Cancelación transferencia en tránsito: ${transfer.transferNumber}`,
              createdBy: userId,
            },
          })
        }

        if (
          transfer.entryNote &&
          !['COMPLETED', 'CANCELLED'].includes(transfer.entryNote.status)
        ) {
          await tx.entryNote.update({
            where: { id: transfer.entryNote.id },
            data: { status: 'CANCELLED' },
          })
        }
      }

      await tx.transfer.update({
        where: { id },
        data: { status: TransferStatus.CANCELLED as any },
      })
    })

    logger.info('Transfer cancelled', {
      transferId: id,
      previousStatus: transfer.status,
    })

    return this.findById(id, empresaId, db)
  }

  /**
   * Delete transfer (DRAFT only — hard delete)
   * TransferItem has onDelete: Cascade — no manual cleanup needed
   */
  async delete(
    id: string,
    userId: string,
    empresaId: string,
    db: PrismaClientType
  ): Promise<void> {
    const transfer = await this.findById(id, empresaId, db)

    if (transfer.status !== TransferStatus.DRAFT) {
      throw new BadRequestError(MSG.cannotDeleteNonDraft)
    }

    await (db as PrismaClient).transfer.delete({ where: { id } })

    logger.info('Transfer deleted', { transferId: id })
  }
}

export default new TransfersService()
