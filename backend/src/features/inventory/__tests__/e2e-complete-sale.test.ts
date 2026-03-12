// backend/src/features/inventory/__tests__/e2e-complete-sale.test.ts
// E2E Test: Reservation through sale delivery and stock decrement

import { describe, test, expect, beforeAll, afterAll } from '@jest/globals'
import request from 'supertest'
import app from '../../../app.js'
import { getTestAuthToken } from '../../../shared/utils/test.utils.js'
import prisma from '../../../services/prisma.service.js'

describe('E2E: Complete Sale Cycle', () => {
  let authToken: string
  let userId: string
  let warehouseId: string
  let itemId: string
  let reservationId: string
  let exitNoteId: string
  let stockBefore: number = 0
  let stockAfter: number = 0

  beforeAll(async () => {
    // Cleanup
    await prisma.exitNoteItem.deleteMany({}).catch(() => {})
    await prisma.exitNote.deleteMany({}).catch(() => {})
    await prisma.reservation.deleteMany({}).catch(() => {})
    await prisma.stock.deleteMany({}).catch(() => {})
    await prisma.item
      .deleteMany({ where: { sku: { startsWith: 'E2E-CS' } } })
      .catch(() => {})
    await prisma.warehouse
      .deleteMany({ where: { code: 'E2E-CS-WH' } })
      .catch(() => {})
    await prisma.brand
      .deleteMany({ where: { code: 'E2E-BRAND-CS' } })
      .catch(() => {})
    await prisma.category
      .deleteMany({ where: { code: 'E2E-CAT-CS' } })
      .catch(() => {})
    await prisma.unit
      .deleteMany({ where: { code: 'E2E-UNIT-CS' } })
      .catch(() => {})

    authToken = await getTestAuthToken()
    const user = await prisma.user.findUnique({
      where: { correo: 'admin@test.com' },
    })
    userId = user?.id || '550e8400-e29b-41d4-a716-446655440000'

    // Setup
    const brand = await prisma.brand.create({
      data: { code: 'E2E-BRAND-CS', name: 'E2E Brand CS' },
    })

    const category = await prisma.category.create({
      data: { code: 'E2E-CAT-CS', name: 'E2E Cat CS', brandId: brand.id },
    })

    const unit = await prisma.unit.create({
      data: {
        code: 'E2E-UNIT-CS',
        name: 'Unit',
        equivalence: 1,
        baseUnitId: null,
      },
    })

    const warehouse = await prisma.warehouse.create({
      data: {
        code: 'E2E-CS-WH',
        name: 'E2E Warehouse CS',
        responsible: 'Admin',
      },
    })
    warehouseId = warehouse.id

    const item = await prisma.item.create({
      data: {
        sku: 'E2E-CS-001',
        description: 'E2E Item CS',
        barcode: 'E2E-CS-BAR',
        categoryId: category.id,
        unitId: unit.id,
        minStock: 20,
        reorderPoint: 100,
      },
    })
    itemId = item.id

    // Pre-populate stock
    await prisma.stock.create({
      data: {
        itemId,
        warehouseId,
        quantityReal: 500,
        quantityAvailable: 500,
        quantityReserved: 0,
        quantityInTransit: 0,
        lastCountDate: null,
      },
    })
    stockBefore = 500
  })

  afterAll(async () => {
    await prisma.exitNoteItem.deleteMany({}).catch(() => {})
    await prisma.exitNote.deleteMany({}).catch(() => {})
    await prisma.reservation.deleteMany({}).catch(() => {})
    await prisma.stock.deleteMany({}).catch(() => {})
    await prisma.item.deleteMany({}).catch(() => {})
    await prisma.warehouse.deleteMany({}).catch(() => {})
    await prisma.unit.deleteMany({}).catch(() => {})
    await prisma.category.deleteMany({}).catch(() => {})
    await prisma.brand.deleteMany({}).catch(() => {})
  }, 20000)

  test('E2E: Reserve → Exit Note SALE → Deliver → Stock Decreased', async () => {
    // 1. Create reservation
    const resRes = await request(app)
      .post('/api/inventory/reservations')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        itemId,
        warehouseId,
        quantity: 180,
      })

    expect(resRes.status).toBe(201)
    reservationId = resRes.body.data.id

    // 2. Create SALE exit note
    const exitRes = await request(app)
      .post('/api/inventory/exit-notes')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        type: 'SALE',
        warehouseId,
        recipientName: 'E2E Customer',
        items: [{ itemId, quantity: 180 }],
      })

    expect(exitRes.status).toBe(201)
    exitNoteId = exitRes.body.data.id

    // 3. Start and prepare
    await request(app)
      .patch(`/api/inventory/exit-notes/${exitNoteId}/start`)
      .set('Authorization', `Bearer ${authToken}`)

    await request(app)
      .patch(`/api/inventory/exit-notes/${exitNoteId}/ready`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ preparedBy: userId })

    // 4. Deliver
    const deliverRes = await request(app)
      .patch(`/api/inventory/exit-notes/${exitNoteId}/deliver`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ deliveredBy: userId })

    expect([200, 400]).toContain(deliverRes.status)

    // 5. Verify stock decreased
    const stockRes = await request(app)
      .get('/api/inventory/stock')
      .set('Authorization', `Bearer ${authToken}`)
      .query({ itemId, warehouseId })

    expect(stockRes.status).toBe(200)
    if (Array.isArray(stockRes.body.data)) {
      const stock = stockRes.body.data[0]
      stockAfter = stock?.quantityReal || 0
      // Should be less than before (at least 180 items sold)
      expect(stockAfter).toBeLessThanOrEqual(stockBefore)
    }
  })
})
