// backend/src/features/inventory/serialNumbers/serialNumbers.service.ts

import { v4 as uuidv4 } from 'uuid'
import prisma from '../../../services/prisma.service.js'
import { logger } from '../../../shared/utils/logger.js'
import { NotFoundError, BadRequestError } from '../../../shared/utils/apiError.js'
import {
  ISerialNumber,
  ISerialNumberWithRelations,
  ICreateSerialNumberInput,
  IUpdateSerialNumberInput,
  ISerialNumberFilters,
  SerialStatus,
} from './serialNumbers.interface.js'
import { EventType } from '../shared/events/event.types.js'
import EventService from '../shared/events/event.service.js'

const eventService = EventService.getInstance()

class SerialNumbersService {
  private static instance: SerialNumbersService

  private constructor() {}

  static getInstance(): SerialNumbersService {
    if (!SerialNumbersService.instance) {
      SerialNumbersService.instance = new SerialNumbersService()
    }
    return SerialNumbersService.instance
  }

  /**
   * Create a new serial number
   */
  async create(
    input: ICreateSerialNumberInput,
    userId: string
  ): Promise<ISerialNumberWithRelations> {
    try {
      logger.info('Creating serial number', {
        serialNumber: input.serialNumber,
        userId,
      })

      // Validate item exists and is serialized
      const item = await prisma.item.findUnique({
        where: { id: input.itemId },
      })

      if (!item) {
        throw new NotFoundError('Item not found')
      }

      if (!item.isSerialized) {
        throw new BadRequestError('Item is not marked as serialized')
      }

      // Validate serial number uniqueness
      const existing = await prisma.serialNumber.findUnique({
        where: { serialNumber: input.serialNumber },
      })

      if (existing) {
        throw new BadRequestError('Serial number already exists')
      }

      // Validate warehouse if provided
      if (input.warehouseId) {
        const warehouse = await prisma.warehouse.findUnique({
          where: { id: input.warehouseId },
        })

        if (!warehouse) {
          throw new NotFoundError('Warehouse not found')
        }
      }

      const serial = await prisma.serialNumber.create({
        data: {
          id: uuidv4(),
          serialNumber: input.serialNumber,
          itemId: input.itemId,
          warehouseId: input.warehouseId || null,
          status: input.status || SerialStatus.IN_STOCK,
          notes: input.notes || null,
        },
        include: {
          item: true,
          warehouse: true,
        },
      })

      // Emit event
      await eventService.emit({
        type: EventType.SERIAL_CREATED,
        entityId: serial.id,
        entityType: 'serialNumber',
        userId,
        data: {
          serialNumber: serial.serialNumber,
          itemId: serial.itemId,
          warehouseId: serial.warehouseId,
        },
      })

      logger.info('Serial number created', {
        serialId: serial.id,
        serialNumber: serial.serialNumber,
      })

      return this.mapToInterface(serial)
    } catch (error) {
      logger.error('Error creating serial number', { error })
      throw error
    }
  }

  /**
   * Find serial number by ID
   */
  async findById(id: string): Promise<ISerialNumberWithRelations> {
    try {
      const serial = await prisma.serialNumber.findUnique({
        where: { id },
        include: {
          item: true,
          warehouse: true,
        },
      })

      if (!serial) {
        throw new NotFoundError('Serial number not found')
      }

      return this.mapToInterface(serial)
    } catch (error) {
      logger.error('Error finding serial number', { error })
      throw error
    }
  }

  /**
   * Find serial number by serial number string
   */
  async findBySerialNumber(
    serialNumber: string
  ): Promise<ISerialNumberWithRelations> {
    try {
      const serial = await prisma.serialNumber.findUnique({
        where: { serialNumber },
        include: {
          item: true,
          warehouse: true,
        },
      })

      if (!serial) {
        throw new NotFoundError('Serial number not found')
      }

      return this.mapToInterface(serial)
    } catch (error) {
      logger.error('Error finding serial number', { error })
      throw error
    }
  }

