// backend/src/features/inventory/transfers/transfers.service.ts

import { v4 as uuidv4 } from 'uuid'
import prisma from '../../../services/prisma.service'
import { logger } from '../../../shared/utils/logger'
import { NotFoundError, BadRequestError } from '../../../shared/utils/ApiError'
import {
  ITransferWithRelations,
  ICreateTransferInput,
  IUpdateTransferInput,
  IRejectTransferInput,
  ITransferFilters,
  TransferStatus,
} from './transfers.interface'
import { EventType } from '../shared/events/event.types'
import EventService from '../shared/events/event.service'
import { INVENTORY_MESSAGES } from '../shared/constants/messages'

const eventService = EventService.getInstance()
const MSG = INVENTORY_MESSAGES.transfer

// Shared include for note info on transfer queries
const NOTE_INCLUDE = {
  exitNote: {
    select: { id: true, exitNoteNumber: true, status: true },
  },
  entryNote: {
    select: { id: true, entryNoteNumber: true, status: true },
  },
}

class TransfersService {
  private static instance: TransfersService

  private constructor() {}

  static getInstance(): TransfersService {
    if (!TransfersService.instance) {
      TransfersService.instance = new TransfersService()
    }
    return TransfersService.instance
  }

  /**
   * Create a new transfer in DRAFT status
   */
  async create(
    input: ICreateTransferInput,
    userId: string
  ): Promise<ITransferWithRelations> {
    try {
      logger.info('Creating transfer', {
        fromWarehouse: input.fromWarehouseId,
        toWarehouse: input.toWarehouseId,
      })

      // Validate warehouses exist and are different
      const [fromWh, toWh] = await Promise.all([
        prisma.warehouse.findUnique({ where: { id: input.fromWarehouseId } }),
        prisma.warehouse.findUnique({ where: { id: input.toWarehouseId } }),
      ])

      if (!fromWh || !toWh) {
        throw new NotFoundError(MSG.warehouseNotFound)
      }

      if (input.fromWarehouseId === input.toWarehouseId) {
        throw new BadRequestError(MSG.sameWarehouse)
      }

      // Validate items exist
      const itemIds = input.items.map((i) => i.itemId)
      const itemRecords = await prisma.item.findMany({
        where: { id: { in: itemIds } },
      })

      const itemMap = new Map(itemRecords.map((i) => [i.id, i]))

      let totalQuantity = 0
      for (const item of input.items) {
        const itemRecord = itemMap.get(item.itemId)
        if (!itemRecord) {
          throw new NotFoundError(`${MSG.itemNotFound}: ${item.itemId}`)
        }
        totalQuantity += item.quantity
      }

      // Create transfer with items in transaction
      const transfer = await prisma.$transaction(async (tx) => {
        const count = await tx.transfer.count()
        const transferNumber = `TRANS-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`

        const newTransfer = await tx.transfer.create({
          data: {
            id: uuidv4(),
            transferNumber,
            fromWarehouseId: input.fromWarehouseId,
            toWarehouseId: input.toWarehouseId,
            status: TransferStatus.DRAFT as any,
            quantity: totalQuantity,
            notes: input.notes || null,
            createdBy: userId,
            items: {
              create: input.items.map((item) => ({
                id: uuidv4(),
                item: { connect: { id: item.itemId } },
                quantity: item.quantity,
                unitCost: item.unitCost ?? null,
                notes: item.notes ?? null,
              })),
            },
          },
          include: {
            items: true,
            fromWarehouse: true,
            toWarehouse: true,
            ...NOTE_INCLUDE,
          },
        })

        return newTransfer
      })

      // Emit event
      await eventService.emit({
        type: EventType.TRANSFER_CREATED,
        entityId: transfer.id,
        entityType: 'transfer',
        userId,
        data: {
          transferNumber: transfer.transferNumber,
          fromWarehouseId: transfer.fromWarehouseId,
          toWarehouseId: transfer.toWarehouseId,
          totalQuantity: transfer.quantity,
        },
      })

      logger.info(MSG.created, {
        transferId: transfer.id,
        transferNumber: transfer.transferNumber,
      })

      return this.mapToInterface(transfer)
    } catch (error) {
      logger.error('Error creating transfer', { error })
      throw error
    }
  }

  /**
   * Find transfer by ID with full relations
   */
  async findById(id: string): Promise<ITransferWithRelations> {
    try {
      const transfer = await prisma.transfer.findUnique({
        where: { id },
        include: {
          items: { include: { item: true } },
          fromWarehouse: true,
          toWarehouse: true,
          ...NOTE_INCLUDE,
        },
      })

      if (!transfer) {
        throw new NotFoundError(MSG.notFound)
      }

      return this.mapToInterface(transfer)
    } catch (error) {
      logger.error('Error finding transfer', { error })
      throw error
    }
  }

