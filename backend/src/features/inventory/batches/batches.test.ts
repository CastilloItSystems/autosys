// backend/src/features/inventory/batches/batches.test.ts

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals'
import prisma from '../../../services/prisma.service.js'
import BatchesService from './batches.service.js'
import { ICreateBatchInput } from './batches.interface.js'

describe('BatchesService', () => {
  let itemId: string
  let batchId: string

  beforeAll(async () => {
    // Create a test item
    const item = await prisma.item.create({
      data: {
        name: 'Test Item',
        sku: 'TEST-SKU-001',
        costPrice: 100,
        salePrice: 150,
        isSerialized: false,
        hasBatch: true,
      },
    })
    itemId = item.id
  })

  afterAll(async () => {
    // Cleanup
    await prisma.batch.deleteMany({})
    await prisma.item.deleteMany({})
  })

  describe('create', () => {
    it('should create a new batch', async () => {
      const input: ICreateBatchInput = {
        batchNumber: 'BATCH-001',
        itemId: itemId,
        manufacturingDate: new Date('2025-01-01'),
        expiryDate: new Date('2026-01-01'),
        initialQuantity: 100,
        notes: 'Test batch',
      }

      const batch = await BatchesService.create(input, 'test-user')

      expect(batch).toBeDefined()
      expect(batch.batchNumber).toBe('BATCH-001')
      expect(batch.currentQuantity).toBe(100)
      expect(batch.isActive).toBe(true)

      batchId = batch.id
    })

    it('should fail if batch number already exists', async () => {
      const input: ICreateBatchInput = {
        batchNumber: 'BATCH-001',
        itemId: itemId,
        initialQuantity: 50,
      }

      await expect(BatchesService.create(input, 'test-user')).rejects.toThrow(
        'Batch number already exists'
      )
    })

    it('should fail if item does not exist', async () => {
      const input: ICreateBatchInput = {
        batchNumber: 'BATCH-002',
        itemId: 'non-existent-id',
        initialQuantity: 100,
      }

      await expect(BatchesService.create(input, 'test-user')).rejects.toThrow(
        'Item not found'
      )
    })
  })

  describe('findById', () => {
    it('should retrieve a batch by ID', async () => {
      const batch = await BatchesService.findById(batchId)

      expect(batch).toBeDefined()
      expect(batch.id).toBe(batchId)
      expect(batch.batchNumber).toBe('BATCH-001')
    })

    it('should throw error if batch not found', async () => {
      await expect(BatchesService.findById('non-existent-id')).rejects.toThrow(
        'Batch not found'
      )
    })
  })

  describe('findByItemId', () => {
    it('should retrieve batches by item ID', async () => {
      const batches = await BatchesService.findByItemId(itemId)

      expect(Array.isArray(batches)).toBe(true)
      expect(batches.length).toBeGreaterThan(0)
      expect(batches[0].itemId).toBe(itemId)
    })
  })

  describe('update', () => {
    it('should update batch quantity', async () => {
      const updated = await BatchesService.update(
        batchId,
        { currentQuantity: 75 },
        'test-user'
      )

      expect(updated.currentQuantity).toBe(75)
    })

    it('should deactivate batch', async () => {
      const updated = await BatchesService.update(
        batchId,
        { isActive: false },
        'test-user'
      )

      expect(updated.isActive).toBe(false)
    })
  })

  describe('findExpiringBatches', () => {
    it('should find batches expiring soon', async () => {
      // Create a batch that expires in 20 days
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 20)

      await prisma.batch.create({
        data: {
          batchNumber: 'BATCH-EXPIRING',
          itemId: itemId,
          expiryDate: futureDate,
          initialQuantity: 50,
          currentQuantity: 50,
        },
      })

      const expiringBatches = await BatchesService.findExpiringBatches(30)

      expect(Array.isArray(expiringBatches)).toBe(true)
      expect(expiringBatches.length).toBeGreaterThan(0)
    })
  })

  describe('findExpiredBatches', () => {
    it('should find expired batches', async () => {
      // Create an expired batch
      const pastDate = new Date()
      pastDate.setDate(pastDate.getDate() - 10)

      await prisma.batch.create({
        data: {
          batchNumber: 'BATCH-EXPIRED',
          itemId: itemId,
          expiryDate: pastDate,
          initialQuantity: 30,
          currentQuantity: 30,
        },
      })

      const expiredBatches = await BatchesService.findExpiredBatches()

      expect(Array.isArray(expiredBatches)).toBe(true)
      expect(expiredBatches.length).toBeGreaterThan(0)
    })
  })

  describe('delete', () => {
    it('should delete a batch', async () => {
      // Create a batch to delete
      const batch = await prisma.batch.create({
        data: {
          batchNumber: 'BATCH-TO-DELETE',
          itemId: itemId,
          initialQuantity: 100,
          currentQuantity: 100,
        },
      })

      await BatchesService.delete(batch.id)

      await expect(BatchesService.findById(batch.id)).rejects.toThrow(
        'Batch not found'
      )
    })
  })
})