  /**
   * Find serial numbers with pagination
   */
  async findAll(
    filters: ISerialNumberFilters,
    page = 1,
    limit = 10,
    prismaClient?: any
  ): Promise<{
    data: ISerialNumberWithRelations[]
    total: number
    page: number
    limit: number
  }> {
    try {
      const where: any = {}

      if (filters.itemId) where.itemId = filters.itemId
      if (filters.serialNumber)
        where.serialNumber = { contains: filters.serialNumber }
      if (filters.warehouseId) where.warehouseId = filters.warehouseId
      if (filters.status) where.status = filters.status

      const total = await prisma.serialNumber.count({ where })

      const serials = await prisma.serialNumber.findMany({
        where,
        include: {
          item: true,
          warehouse: true,
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      })

      return {
        data: serials.map((s) => this.mapToInterface(s)),
        total,
        page,
        limit,
      }
    } catch (error) {
      logger.error('Error finding serial numbers', { error })
      throw error
    }
  }

  /**
   * Find serial numbers by item ID
   */
  async findByItemId(itemId: string): Promise<ISerialNumberWithRelations[]> {
    try {
      const serials = await prisma.serialNumber.findMany({
        where: { itemId },
        include: {
          item: true,
          warehouse: true,
        },
        orderBy: { createdAt: 'asc' },
      })

      return serials.map((s) => this.mapToInterface(s))
    } catch (error) {
      logger.error('Error finding serial numbers by item', { error })
      throw error
    }
  }

  /**
   * Find serial numbers by warehouse ID
   */
  async findByWarehouseId(
    warehouseId: string
  ): Promise<ISerialNumberWithRelations[]> {
    try {
      const serials = await prisma.serialNumber.findMany({
        where: { warehouseId },
        include: {
          item: true,
          warehouse: true,
        },
        orderBy: { createdAt: 'asc' },
      })

      return serials.map((s) => this.mapToInterface(s))
    } catch (error) {
      logger.error('Error finding serial numbers by warehouse', { error })
      throw error
    }
  }

  /**
   * Find serial numbers by status
   */
  async findByStatus(
    status: SerialStatus
  ): Promise<ISerialNumberWithRelations[]> {
    try {
      const serials = await prisma.serialNumber.findMany({
        where: { status },
        include: {
          item: true,
          warehouse: true,
        },
        orderBy: { createdAt: 'asc' },
      })

      return serials.map((s) => this.mapToInterface(s))
    } catch (error) {
      logger.error('Error finding serial numbers by status', { error })
      throw error
    }
  }

  /**
   * Update serial number
   */
  async update(
    id: string,
    input: IUpdateSerialNumberInput,
    userId: string
  ): Promise<ISerialNumberWithRelations> {
    try {
      logger.info('Updating serial number', { serialId: id, userId })

      const serial = await prisma.serialNumber.findUnique({
        where: { id },
      })

      if (!serial) {
        throw new NotFoundError('Serial number not found')
      }

      // Validate warehouse if updating
      if (input.warehouseId && input.warehouseId !== serial.warehouseId) {
        const warehouse = await prisma.warehouse.findUnique({
          where: { id: input.warehouseId },
        })

        if (!warehouse) {
          throw new NotFoundError('Warehouse not found')
        }
      }

      const updated = await prisma.serialNumber.update({
        where: { id },
        data: {
          status: input.status ?? serial.status,
          warehouseId: input.warehouseId ?? serial.warehouseId,
          notes: input.notes ?? serial.notes,
        },
        include: {
          item: true,
          warehouse: true,
        },
      })

      // Emit event if status changed
      if (input.status && input.status !== serial.status) {
        await eventService.emit({
          type: EventType.SERIAL_STATUS_CHANGED,
          entityId: updated.id,
          entityType: 'serialNumber',
          userId,
          data: {
            serialNumber: updated.serialNumber,
            oldStatus: serial.status,
            newStatus: updated.status,
            itemId: updated.itemId,
          },
        })
      }

      logger.info('Serial number updated', { serialId: updated.id })

      return this.mapToInterface(updated)
    } catch (error) {
      logger.error('Error updating serial number', { error })
      throw error
    }
  }

  /**
   * Assign serial to warehouse
   */
  async assignToWarehouse(
    id: string,
    warehouseId: string,
    userId: string
  ): Promise<ISerialNumberWithRelations> {
    try {
      logger.info('Assigning serial to warehouse', {
        serialId: id,
        warehouseId,
        userId,
      })

      const serial = await prisma.serialNumber.findUnique({
        where: { id },
      })

      if (!serial) {
        throw new NotFoundError('Serial number not found')
      }

      const warehouse = await prisma.warehouse.findUnique({
        where: { id: warehouseId },
      })

      if (!warehouse) {
        throw new NotFoundError('Warehouse not found')
      }

      const updated = await prisma.serialNumber.update({
        where: { id },
        data: {
          warehouseId,
          status: SerialStatus.IN_STOCK,
        },
        include: {
          item: true,
          warehouse: true,
        },
      })

      // Emit event
      await eventService.emit({
        type: EventType.SERIAL_ASSIGNED_LOCATION,
        entityId: updated.id,
        entityType: 'serialNumber',
        userId,
        data: {
          serialNumber: updated.serialNumber,
          warehouseId: updated.warehouseId,
          previousWarehouseId: serial.warehouseId,
        },
      })

      logger.info('Serial assigned to warehouse', { serialId: updated.id })

      return this.mapToInterface(updated)
    } catch (error) {
      logger.error('Error assigning serial to warehouse', { error })
      throw error
    }
  }

  /**
   * Delete serial number
   */
  async delete(id: string): Promise<void> {
    try {
      logger.info('Deleting serial number', { serialId: id })

      const serial = await prisma.serialNumber.findUnique({
        where: { id },
      })

      if (!serial) {
        throw new NotFoundError('Serial number not found')
      }

      // Check if serial is assigned to anything
      if (serial.status !== SerialStatus.IN_STOCK) {
        throw new BadRequestError(
          `Cannot delete serial number with status ${serial.status}`
        )
      }

      await prisma.serialNumber.delete({
        where: { id },
      })

      logger.info('Serial number deleted', { serialId: id })
    } catch (error) {
      logger.error('Error deleting serial number', { error })
      throw error
    }
  }

  /**
   * Map serial to interface
   */
  private mapToInterface(serial: any): ISerialNumberWithRelations {
    return {
      id: serial.id,
      serialNumber: serial.serialNumber,
      itemId: serial.itemId,
      warehouseId: serial.warehouseId,
      status: serial.status,
      workOrderId: serial.workOrderId,
      soldAt: serial.soldAt,
      notes: serial.notes,
      createdAt: serial.createdAt,
      updatedAt: serial.updatedAt,
      item: serial.item,
      warehouse: serial.warehouse,
    }
  }
}

export default SerialNumbersService.getInstance()