  /**
   * Find transfers with pagination, filters, and search
   */
  async findAll(
    filters: ITransferFilters,
    page = 1,
    limit = 10,
    prismaClient?: any
  ): Promise<{
    data: ITransferWithRelations[]
    total: number
    page: number
    limit: number
  }> {
    try {
      const db = prismaClient || prisma
      const where: any = {}

      if (filters.fromWarehouseId)
        where.fromWarehouseId = filters.fromWarehouseId
      if (filters.toWarehouseId) where.toWarehouseId = filters.toWarehouseId
      if (filters.status) where.status = filters.status

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

      const total = await db.transfer.count({ where })

      const transfers = await db.transfer.findMany({
        where,
        include: {
          fromWarehouse: { select: { id: true, name: true } },
          toWarehouse: { select: { id: true, name: true } },
          ...NOTE_INCLUDE,
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      })

      return {
        data: transfers.map((t: any) => this.mapToInterface(t)),
        total,
        page,
        limit,
      }
    } catch (error) {
      logger.error('Error finding transfers', { error })
      throw error
    }
  }

  /**
   * Update transfer (DRAFT only, notes field)
   */
  async update(
    id: string,
    input: IUpdateTransferInput,
    userId: string
  ): Promise<ITransferWithRelations> {
    try {
      const transfer = await prisma.transfer.findUnique({ where: { id } })

      if (!transfer) {
        throw new NotFoundError(MSG.notFound)
      }

      if (transfer.status !== TransferStatus.DRAFT) {
        throw new BadRequestError(MSG.invalidStatus)
      }

      const updated = await prisma.transfer.update({
        where: { id },
        data: {
          notes: input.notes ?? transfer.notes,
        },
        include: {
          items: { include: { item: true } },
          fromWarehouse: true,
          toWarehouse: true,
          ...NOTE_INCLUDE,
        },
      })

      logger.info(MSG.updated, { transferId: id })

      return this.mapToInterface(updated)
    } catch (error) {
      logger.error('Error updating transfer', { error })
      throw error
    }
  }

  /**
   * Submit transfer for approval (DRAFT → PENDING_APPROVAL)
   */
  async submitForApproval(
    id: string,
    userId: string
  ): Promise<ITransferWithRelations> {
    try {
      logger.info('Submitting transfer for approval', { transferId: id })

      const transfer = await prisma.transfer.findUnique({ where: { id } })

      if (!transfer) {
        throw new NotFoundError(MSG.notFound)
      }

      if (transfer.status !== TransferStatus.DRAFT) {
        throw new BadRequestError(MSG.invalidStatus)
      }

      const updated = await prisma.transfer.update({
        where: { id },
        data: {
          status: TransferStatus.PENDING_APPROVAL as any,
        },
        include: {
          items: { include: { item: true } },
          fromWarehouse: true,
          toWarehouse: true,
          ...NOTE_INCLUDE,
        },
      })

      await eventService.emit({
        type: EventType.TRANSFER_SUBMITTED,
        entityId: id,
        entityType: 'transfer',
        userId,
        data: { transferId: id, transferNumber: updated.transferNumber },
      })

      logger.info(MSG.submitted, { transferId: id })

      return this.mapToInterface(updated)
    } catch (error) {
      logger.error('Error submitting transfer for approval', { error })
      throw error
    }
  }

  /**
   * Approve transfer (PENDING_APPROVAL → APPROVED)
   * Generates ExitNote (source warehouse) and EntryNote (destination warehouse)
   * Reserves stock in source warehouse via ExitNote standard flow
   */
  async approve(id: string, userId: string): Promise<ITransferWithRelations> {
    try {
      logger.info('Approving transfer', { transferId: id })

      const transfer = await prisma.transfer.findUnique({
        where: { id },
        include: {
          items: { include: { item: true } },
          fromWarehouse: true,
          toWarehouse: true,
        },
      })

      if (!transfer) {
        throw new NotFoundError(MSG.notFound)
      }

      if (transfer.status !== TransferStatus.PENDING_APPROVAL) {
        throw new BadRequestError(MSG.invalidStatus)
      }

      // Validate stock availability before approving (reserves stock)
      const stockRecords = await prisma.stock.findMany({
        where: {
          itemId: { in: transfer.items.map((i) => i.itemId) },
          warehouseId: transfer.fromWarehouseId,
        },
      })
      const stockMap = new Map(stockRecords.map((s) => [s.itemId, s]))

      for (const ti of transfer.items) {
        const stock = stockMap.get(ti.itemId)
        if (!stock || stock.quantityAvailable < ti.quantity) {
          const itemName = (ti as any).item?.name || ti.itemId
          throw new BadRequestError(`${MSG.insufficientStock}: ${itemName}`)
        }
      }

      // Execute everything in a transaction
      const updated = await prisma.$transaction(async (tx) => {
        // 1. Generate ExitNote number
        const exitNoteCount = await tx.exitNote.count()
        const exitNoteNumber = `EXIT-${new Date().getFullYear()}-${String(exitNoteCount + 1).padStart(5, '0')}`

        // 2. Create ExitNote (type TRANSFER, status PENDING)
        const exitNote = await tx.exitNote.create({
          data: {
            id: uuidv4(),
            exitNoteNumber,
            type: 'TRANSFER' as any,
            status: 'PENDING' as any,
            warehouseId: transfer.fromWarehouseId,
            reference: transfer.transferNumber,
            reason: `Transferencia ${transfer.transferNumber} al almacén ${transfer.toWarehouse?.name || transfer.toWarehouseId}`,
            authorizedBy: userId,
            notes: transfer.notes,
            items: {
              create: transfer.items.map((item) => ({
                id: uuidv4(),
                itemId: item.itemId,
                quantity: item.quantity,
                notes: item.notes,
              })),
            },
          },
        })

        // 3. Reserve stock in source warehouse (standard ExitNote behavior)
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

        // 4. Generate EntryNote number
        const entryNoteCount = await tx.entryNote.count()
        const entryNoteNumber = `EN-${new Date().getFullYear()}-${String(entryNoteCount + 1).padStart(5, '0')}`

        // 5. Create EntryNote (type TRANSFER, status PENDING)
        const entryNote = await tx.entryNote.create({
          data: {
            id: uuidv4(),
            entryNoteNumber,
            type: 'TRANSFER' as any,
            status: 'PENDING' as any,
            warehouseId: transfer.toWarehouseId,
            reference: transfer.transferNumber,
            reason: `Transferencia ${transfer.transferNumber} desde almacén ${transfer.fromWarehouse?.name || transfer.fromWarehouseId}`,
            authorizedBy: userId,
            notes: transfer.notes,
            items: {
              create: transfer.items.map((item) => ({
                id: uuidv4(),
                itemId: item.itemId,
                quantityReceived: item.quantity,
                unitCost: item.unitCost ?? 0,
                notes: item.notes,
              })),
            },
          },
        })

        // 6. Update transfer: set APPROVED + link notes
        const result = await tx.transfer.update({
          where: { id },
          data: {
            status: TransferStatus.APPROVED as any,
            approvedBy: userId,
            approvedAt: new Date(),
            exitNoteId: exitNote.id,
            entryNoteId: entryNote.id,
          },
          include: {
            items: { include: { item: true } },
            fromWarehouse: true,
            toWarehouse: true,
            exitNote: {
              select: { id: true, exitNoteNumber: true, status: true },
            },
            entryNote: {
              select: { id: true, entryNoteNumber: true, status: true },
            },
          },
        })

        return result
      })

      await eventService.emit({
        type: EventType.TRANSFER_APPROVED,
        entityId: id,
        entityType: 'transfer',
        userId,
        data: {
          transferId: id,
          approvedBy: userId,
          exitNoteId: updated.exitNoteId,
          entryNoteId: updated.entryNoteId,
        },
      })

      logger.info(MSG.approved, {
        transferId: id,
        exitNoteId: updated.exitNoteId,
        entryNoteId: updated.entryNoteId,
      })

      return this.mapToInterface(updated)
    } catch (error) {
      logger.error('Error approving transfer', { error })
      throw error
    }
  }

  /**
   * Reject transfer (PENDING_APPROVAL → REJECTED)
   */
  async reject(
    id: string,
    input: IRejectTransferInput,
    userId: string
  ): Promise<ITransferWithRelations> {
    try {
      logger.info('Rejecting transfer', { transferId: id })

      const transfer = await prisma.transfer.findUnique({ where: { id } })

      if (!transfer) {
        throw new NotFoundError(MSG.notFound)
      }

      if (transfer.status !== TransferStatus.PENDING_APPROVAL) {
        throw new BadRequestError(MSG.invalidStatus)
      }

      const updated = await prisma.transfer.update({
        where: { id },
        data: {
          status: TransferStatus.REJECTED as any,
          rejectedBy: userId,
          rejectedAt: new Date(),
          rejectionReason: input.rejectionReason,
        },
        include: {
          items: { include: { item: true } },
          fromWarehouse: true,
          toWarehouse: true,
          ...NOTE_INCLUDE,
        },
      })

      await eventService.emit({
        type: EventType.TRANSFER_REJECTED,
        entityId: id,
        entityType: 'transfer',
        userId,
        data: {
          transferId: id,
          rejectedBy: userId,
          rejectionReason: input.rejectionReason,
        },
      })

      logger.info(MSG.rejected, { transferId: id })

      return this.mapToInterface(updated)
    } catch (error) {
      logger.error('Error rejecting transfer', { error })
      throw error
    }
  }

  /**
   * Cancel transfer (DRAFT|PENDING_APPROVAL|APPROVED → CANCELLED)
   * If APPROVED, cancels linked ExitNote/EntryNote and reverses stock reservations
   */
  async cancel(id: string, userId: string): Promise<ITransferWithRelations> {
    try {
      logger.info('Cancelling transfer', { transferId: id })

      const transfer = await prisma.transfer.findUnique({
        where: { id },
        include: {
          items: true,
          exitNote: { select: { id: true, status: true } },
          entryNote: { select: { id: true, status: true } },
        },
      })

      if (!transfer) {
        throw new NotFoundError(MSG.notFound)
      }

      if (
        transfer.status === TransferStatus.CANCELLED ||
        transfer.status === TransferStatus.REJECTED
      ) {
        throw new BadRequestError(MSG.invalidStatus)
      }

      // If APPROVED, we need to handle the linked notes and stock reservations
      if (transfer.status === TransferStatus.APPROVED) {
        await prisma.$transaction(async (tx) => {
          // Cancel the ExitNote if it exists and isn't already delivered/cancelled
          if (
            transfer.exitNote &&
            !['DELIVERED', 'CANCELLED'].includes(transfer.exitNote.status)
          ) {
            await tx.exitNote.update({
              where: { id: transfer.exitNote.id },
              data: { status: 'CANCELLED' as any },
            })

            // Reverse stock reservations
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
          }

          // Cancel the EntryNote if it exists and isn't already completed/cancelled
          if (
            transfer.entryNote &&
            !['COMPLETED', 'CANCELLED'].includes(transfer.entryNote.status)
          ) {
            await tx.entryNote.update({
              where: { id: transfer.entryNote.id },
              data: { status: 'CANCELLED' as any },
            })
          }

          await tx.transfer.update({
            where: { id },
            data: { status: TransferStatus.CANCELLED as any },
          })
        })
      } else {
        // Simple status update for DRAFT, PENDING_APPROVAL
        await prisma.transfer.update({
          where: { id },
          data: { status: TransferStatus.CANCELLED as any },
        })
      }

      // Emit event
      await eventService.emit({
        type: EventType.TRANSFER_CANCELLED,
        entityId: id,
        entityType: 'transfer',
        userId,
        data: {
          transferId: id,
          previousStatus: transfer.status,
          hadNotes: !!(transfer.exitNoteId || transfer.entryNoteId),
        },
      })

      logger.info(MSG.cancelled, { transferId: id })

      return this.findById(id)
    } catch (error) {
      logger.error('Error cancelling transfer', { error })
      throw error
    }
  }

  /**
   * Delete transfer (DRAFT only - hard delete)
   */
  async delete(id: string, userId: string): Promise<void> {
    try {
      logger.info('Deleting transfer', { transferId: id })

      const transfer = await prisma.transfer.findUnique({ where: { id } })

      if (!transfer) {
        throw new NotFoundError(MSG.notFound)
      }

      if (transfer.status !== TransferStatus.DRAFT) {
        throw new BadRequestError(MSG.cannotDeleteNonDraft)
      }

      await prisma.$transaction(async (tx) => {
        await tx.transferItem.deleteMany({ where: { transferId: id } })
        await tx.transfer.delete({ where: { id } })
      })

      logger.info(MSG.deleted, { transferId: id })
    } catch (error) {
      logger.error('Error deleting transfer', { error })
      throw error
    }
  }

  /**
   * Map Prisma transfer record to interface
   */
  private mapToInterface(transfer: any): ITransferWithRelations {
    return {
      id: transfer.id,
      transferNumber: transfer.transferNumber,
      fromWarehouseId: transfer.fromWarehouseId,
      toWarehouseId: transfer.toWarehouseId,
      status: transfer.status,
      quantity: transfer.quantity,
      notes: transfer.notes,
      approvedBy: transfer.approvedBy,
      approvedAt: transfer.approvedAt,
      rejectedBy: transfer.rejectedBy,
      rejectedAt: transfer.rejectedAt,
      rejectionReason: transfer.rejectionReason,
      exitNoteId: transfer.exitNoteId,
      entryNoteId: transfer.entryNoteId,
      createdBy: transfer.createdBy,
      createdAt: transfer.createdAt,
      updatedAt: transfer.updatedAt,
      items: transfer.items,
      fromWarehouse: transfer.fromWarehouse,
      toWarehouse: transfer.toWarehouse,
      exitNote: transfer.exitNote || null,
      entryNote: transfer.entryNote || null,
    }
  }
}

export default TransfersService.getInstance()
