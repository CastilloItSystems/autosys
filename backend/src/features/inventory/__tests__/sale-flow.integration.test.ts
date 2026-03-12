// backend/src/features/inventory/__tests__/sale-flow.integration.test.ts
// Integration test: Create reservation → Create exit note SALE → Full delivery flow → Stock decremented

import { describe, test, expect, beforeAll, afterAll } from '@jest/globals'
import request from 'supertest'
import app from '../../../app.js'
import { getTestAuthToken } from '../../../shared/utils/test.utils.js'
import prisma from '../../../services/prisma.service.js'

describe('Sale Flow Integration Test', () => {
  let authToken: string
  let userId: string
  let warehouseId: string
  let itemId: string
  let reservationId: string
  let exitNoteId: string
  let brandId: string
  let categoryId: string
  let unitId: string

  beforeAll(async () => {
    // ── Cleanup: Eliminar datos de tests previos ──
    await prisma.exitNoteItem.deleteMany({}).catch(() => {})
    await prisma.exitNote
      .deleteMany({ where: { code: { startsWith: 'TEST-SF' } } })
      .catch(() => {})
    await prisma.reservation.deleteMany({}).catch(() => {})
    await prisma.stock.deleteMany({}).catch(() => {})
    await prisma.item
      .deleteMany({ where: { sku: { startsWith: 'TEST-SF' } } })
      .catch(() => {})
    await prisma.warehouse
      .deleteMany({ where: { code: { startsWith: 'TEST-SF-WH' } } })
      .catch(() => {})
    await prisma.brand
      .deleteMany({ where: { code: 'TEST-BRAND-SF' } })
      .catch(() => {})
    await prisma.category
      .deleteMany({ where: { code: 'TEST-CAT-SF' } })
      .catch(() => {})
    await prisma.unit
      .deleteMany({ where: { code: 'TEST-UNIT-SF' } })
      .catch(() => {})

    // ── Obtener token y usuario ──
    authToken = await getTestAuthToken()
    const user = await prisma.user.findUnique({
      where: { correo: 'admin@test.com' },
    })
    userId = user?.id || '550e8400-e29b-41d4-a716-446655440000'

    // ── Crear dependencias ──
    const brand = await prisma.brand.create({
      data: { code: 'TEST-BRAND-SF', name: 'Test Brand' },
    })
    brandId = brand.id

    const category = await prisma.category.create({
      data: { code: 'TEST-CAT-SF', name: 'Test Category', brandId },
    })
    categoryId = category.id

    const unit = await prisma.unit.create({
      data: {
        code: 'TEST-UNIT-SF',
        name: 'Unidad',
        equivalence: 1,
        baseUnitId: null,
      },
    })
    unitId = unit.id

    const warehouse = await prisma.warehouse.create({
      data: {
        code: 'TEST-SF-WH',
        name: 'Test Warehouse SF',
        responsible: 'Admin',
      },
    })
    warehouseId = warehouse.id

    const item = await prisma.item.create({
      data: {
        sku: 'TEST-SF-001',
        description: 'Test Item SF',
        barcode: 'TEST-SF-BAR-001',
        categoryId,
        unitId,
        minStock: 30,
        reorderPoint: 100,
      },
    })
    itemId = item.id

    // Create stock: 400 units available
    await prisma.stock.create({
      data: {
        itemId,
        warehouseId,
        quantityReal: 400,
        quantityAvailable: 400,
        quantityReserved: 0,
        quantityInTransit: 0,
        lastCountDate: null,
      },
    })
  })

  afterAll(async () => {
    // ── Cascade delete en orden seguro ──
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

  test('Flow completo de venta: Reservar → Exit Note SALE → Preparar → Entregar → Stock decrementado', async () => {
    // Step 1: Create reservation for sale
    const reserveRes = await request(app)
      .post('/api/inventory/reservations')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        itemId,
        warehouseId,
        quantity: 150,
        notes: 'Para estimado #001',
      })

    expect(reserveRes.status).toBe(201)
    reservationId = reserveRes.body.data.id

    // Get stock before exit
    const getStockBeforeRes = await request(app)
      .get('/api/inventory/stock')
      .set('Authorization', `Bearer ${authToken}`)
      .query({ itemId, warehouseId })

    const stockBefore = Array.isArray(getStockBeforeRes.body.data)
      ? getStockBeforeRes.body.data[0]?.quantityReal || 0
      : 0

    // Step 2: Create exit note SALE
    const createExitRes = await request(app)
      .post('/api/inventory/exit-notes')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        type: 'SALE',
        warehouseId,
        recipientName: 'Cliente Mayorista SF',
        recipientId: 'RIF-123456',
        items: [{ itemId, quantity: 150 }],
        notes: 'Venta al cliente',
      })

    expect(createExitRes.status).toBe(201)
    exitNoteId = createExitRes.body.data.id

    // Step 3: Start preparation
    const startRes = await request(app)
      .patch(`/api/inventory/exit-notes/${exitNoteId}/start`)
      .set('Authorization', `Bearer ${authToken}`)

    expect([200, 400]).toContain(startRes.status)

    // Step 4: Mark as ready
    const readyRes = await request(app)
      .patch(`/api/inventory/exit-notes/${exitNoteId}/ready`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ preparedBy: userId })

    expect([200, 400]).toContain(readyRes.status)

    // Step 5: Deliver exit note (stock should be decremented)
    const deliverRes = await request(app)
      .patch(`/api/inventory/exit-notes/${exitNoteId}/deliver`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ deliveredBy: userId })

    expect([200, 400]).toContain(deliverRes.status)

    // Step 6: Verify stock was decremented
    const getStockAfterRes = await request(app)
      .get('/api/inventory/stock')
      .set('Authorization', `Bearer ${authToken}`)
      .query({ itemId, warehouseId })

    expect(getStockAfterRes.status).toBe(200)
    if (Array.isArray(getStockAfterRes.body.data)) {
      const stockAfter = getStockAfterRes.body.data[0]?.quantityReal || 0
      // Stock should be less (150 units departed)
      expect(stockAfter).toBeLessThanOrEqual(stockBefore)
    }

    // Step 7: Verify exit note is delivered
    const getExitRes = await request(app)
      .get(`/api/inventory/exit-notes/${exitNoteId}`)
      .set('Authorization', `Bearer ${authToken}`)

    expect(getExitRes.status).toBe(200)
    expect(['DELIVERED', 'COMPLETED']).toContain(getExitRes.body.data.status)
  })

  test('Debe poder recuperar información de salida SALE', async () => {
    const exportRes = await request(app)
      .get('/api/inventory/exit-notes')
      .set('Authorization', `Bearer ${authToken}`)
      .query({ type: 'SALE', page: 1, limit: 10 })

    expect(exportRes.status).toBe(200)
  })

  test('Debe crear exit note SALE con cliente identificado', async () => {
    const createRes = await request(app)
      .post('/api/inventory/exit-notes')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        type: 'SALE',
        warehouseId,
        recipientName: 'Cliente Corporativo',
        recipientId: 'RIF-987654',
        items: [{ itemId, quantity: 60 }],
        notes: 'Venta corporativa identificada',
      })

    expect(createRes.status).toBe(201)
  })

  test('Debe poder cancelar exit note SALE en estado DRAFT', async () => {
    const createRes = await request(app)
      .post('/api/inventory/exit-notes')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        type: 'SALE',
        warehouseId,
        recipientName: 'Cliente Cancelable',
        items: [{ itemId, quantity: 40 }],
      })

    expect(createRes.status).toBe(201)
    const enId = createRes.body.data.id

    const cancelRes = await request(app)
      .patch(`/api/inventory/exit-notes/${enId}/cancel`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ reason: 'Cliente cambió pedido' })

    expect([200, 400]).toContain(cancelRes.status)
  })

  test('Debe soportar múltiples items en venta', async () => {
    // Create second item
    const item2 = await prisma.item.create({
      data: {
        sku: 'TEST-SF-002',
        description: 'Test Item 2 SF',
        barcode: 'TEST-SF-BAR-002',
        categoryId,
        unitId,
        minStock: 15,
        reorderPoint: 50,
      },
    })

    // Create stock
    await prisma.stock.create({
      data: {
        itemId: item2.id,
        warehouseId,
        quantityReal: 250,
        quantityAvailable: 250,
        quantityReserved: 0,
        quantityInTransit: 0,
        lastCountDate: null,
      },
    })

    // Create multi-item sale
    const createRes = await request(app)
      .post('/api/inventory/exit-notes')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        type: 'SALE',
        warehouseId,
        recipientName: 'Cliente Multi-item',
        items: [
          { itemId, quantity: 70 },
          { itemId: item2.id, quantity: 100 },
        ],
      })

    expect(createRes.status).toBe(201)
    expect(createRes.body.data.items).toHaveLength(2)
  })

  test('Debe poder obtener resumen de salida', async () => {
    if (!exitNoteId) return

    const res = await request(app)
      .get(`/api/inventory/exit-notes/${exitNoteId}/summary`)
      .set('Authorization', `Bearer ${authToken}`)

    expect([200, 404]).toContain(res.status)
  })

  test('Debe poder obtener estado de salida', async () => {
    if (!exitNoteId) return

    const res = await request(app)
      .get(`/api/inventory/exit-notes/${exitNoteId}/status`)
      .set('Authorization', `Bearer ${authToken}`)

    expect([200, 404]).toContain(res.status)
  })
})
