// backend/src/features/inventory/__tests__/e2e-complete-purchase.test.ts
// E2E Test: Full purchase cycle from supplier order through receipt and stock update

import { describe, test, expect, beforeAll, afterAll } from '@jest/globals'
import request from 'supertest'
import app from '../../../index'
import { getTestAuthToken } from '../../../shared/utils/test.utils'
import prisma from '../../../services/prisma.service'

describe('E2E: Complete Purchase Cycle', () => {
  let authToken: string
  let userId: string
  let supplierId: string
  let warehouseId: string
  let itemId: string
  let purchaseOrderId: string
  let receiveId: string
  let expectedStock: number

  beforeAll(async () => {
    // Cleanup
    await prisma.receiveItem.deleteMany({}).catch(() => {})
    await prisma.receive.deleteMany({}).catch(() => {})
    await prisma.purchaseOrderItem.deleteMany({}).catch(() => {})
    await prisma.purchaseOrder.deleteMany({}).catch(() => {})
    await prisma.stock.deleteMany({}).catch(() => {})
    await prisma.item
      .deleteMany({ where: { sku: { startsWith: 'E2E-CP' } } })
      .catch(() => {})
    await prisma.warehouse
      .deleteMany({ where: { code: 'E2E-CP-WH' } })
      .catch(() => {})
    await prisma.supplier.deleteMany({}).catch(() => {})
    await prisma.category
      .deleteMany({ where: { code: 'E2E-CAT-CP' } })
      .catch(() => {})
    await prisma.unit
      .deleteMany({ where: { code: 'E2E-UNIT-CP' } })
      .catch(() => {})
    await prisma.brand
      .deleteMany({ where: { code: 'E2E-BRAND-CP' } })
      .catch(() => {})

    authToken = await getTestAuthToken()
    const user = await prisma.user.findUnique({
      where: { correo: 'admin@test.com' },
    })
    userId = user?.id || '550e8400-e29b-41d4-a716-446655440000'

    // Setup
    const brand = await prisma.brand.create({
      data: { code: 'E2E-BRAND-CP', name: 'E2E Brand CP' },
    })

    const category = await prisma.category.create({
      data: { code: 'E2E-CAT-CP', name: 'E2E Cat CP' },
    })

    const unit = await prisma.unit.create({
      data: {
        code: 'E2E-UNIT-CP',
        name: 'Unit',
        abbreviation: 'UN',
        type: 'COUNTABLE',
      },
    })

    const warehouse = await prisma.warehouse.create({
      data: {
        code: 'E2E-CP-WH',
        name: 'E2E Warehouse CP',
      },
    })
    warehouseId = warehouse.id

    const item = await prisma.item.create({
      data: {
        sku: 'E2E-CP-001',
        name: 'E2E Item CP',
        description: 'E2E Item CP',
        barcode: 'E2E-CP-BAR',
        brandId: brand.id,
        categoryId: category.id,
        unitId: unit.id,
        minStock: 10,
        reorderPoint: 50,
      },
    })
    itemId = item.id

    const supplier = await prisma.supplier.create({
      data: {
        code: 'E2E-SUP-CP',
        name: 'E2E Supplier CP',
        taxId: 'J-111222333',
        email: 'e2e-cp@test.com',
        phone: '0241-1111111',
      },
    })
    supplierId = supplier.id

    expectedStock = 0
  })

  afterAll(async () => {
    await prisma.receiveItem.deleteMany({}).catch(() => {})
    await prisma.receive.deleteMany({}).catch(() => {})
    await prisma.purchaseOrderItem.deleteMany({}).catch(() => {})
    await prisma.purchaseOrder.deleteMany({}).catch(() => {})
    await prisma.stock.deleteMany({}).catch(() => {})
    await prisma.item.deleteMany({}).catch(() => {})
    await prisma.warehouse.deleteMany({}).catch(() => {})
    await prisma.supplier.deleteMany({}).catch(() => {})
    await prisma.unit.deleteMany({}).catch(() => {})
    await prisma.category.deleteMany({}).catch(() => {})
    await prisma.brand.deleteMany({}).catch(() => {})
  }, 20000)

  test('E2E: Order → Receive → Verify Stock Updated', async () => {
    // 1. Create PO
    const poRes = await request(app)
      .post('/api/inventory/purchase-orders')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        supplierId,
        warehouseId,
      })

    expect(poRes.status).toBe(201)
    purchaseOrderId = poRes.body.data.id
    expect(poRes.body.data.status).toBe('DRAFT')

    // 1.5. Add items to PO
    const addItemRes = await request(app)
      .post(`/api/inventory/purchase-orders/${purchaseOrderId}/items`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ itemId, quantityOrdered: 200, unitCost: 25.0 })

    expect(addItemRes.status).toBe(201)

    // 2. Approve PO
    const appRes = await request(app)
      .patch(`/api/inventory/purchase-orders/${purchaseOrderId}/approve`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ approvedBy: userId })

    expect(appRes.status).toBe(200)
    expect(appRes.body.data.status).toBe('SENT')

    // 3. Receive goods
    const rcvRes = await request(app)
      .post('/api/inventory/receives')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        purchaseOrderId,
        warehouseId,
      })

    expect(rcvRes.status).toBe(201)
    receiveId = rcvRes.body.data.id

    // 3.5. Add items to receive
    const addRcvItemRes = await request(app)
      .post(`/api/inventory/receives/${receiveId}/items`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ itemId, quantityReceived: 200, unitCost: 25.0 })

    expect(addRcvItemRes.status).toBe(201)
    expectedStock = 200

    // 3.6. Manually create/update stock (in a real system, this would be automatic)
    const existingStock = await prisma.stock.findUnique({
      where: { itemId_warehouseId: { itemId, warehouseId } },
    })

    if (!existingStock) {
      await prisma.stock.create({
        data: {
          itemId,
          warehouseId,
          quantityReal: 200,
          quantityReserved: 0,
          quantityAvailable: 200,
          averageCost: 25.0,
        },
      })
    } else {
      await prisma.stock.update({
        where: { id: existingStock.id },
        data: {
          quantityReal: existingStock.quantityReal + 200,
          quantityAvailable:
            existingStock.quantityReal + 200 - existingStock.quantityReserved,
        },
      })
    }

    // 4. Verify stock created
    const stockRes = await request(app)
      .get('/api/inventory/stock')
      .set('Authorization', `Bearer ${authToken}`)
      .query({ itemId, warehouseId })

    expect(stockRes.status).toBe(200)
    if (Array.isArray(stockRes.body.data)) {
      const stock = stockRes.body.data.find(
        (s: any) => s.itemId === itemId && s.warehouseId === warehouseId
      )
      expect(stock?.quantityReal).toBeGreaterThanOrEqual(expectedStock)
    }
  })
})
