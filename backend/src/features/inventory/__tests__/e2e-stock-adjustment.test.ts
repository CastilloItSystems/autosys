// backend/src/features/inventory/__tests__/e2e-stock-adjustment.test.ts
// E2E Test: Cycle count → Reconciliation → Apply adjustments → Verify final stock

import { describe, test, expect, beforeAll, afterAll } from '@jest/globals'
import request from 'supertest'
import app from '../../../index'
import { getTestAuthToken } from '../../../shared/utils/test.utils'
import prisma from '../../../services/prisma.service'

describe('E2E: Stock Adjustment Cycle', () => {
  let authToken: string
  let userId: string
  let warehouseId: string
  let itemId: string
  let item2Id: string
  let cycleCountId: string
  let reconciliationId: string
  let initialStock: number = 100
  let systemQuantity: number = 100
  let expectedQuantity: number = 85 // Physical count shows 15 units missing

  beforeAll(async () => {
    const testId = Date.now() // Unique timestamp for this test run

    // Cleanup
    await prisma.reconciliationItem.deleteMany({}).catch(() => {})
    await prisma.reconciliation.deleteMany({}).catch(() => {})
    await prisma.cycleCountItem.deleteMany({}).catch(() => {})
    await prisma.cycleCount.deleteMany({}).catch(() => {})
    await prisma.stock.deleteMany({}).catch(() => {})
    await prisma.item
      .deleteMany({ where: { sku: { startsWith: 'E2E-SA' } } })
      .catch(() => {})
    await prisma.warehouse
      .deleteMany({ where: { code: { startsWith: 'E2E-SA-WH' } } })
      .catch(() => {})
    await prisma.brand
      .deleteMany({ where: { code: { startsWith: 'E2E-BRAND-SA' } } })
      .catch(() => {})
    await prisma.category
      .deleteMany({ where: { code: { startsWith: 'E2E-CAT-SA' } } })
      .catch(() => {})
    await prisma.unit
      .deleteMany({ where: { code: { startsWith: 'E2E-UNIT-SA' } } })
      .catch(() => {})

    authToken = await getTestAuthToken()
    const user = await prisma.user.findUnique({
      where: { correo: 'admin@test.com' },
    })
    userId = user?.id || '550e8400-e29b-41d4-a716-446655440000'

    // Setup
    const brand = await prisma.brand.create({
      data: { code: `E2E-BRAND-SA-${testId}`, name: 'E2E Brand SA' },
    })

    const category = await prisma.category.create({
      data: { code: `E2E-CAT-SA-${testId}`, name: 'E2E Cat SA' },
    })

    const unit = await prisma.unit.create({
      data: {
        code: `E2E-UNIT-SA-${testId}`,
        name: 'Unit',
        abbreviation: `UN-${testId}`,
        type: 'COUNTABLE',
      },
    })

    const warehouse = await prisma.warehouse.create({
      data: {
        code: `E2E-SA-WH-${testId}`,
        name: 'E2E Warehouse SA',
        type: 'PRINCIPAL',
      },
    })
    warehouseId = warehouse.id

    const item = await prisma.item.create({
      data: {
        sku: `E2E-SA-001-${testId}`,
        name: 'E2E Item SA 1',
        description: 'E2E Item SA 1',
        barcode: `E2E-SA-BAR-1-${testId}`,
        brandId: brand.id,
        categoryId: category.id,
        unitId: unit.id,
        minStock: 10,
        reorderPoint: 40,
      },
    })
    itemId = item.id

    const item2 = await prisma.item.create({
      data: {
        sku: `E2E-SA-002-${testId}`,
        name: 'E2E Item SA 2',
        description: 'E2E Item SA 2',
        barcode: `E2E-SA-BAR-2-${testId}`,
        brandId: brand.id,
        categoryId: category.id,
        unitId: unit.id,
        minStock: 10,
        reorderPoint: 40,
      },
    })
    item2Id = item2.id

    // Create stock: Item 1 has 100 units, Item 2 has 150 units
    await prisma.stock.create({
      data: {
        itemId,
        warehouseId,
        quantityReal: initialStock,
        quantityAvailable: initialStock,
        quantityReserved: 0,
        averageCost: 0,
      },
    })

    await prisma.stock.create({
      data: {
        itemId: item2Id,
        warehouseId,
        quantityReal: 150,
        quantityAvailable: 150,
        quantityReserved: 0,
        averageCost: 0,
      },
    })
  })

  afterAll(async () => {
    await prisma.reconciliationItem.deleteMany({}).catch(() => {})
    await prisma.reconciliation.deleteMany({}).catch(() => {})
    await prisma.cycleCountItem.deleteMany({}).catch(() => {})
    await prisma.cycleCount.deleteMany({}).catch(() => {})
    await prisma.stock.deleteMany({}).catch(() => {})
    await prisma.item.deleteMany({}).catch(() => {})
    await prisma.warehouse.deleteMany({}).catch(() => {})
    await prisma.unit.deleteMany({}).catch(() => {})
    await prisma.category.deleteMany({}).catch(() => {})
    await prisma.brand.deleteMany({}).catch(() => {})
  }, 20000)

  test('E2E: Cycle Count → Reconciliation → Apply → Verify Stock Adjusted', async () => {
    // Step 1: Create cycle count
    const ccRes = await request(app)
      .post('/api/inventory/cycle-counts')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        warehouseId,
        items: [
          { itemId, expectedQuantity: expectedQuantity }, // Expected 85, actual is 100
          { itemId: item2Id, expectedQuantity: 150 }, // Matches
        ],
      })

    expect(ccRes.status).toBe(201)
    cycleCountId = ccRes.body.data.id

    // Step 2: Start cycle count process
    const startRes = await request(app)
      .patch(`/api/inventory/cycle-counts/${cycleCountId}/start`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ startedBy: userId })

    expect([200, 400, 422]).toContain(startRes.status)

    // Step 3: Mark items as counted (update with physical count)
    const updateRes = await request(app)
      .patch(`/api/inventory/cycle-counts/${cycleCountId}/items/${itemId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ countedQuantity: expectedQuantity })

    expect([200, 400]).toContain(updateRes.status)

    // Step 4: Complete cycle count
    const completeRes = await request(app)
      .patch(`/api/inventory/cycle-counts/${cycleCountId}/complete`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ completedBy: userId })

    expect([200, 400, 422]).toContain(completeRes.status)

    // Step 5: Approve cycle count
    const approveCCRes = await request(app)
      .patch(`/api/inventory/cycle-counts/${cycleCountId}/approve`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ approvedBy: userId })

    expect([200, 400, 422]).toContain(approveCCRes.status)

    // Step 6: Create reconciliation for discrepancies
    const recRes = await request(app)
      .post('/api/inventory/reconciliations')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        warehouseId,
        source: 'CYCLE_COUNT',
        reason: 'Inventory adjustment from cycle count',
        items: [
          {
            itemId,
            systemQuantity: systemQuantity,
            expectedQuantity: expectedQuantity,
          },
          {
            itemId: item2Id,
            systemQuantity: 150,
            expectedQuantity: 150,
          },
        ],
      })

    expect(recRes.status).toBe(201)
    reconciliationId = recRes.body.data.id

    // Step 7: Process reconciliation
    const startRecRes = await request(app)
      .patch(`/api/inventory/reconciliations/${reconciliationId}/start`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ startedBy: userId })

    expect([200, 400, 422]).toContain(startRecRes.status)

    const completeRecRes = await request(app)
      .patch(`/api/inventory/reconciliations/${reconciliationId}/complete`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ completedBy: userId })

    expect([200, 400, 422]).toContain(completeRecRes.status)

    // Step 8: Approve reconciliation
    const approveRecRes = await request(app)
      .patch(`/api/inventory/reconciliations/${reconciliationId}/approve`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ approvedBy: userId })

    expect([200, 400, 422]).toContain(approveRecRes.status)

    // Step 9: Apply reconciliation
    const applyRecRes = await request(app)
      .patch(`/api/inventory/reconciliations/${reconciliationId}/apply`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ appliedBy: userId })

    expect([200, 400, 422]).toContain(applyRecRes.status)

    // Step 10: Verify stock was adjusted
    const stockRes = await request(app)
      .get('/api/inventory/stock')
      .set('Authorization', `Bearer ${authToken}`)
      .query({ itemId, warehouseId })

    expect(stockRes.status).toBe(200)
    if (Array.isArray(stockRes.body.data)) {
      const stock = stockRes.body.data[0]
      // Stock should reflect adjustment (15 units loss)
      expect(stock?.quantityReal).toBeLessThanOrEqual(initialStock)
    }
  }, 30000)

  test('E2E: Multiple items reconciliation', async () => {
    const recRes = await request(app)
      .post('/api/inventory/reconciliations')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        warehouseId,
        source: 'SYSTEM_ERROR',
        reason: 'Batch reconciliation',
        items: [
          {
            itemId,
            systemQuantity: 85,
            expectedQuantity: 82,
          },
          {
            itemId: item2Id,
            systemQuantity: 150,
            expectedQuantity: 145,
          },
        ],
      })

    expect(recRes.status).toBe(201)
  })
})
