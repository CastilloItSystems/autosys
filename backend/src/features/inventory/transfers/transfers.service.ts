// backend/src/features/inventory/transfers/transfers.service.ts

import { v4 as uuidv4 } from 'uuid'
import prisma from '../../../services/prisma.service'
import { logger } from '../../../shared/utils/logger'
import { NotFoundError, BadRequestError } from '../../../shared/utils/ApiError'
import {
  ITransfer,
  ITransferWithRelations,
  ICreateTransferInput,
  IUpdateTransferInput,
  ITransferFilters,
  TransferStatus,
} from './transfers.interface'
import { EventType } from '../shared/events/event.types'
import { MovementType } from '../movements/movements.interface'
import EventService from '../shared/events/event.service'

const eventService = EventService.getInstance()

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
   * Create a new transfer
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
      const fromWh = await prisma.warehouse.findUnique({
        where: { id: input.fromWarehouseId },
      })
      const toWh = await prisma.warehouse.findUnique({
        where: { id: input.toWarehouseId },
      })

      if (!fromWh || !toWh) {
        throw new NotFoundError('Warehouse not found')
      }

      if (input.fromWarehouseId === input.toWarehouseId) {
        throw new BadRequestError('Cannot transfer to same warehouse')
      }

      // Validate items and stock in source warehouse
      let totalQuantity = 0
      for (const item of input.items) {
        const itemRecord = await prisma.item.findUnique({
          where: { id: item.itemId },
        })

        if (!itemRecord) {
          throw new NotFoundError(`Item ${item.itemId} not found`)
        }

        const stock = await prisma.stock.findUnique({
          where: {
            itemId_warehouseId: {
              itemId: item.itemId,
              warehouseId: input.fromWarehouseId,
            },
          },
        })

        if (!stock || stock.quantityAvailable < item.quantity) {
          throw new BadRequestError(
            `Insufficient quantity for item ${itemRecord.name} in source warehouse`
          )
        }

        totalQuantity += item.quantity
      }

      // Generate transfer number
      const count = await prisma.transfer.count()
      const transferNumber = `TRANS-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`

      // Create transfer with items in transaction
      const transfer = await prisma.$transaction(async (tx) => {
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
                itemId: item.itemId,
                quantity: item.quantity,
                unitCost: item.unitCost ?? null,
                notes: item.notes,
              })),
            },
          },
          include: {
            items: true,
            fromWarehouse: true,
            toWarehouse: true,
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

      logger.info('Transfer created', {
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
   * Find transfer by ID
   */
  async findById(id: string): Promise<ITransferWithRelations> {
    try {
      const transfer = await prisma.transfer.findUnique({
        where: { id },
        include: {
          items: { include: { item: true } },
          fromWarehouse: true,
          toWarehouse: true,
        },
      })

      if (!transfer) {
        throw new NotFoundError('Transfer not found')
      }

      return this.mapToInterface(transfer)
    } catch (error) {
      logger.error('Error finding transfer', { error })
      throw error
    }
  }

  /**
   * Find transfers with pagination
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

      const total = await db.transfer.count({ where })

      const transfers = await db.transfer.findMany({
        where,
        include: {
          items: { include: { item: true } },
          fromWarehouse: true,
          toWarehouse: true,
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      })

      return {
        data: transfers.map((t) => this.mapToInterface(t)),
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
   * Update transfer
   */
  async update(
    id: string,
    input: IUpdateTransferInput,
    userId: string
  ): Promise<ITransferWithRelations> {
    try {
      const transfer = await prisma.transfer.findUnique({ where: { id } })

      if (!transfer) {
        throw new NotFoundError('Transfer not found')
      }

      if (transfer.status !== TransferStatus.DRAFT) {
        throw new BadRequestError('Can only update draft transfers')
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
        },
      })

      return this.mapToInterface(updated)
    } catch (error) {
      logger.error('Error updating transfer', { error })
      throw error
    }
  }

  /**
   * Send transfer (mark as in transit)
   */
  async send(
    id: string,
    sentBy: string,
    userId: string
  ): Promise<ITransferWithRelations> {
    try {
      logger.info('Sending transfer', { transferId: id })

      const transfer = await prisma.transfer.findUnique({
        where: { id },
      })

      if (!transfer) {
        throw new NotFoundError('Transfer not found')
      }

      if (transfer.status !== TransferStatus.DRAFT) {
        throw new BadRequestError('Can only send draft transfers')
      }

      // Create TRANSFER_OUT movements in source warehouse
      const items = await prisma.transferItem.findMany({
        where: { transferId: id },
      })

      await prisma.$transaction(async (tx) => {
        for (const item of items) {
          // Create movement
          await tx.movement.create({
            data: {
              id: uuidv4(),
              movementNumber: `MOV-TRANSFER-OUT-${uuidv4().substring(0, 8)}`,
              type: 'TRANSFER' as any,
              itemId: item.itemId,
              quantity: item.quantity,
              unitCost: item.unitCost || 0,
              warehouseFromId: transfer.fromWarehouseId,
              warehouseToId: transfer.toWarehouseId,
              movementDate: new Date(),
              createdBy: userId,
            },
          })

          // Update stock in source warehouse
          await tx.stock.update({
            where: {
              itemId_warehouseId: {
                itemId: item.itemId,
                warehouseId: transfer.fromWarehouseId,
              },
            },
            data: {
              quantityReal: {
                decrement: item.quantity,
              },
              quantityAvailable: {
                decrement: item.quantity,
              },
            },
          })
        }

        // Update transfer status
        await tx.transfer.update({
          where: { id },
          data: {
            status: TransferStatus.IN_TRANSIT as any,
            sentAt: new Date(),
            sentBy,
          },
        })
      })

      // Emit event
      await eventService.emit({
        type: EventType.TRANSFER_SENT,
        entityId: id,
        entityType: 'transfer',
        userId,
        data: {
          transferId: id,
          sentBy,
        },
      })

      return this.findById(id)
    } catch (error) {
      logger.error('Error sending transfer', { error })
      throw error
    }
  }

  /**
   * Receive transfer
   */
  async receive(
    id: string,
    receivedBy: string,
    userId: string
  ): Promise<ITransferWithRelations> {
    try {
      logger.info('Receiving transfer', { transferId: id })

      const transfer = await prisma.transfer.findUnique({
        where: { id },
      })

      if (!transfer) {
        throw new NotFoundError('Transfer not found')
      }

      if (transfer.status !== TransferStatus.IN_TRANSIT) {
        throw new BadRequestError('Can only receive in-transit transfers')
      }

      const items = await prisma.transferItem.findMany({
        where: { transferId: id },
      })

      await prisma.$transaction(async (tx) => {
        for (const item of items) {
          // Create movement
          await tx.movement.create({
            data: {
              id: uuidv4(),
              movementNumber: `MOV-TRANSFER-IN-${uuidv4().substring(0, 8)}`,
              type: 'TRANSFER' as any,
              itemId: item.itemId,
              quantity: item.quantity,
              unitCost: item.unitCost || 0,
              warehouseFromId: transfer.fromWarehouseId,
              warehouseToId: transfer.toWarehouseId,
              movementDate: new Date(),
              createdBy: userId,
            },
          })

          // Update stock in destination warehouse
          const destStock = await tx.stock.findUnique({
            where: {
              itemId_warehouseId: {
                itemId: item.itemId,
                warehouseId: transfer.toWarehouseId,
              },
            },
          })

          if (!destStock) {
            // Create stock if doesn't exist
            await tx.stock.create({
              data: {
                id: uuidv4(),
                itemId: item.itemId,
                warehouseId: transfer.toWarehouseId,
                quantityReal: item.quantity,
                quantityReserved: 0,
                quantityAvailable: item.quantity,
                averageCost: item.unitCost?.toString() || '0',
              },
            })
          } else {
            await tx.stock.update({
              where: {
                itemId_warehouseId: {
                  itemId: item.itemId,
                  warehouseId: transfer.toWarehouseId,
                },
              },
              data: {
                quantityReal: {
                  increment: item.quantity,
                },
                quantityAvailable: {
                  increment: item.quantity,
                },
              },
            })
          }
        }

        // Update transfer status
        await tx.transfer.update({
          where: { id },
          data: {
            status: TransferStatus.RECEIVED as any,
            receivedAt: new Date(),
            receivedBy,
          },
        })
      })

      // Emit event
      await eventService.emit({
        type: EventType.TRANSFER_RECEIVED,
        entityId: id,
        entityType: 'transfer',
        userId,
        data: {
          transferId: id,
          receivedBy,
        },
      })

      return this.findById(id)
    } catch (error) {
      logger.error('Error receiving transfer', { error })
      throw error
    }
  }

  /**
   * Cancel transfer
   */
  async cancel(id: string, userId: string): Promise<ITransferWithRelations> {
    try {
      logger.info('Cancelling transfer', { transferId: id })

      const transfer = await prisma.transfer.findUnique({
        where: { id },
      })

      if (!transfer) {
        throw new NotFoundError('Transfer not found')
      }

      if (transfer.status === TransferStatus.RECEIVED) {
        throw new BadRequestError('Cannot cancel received transfers')
      }

      const updated = await prisma.transfer.update({
        where: { id },
        data: {
          status: TransferStatus.CANCELLED as any,
        },
        include: {
          items: { include: { item: true } },
          fromWarehouse: true,
          toWarehouse: true,
        },
      })

      return this.mapToInterface(updated)
    } catch (error) {
      logger.error('Error cancelling transfer', { error })
      throw error
    }
  }

  /**
   * Map transfer to interface
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
      sentAt: transfer.sentAt,
      receivedAt: transfer.receivedAt,
      sentBy: transfer.sentBy,
      receivedBy: transfer.receivedBy,
      createdBy: transfer.createdBy,
      createdAt: transfer.createdAt,
      updatedAt: transfer.updatedAt,
      items: transfer.items,
      fromWarehouse: transfer.fromWarehouse,
      toWarehouse: transfer.toWarehouse,
    }
  }
}

export default TransfersService.getInstance()
