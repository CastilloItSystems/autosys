// backend/src/features/inventory/batches/batches.service.ts

import { v4 as uuidv4 } from 'uuid'
import prisma from '../../../services/prisma.service.js'
import { logger } from '../../../shared/utils/logger.js'
import { PaginationHelper } from '../../../shared/utils/pagination.js'
import { NotFoundError, BadRequestError } from '../../../shared/utils/apiError.js'
import {
  IBatch,
  IBatchWithRelations,
  ICreateBatchInput,
  IUpdateBatchInput,
  IBatchFilters,
  BatchStatus,
  IBatchExpiryInfo,
} from './batches.interface.js'
import { EventType } from '../shared/events/event.types.js'
import EventService from '../shared/events/event.service.js'

const eventService = EventService.getInstance()

class BatchesService {
  private static instance: BatchesService

  private constructor() {}

  static getInstance(): BatchesService {
    if (!BatchesService.instance) {
      BatchesService.instance = new BatchesService()
    }
    return BatchesService.instance
  }

  /**
   * Create a new batch
   */
  async create(
    input: ICreateBatchInput,
    userId: string
  ): Promise<IBatchWithRelations> {
    try {
      logger.info('Creating batch', { batchNumber: input.batchNumber, userId })

      // Validate item exists
      const item = await prisma.item.findUnique({
        where: { id: input.itemId },
      })

      if (!item) {
        throw new NotFoundError('Item not found')
      }

      // Validate batchNumber uniqueness
      const existing = await prisma.batch.findUnique({
        where: { batchNumber: input.batchNumber },
      })

      if (existing) {
        throw new BadRequestError('Batch number already exists')
      }

      const batch = await prisma.batch.create({
        data: {
          id: uuidv4(),
          batchNumber: input.batchNumber,
          itemId: input.itemId,
          manufacturingDate: input.manufacturingDate || null,
          expiryDate: input.expiryDate || null,
          initialQuantity: input.initialQuantity,
          currentQuantity: input.initialQuantity,
          isActive: true,
          notes: input.notes || null,
        },
        include: {
          item: true,
          movements: true,
          preInvoiceItems: true,
          exitNoteItems: true,
        },
      })

      // Emit event
      await eventService.emit({
        type: EventType.BATCH_CREATED,
        entityId: batch.id,
        entityType: 'batch',
        userId,
        data: {
          batchNumber: batch.batchNumber,
          itemId: batch.itemId,
          quantity: batch.initialQuantity,
        },
      })

      logger.info('Batch created', {
        batchId: batch.id,
        batchNumber: batch.batchNumber,
      })

      return this.mapToInterface(batch)
    } catch (error) {
      logger.error('Error creating batch', { error })
      throw error
    }
  }

  /**
   * Find batch by ID
   */
  async findById(id: string): Promise<IBatchWithRelations> {
    try {
      const batch = await prisma.batch.findUnique({
        where: { id },
        include: {
          item: true,
          movements: true,
          preInvoiceItems: true,
          exitNoteItems: true,
        },
      })

      if (!batch) {
        throw new NotFoundError('Batch not found')
      }

      return this.mapToInterface(batch)
    } catch (error) {
      logger.error('Error finding batch', { error })
      throw error
    }
  }

