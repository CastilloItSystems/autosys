// backend/src/features/inventory/stock/bulk/bulk.test.ts

import { describe, test, expect, beforeAll, afterAll } from '@jest/globals'
import request from 'supertest'
import app from '../../../../app.js'
import { getTestCredentials } from '../../../../shared/utils/test.utils.js'
import prisma from '../../../../services/prisma.service.js'

describe('Stock Bulk Operations Routes', () => {
  let authToken: string
  let empresaId: string
  let warehouseId: string
  let warehouseCode: string
  let warehouse2Id: string
  let warehouse2Code: string
  let itemId: string
  let unitId: string
  let categoryId: string

  const TEST_SKU = 'STBULK-TEST-001'
  const TEST_SKU_2 = 'STBULK-TEST-002'
  const WH_CODE = 'STBULK-WH01'
  const WH2_CODE = 'STBULK-WH02'

  beforeAll(async () => {
    const creds = await getTestCredentials()
    authToken = creds.authToken
    empresaId = creds.empresaId

    // Cleanup previous test data
    await prisma.movement.deleteMany({ where: { reference: { startsWith: 'BULK-' } } }).catch(() => {})
    await prisma.stock.deleteMany({ where: { item: { empresaId, sku: { in: [TEST_SKU, TEST_SKU_2] } } } }).catch(() => {})
    await prisma.item.deleteMany({ where: { empresaId, sku: { in: [TEST_SKU, TEST_SKU_2] } } }).catch(() => {})
    await prisma.warehouse.deleteMany({ where: { empresaId, code: { in: [WH_CODE, WH2_CODE] } } }).catch(() => {})
    await prisma.bulkOperation.deleteMany({ where: { operationType: { in: ['STOCK_IMPORT', 'STOCK_ADJUSTMENT', 'STOCK_TRANSFER', 'STOCK_EXPORT'] } } }).catch(() => {})
    await prisma.unit.deleteMany({ where: { empresaId, code: 'STBULK-UNIT' } }).catch(() => {})
    await prisma.category.deleteMany({ where: { empresaId, code: 'STBULK-CAT' } }).catch(() => {})

    // Create unit & category
    const unit = await prisma.unit.create({
      data: { code: 'STBULK-UNIT', name: 'StBulk Unit', abbreviation: 'SBU', type: 'COUNTABLE', empresaId },
    })
    unitId = unit.id

    const category = await prisma.category.create({
      data: { code: 'STBULK-CAT', name: 'StBulk Category', empresaId },
    })
    categoryId = category.id

    // Create warehouses
    const wh = await prisma.warehouse.create({
      data: { code: WH_CODE, name: 'StBulk Warehouse 1', type: 'PRINCIPAL', empresaId },
    })
    warehouseId = wh.id
    warehouseCode = wh.code

    const wh2 = await prisma.warehouse.create({
      data: { code: WH2_CODE, name: 'StBulk Warehouse 2', type: 'SUCURSAL', empresaId },
    })
    warehouse2Id = wh2.id
    warehouse2Code = wh2.code

    // Create items
    const item = await prisma.item.create({
      data: { sku: TEST_SKU, code: TEST_SKU, name: 'StBulk Item 1', costPrice: 10, salePrice: 20, empresaId, unitId, categoryId },
    })
    itemId = item.id

    await prisma.item.create({
      data: { sku: TEST_SKU_2, code: TEST_SKU_2, name: 'StBulk Item 2', costPrice: 15, salePrice: 30, empresaId, unitId, categoryId },
    })
  }, 30000)

  afterAll(async () => {
    await prisma.movement.deleteMany({ where: { reference: { startsWith: 'BULK-' } } }).catch(() => {})
    await prisma.stock.deleteMany({ where: { item: { empresaId, sku: { in: [TEST_SKU, TEST_SKU_2] } } } }).catch(() => {})
    await prisma.item.deleteMany({ where: { empresaId, sku: { in: [TEST_SKU, TEST_SKU_2] } } }).catch(() => {})
    await prisma.warehouse.deleteMany({ where: { empresaId, code: { in: [WH_CODE, WH2_CODE] } } }).catch(() => {})
    await prisma.bulkOperation.deleteMany({ where: { operationType: { in: ['STOCK_IMPORT', 'STOCK_ADJUSTMENT', 'STOCK_TRANSFER', 'STOCK_EXPORT'] } } }).catch(() => {})
    await prisma.unit.deleteMany({ where: { empresaId, code: 'STBULK-UNIT' } }).catch(() => {})
    await prisma.category.deleteMany({ where: { empresaId, code: 'STBULK-CAT' } }).catch(() => {})
  })

  // ── IMPORT ─────────────────────────────────────────────────────────────────

  describe('POST /api/inventory/stock/bulk/import', () => {
    test('should import stock from CSV and create ADJUSTMENT_IN movements', async () => {
      const csv = `sku,warehouseCode,quantity,unitCost,location,notes
${TEST_SKU},${WH_CODE},100,25.50,A1-R01,Carga inicial
${TEST_SKU_2},${WH_CODE},50,15.00,,`

      const res = await request(app)
        .post('/api/inventory/stock/bulk/import')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Empresa-Id', empresaId)
        .send({ fileName: 'test-import.csv', fileContent: csv, options: { updateExisting: false } })

      expect(res.status).toBe(201)
      expect(res.body.data.processed).toBe(2)
      expect(res.body.data.failed).toBe(0)
      expect(res.body.data.errors).toHaveLength(0)

      // Verify stock was created
      const stock = await prisma.stock.findUnique({
        where: { itemId_warehouseId: { itemId, warehouseId } },
      })
      expect(stock).not.toBeNull()
      expect(stock?.quantityReal).toBe(100)
      expect(stock?.quantityAvailable).toBe(100)

      // Verify ADJUSTMENT_IN movement was created
      const movement = await prisma.movement.findFirst({
        where: { itemId, warehouseToId: warehouseId, type: 'ADJUSTMENT_IN' },
      })
      expect(movement).not.toBeNull()
      expect(movement?.quantity).toBe(100)

      // Verify BulkOperation record
      const op = await prisma.bulkOperation.findFirst({
        where: { id: res.body.data.operationId },
      })
      expect(op?.status).toBe('COMPLETED')
      expect(op?.operationType).toBe('STOCK_IMPORT')
    })

    test('should fail when SKU does not exist', async () => {
      const csv = `sku,warehouseCode,quantity
NONEXISTENT-SKU-999,${WH_CODE},10`

      const res = await request(app)
        .post('/api/inventory/stock/bulk/import')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Empresa-Id', empresaId)
        .send({ fileName: 'bad.csv', fileContent: csv })

      expect(res.status).toBe(201)
      expect(res.body.data.failed).toBe(1)
      expect(res.body.data.errors[0].error).toContain('no encontrado')
    })

    test('should fail when updateExisting is false and stock already exists', async () => {
      const csv = `sku,warehouseCode,quantity
${TEST_SKU},${WH_CODE},10`

      const res = await request(app)
        .post('/api/inventory/stock/bulk/import')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Empresa-Id', empresaId)
        .send({ fileName: 'dup.csv', fileContent: csv, options: { updateExisting: false } })

      expect(res.status).toBe(201)
      expect(res.body.data.failed).toBe(1)
    })

    test('should update existing stock when updateExisting is true', async () => {
      const before = await prisma.stock.findUnique({
        where: { itemId_warehouseId: { itemId, warehouseId } },
      })
      const prevQty = before?.quantityReal ?? 0

      const csv = `sku,warehouseCode,quantity,unitCost
${TEST_SKU},${WH_CODE},20,30.00`

      const res = await request(app)
        .post('/api/inventory/stock/bulk/import')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Empresa-Id', empresaId)
        .send({ fileName: 'update.csv', fileContent: csv, options: { updateExisting: true } })

      expect(res.status).toBe(201)
      expect(res.body.data.processed).toBe(1)

      const after = await prisma.stock.findUnique({
        where: { itemId_warehouseId: { itemId, warehouseId } },
      })
      expect(after?.quantityReal).toBe(prevQty + 20)
    })
  })

  // ── ADJUSTMENT ─────────────────────────────────────────────────────────────

  describe('POST /api/inventory/stock/bulk/adjust', () => {
    test('should adjust stock with positive quantity (ADJUSTMENT_IN)', async () => {
      const before = await prisma.stock.findUnique({
        where: { itemId_warehouseId: { itemId, warehouseId } },
      })
      const prevQty = before?.quantityReal ?? 0

      const csv = `sku,warehouseCode,quantity,reference,notes
${TEST_SKU},${WH_CODE},10,CONT-2026-01,Conteo físico`

      const res = await request(app)
        .post('/api/inventory/stock/bulk/adjust')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Empresa-Id', empresaId)
        .send({ fileName: 'adj.csv', fileContent: csv })

      expect(res.status).toBe(201)
      expect(res.body.data.processed).toBe(1)
      expect(res.body.data.failed).toBe(0)

      const after = await prisma.stock.findUnique({
        where: { itemId_warehouseId: { itemId, warehouseId } },
      })
      expect(after?.quantityReal).toBe(prevQty + 10)

      const mv = await prisma.movement.findFirst({
        where: { itemId, type: 'ADJUSTMENT_IN', reference: 'CONT-2026-01' },
      })
      expect(mv).not.toBeNull()
    })

    test('should adjust stock with negative quantity (ADJUSTMENT_OUT)', async () => {
      const before = await prisma.stock.findUnique({
        where: { itemId_warehouseId: { itemId, warehouseId } },
      })
      const prevQty = before?.quantityReal ?? 0

      const csv = `sku,warehouseCode,quantity,notes
${TEST_SKU},${WH_CODE},-5,Artículos dañados`

      const res = await request(app)
        .post('/api/inventory/stock/bulk/adjust')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Empresa-Id', empresaId)
        .send({ fileName: 'adj-out.csv', fileContent: csv })

      expect(res.status).toBe(201)
      expect(res.body.data.processed).toBe(1)

      const after = await prisma.stock.findUnique({
        where: { itemId_warehouseId: { itemId, warehouseId } },
      })
      expect(after?.quantityReal).toBe(prevQty - 5)

      const mv = await prisma.movement.findFirst({
        where: { itemId, type: 'ADJUSTMENT_OUT', warehouseFromId: warehouseId },
        orderBy: { movementDate: 'desc' },
      })
      expect(mv).not.toBeNull()
    })

    test('should fail when stock goes negative', async () => {
      const csv = `sku,warehouseCode,quantity
${TEST_SKU},${WH_CODE},-99999`

      const res = await request(app)
        .post('/api/inventory/stock/bulk/adjust')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Empresa-Id', empresaId)
        .send({ fileName: 'neg.csv', fileContent: csv })

      expect(res.status).toBe(201)
      expect(res.body.data.failed).toBe(1)
      expect(res.body.data.errors[0].error).toContain('insuficiente')
    })

    test('should use explicit movementType from CSV', async () => {
      const csv = `sku,warehouseCode,quantity,movementType,reference
${TEST_SKU},${WH_CODE},5,PURCHASE,OC-2026-001`

      const res = await request(app)
        .post('/api/inventory/stock/bulk/adjust')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Empresa-Id', empresaId)
        .send({ fileName: 'purchase.csv', fileContent: csv })

      expect(res.status).toBe(201)
      expect(res.body.data.processed).toBe(1)

      const mv = await prisma.movement.findFirst({
        where: { itemId, type: 'PURCHASE', reference: 'OC-2026-001' },
      })
      expect(mv).not.toBeNull()
    })
  })

  // ── TRANSFER ───────────────────────────────────────────────────────────────

  describe('POST /api/inventory/stock/bulk/transfer', () => {
    test('should transfer stock between warehouses and create TRANSFER movement', async () => {
      const stockBefore = await prisma.stock.findUnique({
        where: { itemId_warehouseId: { itemId, warehouseId } },
      })
      const fromQtyBefore = stockBefore?.quantityReal ?? 0

      const csv = `sku,fromWarehouseCode,toWarehouseCode,quantity,notes
${TEST_SKU},${WH_CODE},${WH2_CODE},10,Traslado sucursal`

      const res = await request(app)
        .post('/api/inventory/stock/bulk/transfer')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Empresa-Id', empresaId)
        .send({ fileName: 'transfer.csv', fileContent: csv })

      expect(res.status).toBe(201)
      expect(res.body.data.processed).toBe(1)
      expect(res.body.data.failed).toBe(0)

      // Origin decreased
      const stockFrom = await prisma.stock.findUnique({
        where: { itemId_warehouseId: { itemId, warehouseId } },
      })
      expect(stockFrom?.quantityReal).toBe(fromQtyBefore - 10)

      // Destination increased (created via upsert)
      const stockTo = await prisma.stock.findUnique({
        where: { itemId_warehouseId: { itemId, warehouseId: warehouse2Id } },
      })
      expect(stockTo).not.toBeNull()
      expect(stockTo?.quantityReal).toBe(10)

      // TRANSFER movement with from/to warehouses
      const mv = await prisma.movement.findFirst({
        where: { itemId, type: 'TRANSFER', warehouseFromId: warehouseId, warehouseToId: warehouse2Id },
      })
      expect(mv).not.toBeNull()
    })

    test('should fail when origin has insufficient stock', async () => {
      const csv = `sku,fromWarehouseCode,toWarehouseCode,quantity
${TEST_SKU},${WH_CODE},${WH2_CODE},99999`

      const res = await request(app)
        .post('/api/inventory/stock/bulk/transfer')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Empresa-Id', empresaId)
        .send({ fileName: 'no-stock.csv', fileContent: csv })

      expect(res.status).toBe(201)
      expect(res.body.data.failed).toBe(1)
      expect(res.body.data.errors[0].error).toContain('insuficiente')
    })

    test('should fail when fromWarehouseCode equals toWarehouseCode (parsed at row level)', async () => {
      const csv = `sku,fromWarehouseCode,toWarehouseCode,quantity
${TEST_SKU},${WH_CODE},${WH_CODE},5`

      const res = await request(app)
        .post('/api/inventory/stock/bulk/transfer')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Empresa-Id', empresaId)
        .send({ fileName: 'same-wh.csv', fileContent: csv })

      expect(res.status).toBe(201)
      expect(res.body.data.failed).toBe(1)
    })
  })

  // ── EXPORT ─────────────────────────────────────────────────────────────────

  describe('POST /api/inventory/stock/bulk/export', () => {
    test('should export stock as CSV', async () => {
      const res = await request(app)
        .post('/api/inventory/stock/bulk/export')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Empresa-Id', empresaId)
        .send({ format: 'csv', filters: { warehouseId } })

      expect(res.status).toBe(200)
      expect(res.headers['content-type']).toContain('text/csv')
    })

    test('should export stock as JSON', async () => {
      const res = await request(app)
        .post('/api/inventory/stock/bulk/export')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Empresa-Id', empresaId)
        .send({ format: 'json' })

      expect(res.status).toBe(200)
    })
  })

  // ── OPERATIONS HISTORY ─────────────────────────────────────────────────────

  describe('GET /api/inventory/stock/bulk/operations', () => {
    test('should return paginated stock bulk operations', async () => {
      const res = await request(app)
        .get('/api/inventory/stock/bulk/operations')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Empresa-Id', empresaId)
        .query({ page: 1, limit: 10 })

      expect(res.status).toBe(200)
      expect(Array.isArray(res.body.data)).toBe(true)
      // All returned operations should be stock types
      const ops = res.body.data as any[]
      ops.forEach((op) => {
        expect(['STOCK_IMPORT', 'STOCK_ADJUSTMENT', 'STOCK_TRANSFER', 'STOCK_EXPORT']).toContain(op.operationType)
      })
    })
  })

  describe('GET /api/inventory/stock/bulk/operations/:operationId', () => {
    test('should return 404 for non-existent operation', async () => {
      const res = await request(app)
        .get('/api/inventory/stock/bulk/operations/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Empresa-Id', empresaId)

      expect(res.status).toBe(404)
    })
  })
})
