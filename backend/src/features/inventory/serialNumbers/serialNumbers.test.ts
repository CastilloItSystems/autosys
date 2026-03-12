// backend/src/features/inventory/serialNumbers/serialNumbers.test.ts

import 'dotenv/config'
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals'
import prisma from '../../../services/prisma.service.js'
import SerialNumbersService from './serialNumbers.service.js'
import {
  ICreateSerialNumberInput,
  SerialStatus,
} from './serialNumbers.interface.js'

describe('SerialNumbersService', () => {
  let itemId: string
  let warehouseId: string
  let serialId: string
  let brandId: string
  let categoryId: string
  let unitId: string

  beforeAll(async () => {
    // Cleanup previous test data
    await prisma.serialNumber
      .deleteMany({ where: { serialNumber: { startsWith: 'SN-TEST-' } } })
      .catch(() => {})
    await prisma.item
      .deleteMany({ where: { sku: { startsWith: 'TEST-SN-' } } })
      .catch(() => {})
    await prisma.warehouse
      .deleteMany({ where: { code: { startsWith: 'TEST-SN-WH' } } })
      .catch(() => {})
    await prisma.brand
      .deleteMany({ where: { code: 'TEST-BRAND-SN' } })
      .catch(() => {})
    await prisma.category
      .deleteMany({ where: { code: 'TEST-CAT-SN' } })
      .catch(() => {})
    await prisma.unit
      .deleteMany({ where: { code: 'TEST-UNIT-SN' } })
      .catch(() => {})

    // Create dependencies
    const brand = await prisma.brand.create({
      data: {
        code: 'TEST-BRAND-SN',
        name: 'Test Brand SN',
        type: 'PART',
        isActive: true,
      },
    })
    brandId = brand.id

    const category = await prisma.category.create({
      data: { code: 'TEST-CAT-SN', name: 'Test Category SN', isActive: true },
    })
    categoryId = category.id

    const unit = await prisma.unit.create({
      data: {
        code: 'TEST-UNIT-SN',
        name: 'Test Unit SN',
        abbreviation: 'TSN',
        type: 'COUNTABLE',
        isActive: true,
      },
    })
    unitId = unit.id

    // Create test item
    const item = await prisma.item.create({
      data: {
        name: 'Serialized Item',
        sku: 'TEST-SN-001',
        costPrice: 500,
        salePrice: 750,
        isSerialized: true,
        hasBatch: false,
        brandId,
        categoryId,
        unitId,
      },
    })
    itemId = item.id

    // Create test warehouse
    const warehouse = await prisma.warehouse.create({
      data: {
        code: 'TEST-SN-WH-1',
        name: 'Test SN Warehouse',
        type: 'PRINCIPAL',
      },
    })
    warehouseId = warehouse.id
  }, 20000)

  afterAll(async () => {
    try {
      await prisma.serialNumber
        .deleteMany({ where: { serialNumber: { startsWith: 'SN-TEST-' } } })
        .catch(() => {})
      await prisma.item
        .deleteMany({ where: { sku: { startsWith: 'TEST-SN-' } } })
        .catch(() => {})
      if (unitId)
        await prisma.unit.delete({ where: { id: unitId } }).catch(() => {})
      if (categoryId)
        await prisma.category
          .delete({ where: { id: categoryId } })
          .catch(() => {})
      if (brandId)
        await prisma.brand.delete({ where: { id: brandId } }).catch(() => {})
      await prisma.warehouse
        .deleteMany({ where: { code: { startsWith: 'TEST-SN-WH' } } })
        .catch(() => {})
    } catch (error) {
      console.log('Error en afterAll cleanup:', error)
    }
  })

  describe('create', () => {
    it('should create a new serial number', async () => {
      const input: ICreateSerialNumberInput = {
        serialNumber: 'SN-TEST-001-2025',
        itemId: itemId,
        warehouseId: warehouseId,
        status: SerialStatus.IN_STOCK,
      }

      const serial = await SerialNumbersService.create(input, 'test-user')

      expect(serial).toBeDefined()
      expect(serial.serialNumber).toBe('SN-TEST-001-2025')
      expect(serial.status).toBe(SerialStatus.IN_STOCK)

      serialId = serial.id
    })

    it('should fail if serial number already exists', async () => {
      const input: ICreateSerialNumberInput = {
        serialNumber: 'SN-TEST-001-2025',
        itemId: itemId,
      }

      await expect(
        SerialNumbersService.create(input, 'test-user')
      ).rejects.toThrow('Serial number already exists')
    })

    it('should fail if item is not serialized', async () => {
      const nonSerItem = await prisma.item.create({
        data: {
          name: 'Non-Serialized Item',
          sku: 'TEST-SN-NONSER-001',
          costPrice: 100,
          salePrice: 150,
          isSerialized: false,
          hasBatch: false,
          brandId,
          categoryId,
          unitId,
        },
      })

      const input: ICreateSerialNumberInput = {
        serialNumber: 'SN-TEST-INVALID',
        itemId: nonSerItem.id,
      }

      await expect(
        SerialNumbersService.create(input, 'test-user')
      ).rejects.toThrow('Item is not marked as serialized')

      await prisma.item.delete({ where: { id: nonSerItem.id } })
    })
  })

  describe('findById', () => {
    it('should retrieve a serial number by ID', async () => {
      const serial = await SerialNumbersService.findById(serialId)

      expect(serial).toBeDefined()
      expect(serial.id).toBe(serialId)
      expect(serial.serialNumber).toBe('SN-TEST-001-2025')
    })

    it('should throw error if not found', async () => {
      await expect(
        SerialNumbersService.findById('00000000-0000-0000-0000-000000000000')
      ).rejects.toThrow('Serial number not found')
    })
  })

  describe('findBySerialNumber', () => {
    it('should find serial by string', async () => {
      const serial =
        await SerialNumbersService.findBySerialNumber('SN-TEST-001-2025')

      expect(serial).toBeDefined()
      expect(serial.serialNumber).toBe('SN-TEST-001-2025')
    })
  })

  describe('findByStatus', () => {
    it('should find serials by status', async () => {
      const serials = await SerialNumbersService.findByStatus(
        SerialStatus.IN_STOCK
      )

      expect(Array.isArray(serials)).toBe(true)
      expect(serials.length).toBeGreaterThan(0)
    })
  })

  describe('update', () => {
    it('should update serial status', async () => {
      const updated = await SerialNumbersService.update(
        serialId,
        { status: SerialStatus.SOLD },
        'test-user'
      )

      expect(updated.status).toBe(SerialStatus.SOLD)
    })
  })
})