  /**
   * Find batches with pagination
   */
  async findAll(
    filters: IBatchFilters,
    page = 1,
    limit = 10,
    prismaClient?: any
  ): Promise<{
    data: IBatchWithRelations[]
    total: number
    page: number
    limit: number
  }> {
    try {
      const where: any = {}

      if (filters.itemId) where.itemId = filters.itemId
      if (filters.batchNumber)
        where.batchNumber = { contains: filters.batchNumber }
      if (filters.isActive !== undefined) where.isActive = filters.isActive

      if (filters.expiryDateFrom || filters.expiryDateTo) {
        where.expiryDate = {}
        if (filters.expiryDateFrom)
          where.expiryDate.gte = filters.expiryDateFrom
        if (filters.expiryDateTo) where.expiryDate.lte = filters.expiryDateTo
      }

      const total = await prisma.batch.count({ where })

      const batches = await prisma.batch.findMany({
        where,
        include: {
          item: true,
          movements: true,
          preInvoiceItems: true,
          exitNoteItems: true,
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      })

      return {
        data: batches.map((b) => this.mapToInterface(b)),
        total,
        page,
        limit,
      }
    } catch (error) {
      logger.error('Error finding batches', { error })
      throw error
    }
  }

  /**
   * Find batches by item ID
   */
  async findByItemId(itemId: string): Promise<IBatchWithRelations[]> {
    try {
      const batches = await prisma.batch.findMany({
        where: { itemId, isActive: true },
        include: {
          item: true,
          movements: true,
          preInvoiceItems: true,
          exitNoteItems: true,
        },
        orderBy: { expiryDate: 'asc' },
      })

      return batches.map((b) => this.mapToInterface(b))
    } catch (error) {
      logger.error('Error finding batches by item', { error })
      throw error
    }
  }

  /**
   * Find expiring batches
   */
  async findExpiringBatches(daysThreshold = 30): Promise<IBatchExpiryInfo[]> {
    try {
      const now = new Date()
      const futureDate = new Date(
        now.getTime() + daysThreshold * 24 * 60 * 60 * 1000
      )

      const batches = await prisma.batch.findMany({
        where: {
          expiryDate: {
            gte: now,
            lte: futureDate,
          },
          isActive: true,
        },
        include: { item: true },
      })

      return batches.map((batch) => ({
        batchId: batch.id,
        batchNumber: batch.batchNumber,
        itemId: batch.itemId,
        itemName: batch.item?.name,
        expiryDate: batch.expiryDate!,
        daysUntilExpiry: Math.ceil(
          (batch.expiryDate!.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)
        ),
        currentQuantity: batch.currentQuantity,
        status: this.calculateStatus(batch),
      }))
    } catch (error) {
      logger.error('Error finding expiring batches', { error })
      throw error
    }
  }

  /**
   * Find expired batches
   */
  async findExpiredBatches(): Promise<IBatchExpiryInfo[]> {
    try {
      const now = new Date()

      const batches = await prisma.batch.findMany({
        where: {
          expiryDate: {
            lt: now,
          },
          isActive: true,
        },
        include: { item: true },
      })

      return batches.map((batch) => ({
        batchId: batch.id,
        batchNumber: batch.batchNumber,
        itemId: batch.itemId,
        itemName: batch.item?.name,
        expiryDate: batch.expiryDate!,
        daysUntilExpiry: Math.ceil(
          (batch.expiryDate!.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)
        ),
        currentQuantity: batch.currentQuantity,
        status: BatchStatus.EXPIRED,
      }))
    } catch (error) {
      logger.error('Error finding expired batches', { error })
      throw error
    }
  }

  /**
   * Update batch
   */
  async update(
    id: string,
    input: IUpdateBatchInput,
    userId: string
  ): Promise<IBatchWithRelations> {
    try {
      logger.info('Updating batch', { batchId: id, userId })

      const batch = await prisma.batch.findUnique({
        where: { id },
      })

      if (!batch) {
        throw new NotFoundError('Batch not found')
      }

      const updated = await prisma.batch.update({
        where: { id },
        data: {
          currentQuantity: input.currentQuantity ?? batch.currentQuantity,
          notes: input.notes ?? batch.notes,
          isActive: input.isActive ?? batch.isActive,
        },
        include: {
          item: true,
          movements: true,
          preInvoiceItems: true,
          exitNoteItems: true,
        },
      })

      logger.info('Batch updated', { batchId: updated.id })

      return this.mapToInterface(updated)
    } catch (error) {
      logger.error('Error updating batch', { error })
      throw error
    }
  }

  /**
   * Deactivate batch
   */
  async deactivate(id: string, userId: string): Promise<IBatchWithRelations> {
    try {
      logger.info('Deactivating batch', { batchId: id, userId })

      const batch = await prisma.batch.findUnique({
        where: { id },
      })

      if (!batch) {
        throw new NotFoundError('Batch not found')
      }

      const updated = await prisma.batch.update({
        where: { id },
        data: { isActive: false },
        include: {
          item: true,
          movements: true,
          preInvoiceItems: true,
          exitNoteItems: true,
        },
      })

      logger.info('Batch deactivated', { batchId: updated.id })

      return this.mapToInterface(updated)
    } catch (error) {
      logger.error('Error deactivating batch', { error })
      throw error
    }
  }

  /**
   * Delete batch
   */
  async delete(id: string): Promise<void> {
    try {
      logger.info('Deleting batch', { batchId: id })

      const batch = await prisma.batch.findUnique({
        where: { id },
      })

      if (!batch) {
        throw new NotFoundError('Batch not found')
      }

      // Check if batch has movements or other relations
      const movements = await prisma.movement.count({
        where: { batchId: id },
      })

      if (movements > 0) {
        throw new BadRequestError(
          'Cannot delete batch with associated movements'
        )
      }

      await prisma.batch.delete({
        where: { id },
      })

      logger.info('Batch deleted', { batchId: id })
    } catch (error) {
      logger.error('Error deleting batch', { error })
      throw error
    }
  }

  /**
   * Calculate batch status
   */
  private calculateStatus(batch: any): BatchStatus {
    if (!batch.isActive) {
      return BatchStatus.INACTIVE
    }

    if (!batch.expiryDate) {
      return BatchStatus.ACTIVE
    }

    const now = new Date()
    const daysUntilExpiry = Math.ceil(
      (batch.expiryDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)
    )

    if (daysUntilExpiry < 0) {
      return BatchStatus.EXPIRED
    }

    if (daysUntilExpiry <= 30) {
      return BatchStatus.EXPIRING_SOON
    }

    return BatchStatus.ACTIVE
  }

  /**
   * Map batch to interface
   */
  private mapToInterface(batch: any): IBatchWithRelations {
    return {
      id: batch.id,
      batchNumber: batch.batchNumber,
      itemId: batch.itemId,
      manufacturingDate: batch.manufacturingDate,
      expiryDate: batch.expiryDate,
      initialQuantity: batch.initialQuantity,
      currentQuantity: batch.currentQuantity,
      isActive: batch.isActive,
      notes: batch.notes,
      createdAt: batch.createdAt,
      updatedAt: batch.updatedAt,
      item: batch.item,
      movements: batch.movements,
      preInvoiceItems: batch.preInvoiceItems,
      exitNoteItems: batch.exitNoteItems,
    }
  }
}

export default BatchesService.getInstance()
