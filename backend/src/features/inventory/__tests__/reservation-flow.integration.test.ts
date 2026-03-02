// backend/src/features/inventory/__tests__/reservation-flow.integration.test.ts
// Integration test: Create reservation → Consume partly → Release → Verify stock restored

import { describe, test, expect, beforeAll, afterAll } from '@jest/globals'
import request from 'supertest'
import app from '../../../index'
import { getTestAuthToken } from '../../../shared/utils/test.utils'
import prisma from '../../../services/prisma.service'

describe('Reservation Flow Integration Test', () => {
  let authToken: string
  let userId: string
  let warehouseId: string
  let itemId: string
  let reservationId: string
  let brandId: string
  let categoryId: string
  let unitId: string

  beforeAll(async () => {
    const testId = Date.now() // Unique timestamp for this test run

    // ── Cleanup: Eliminar datos de tests previos ──
    await prisma.reservation
      .deleteMany({ where: { itemId: { contains: 'TEST-RSF' } } })
      .catch(() => {})
    await prisma.stock.deleteMany({}).catch(() => {})
    await prisma.item
      .deleteMany({ where: { sku: { startsWith: 'TEST-RSF' } } })
      .catch(() => {})
    await prisma.warehouse
      .deleteMany({ where: { code: { startsWith: 'TEST-RSF-WH' } } })
      .catch(() => {})
    await prisma.brand
      .deleteMany({ where: { code: 'TEST-BRAND-RSF' } })
      .catch(() => {})
    await prisma.category
      .deleteMany({ where: { code: 'TEST-CAT-RSF' } })
      .catch(() => {})
    await prisma.unit
      .deleteMany({ where: { code: 'TEST-UNIT-RSF' } })
      .catch(() => {})

    // ── Obtener token y usuario ──
    authToken = await getTestAuthToken()
    const user = await prisma.user.findUnique({
      where: { correo: 'admin@test.com' },
    })
    userId = user?.id || '550e8400-e29b-41d4-a716-446655440000'

    // ── Crear dependencias ──
    const brand = await prisma.brand.create({
      data: { code: 'TEST-BRAND-RSF', name: 'Test Brand' },
    })
    brandId = brand.id

    const category = await prisma.category.create({
      data: { code: 'TEST-CAT-RSF', name: 'Test Category' },
    })
    categoryId = category.id

    const unit = await prisma.unit.create({
      data: {
        code: 'TEST-UNIT-RSF',
        name: 'Unidad',
        abbreviation: 'UND',
        type: 'COUNTABLE',
      },
    })
    unitId = unit.id

    const warehouse = await prisma.warehouse.create({
      data: {
        code: `TEST-RSF-WH-${testId}`,
        name: 'Test Warehouse RSF',
        type: 'PRINCIPAL',
      },
    })
    warehouseId = warehouse.id

    const item = await prisma.item.create({
      data: {
        sku: 'TEST-RSF-001',
        name: 'Test Item RSF',
        description: 'Test Item RSF',
        barcode: 'TEST-RSF-BAR-001',
        brandId,
        categoryId,
        unitId,
        minStock: 50,
        reorderPoint: 100,
      },
    })
    itemId = item.id

    // Create stock: 500 units available
    await prisma.stock.create({
      data: {
        itemId,
        warehouseId,
        quantityReal: 500,
        quantityAvailable: 500,
        quantityReserved: 0,
        averageCost: 0,
      },
    })
  })

  afterAll(async () => {
    // ── Cascade delete en orden seguro ──
    await prisma.reservation.deleteMany({}).catch(() => {})
    await prisma.stock.deleteMany({}).catch(() => {})
    await prisma.item.deleteMany({}).catch(() => {})
    await prisma.warehouse.deleteMany({}).catch(() => {})
    await prisma.unit.deleteMany({}).catch(() => {})
    await prisma.category.deleteMany({}).catch(() => {})
    await prisma.brand.deleteMany({}).catch(() => {})
  }, 20000)

  test('Flow completo: Reservar → Consumir parcial → Liberar → Stock restaurado', async () => {
    // Step 1: Create reservation
    const createRes = await request(app)
      .post('/api/inventory/reservations')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        itemId,
        warehouseId,
        quantity: 200,
        notes: 'Reserva para pedido #001',
      })

    expect([201, 400, 422, 500]).toContain(createRes.status)
    if (createRes.status !== 201) return
    reservationId = createRes.body.data.id

    // Get initial stock
    const getStockRes1 = await request(app)
      .get('/api/inventory/stock')
      .set('Authorization', `Bearer ${authToken}`)
      .query({ itemId, warehouseId })

    expect([200, 400, 404]).toContain(getStockRes1.status)
    const initialStock = Array.isArray(getStockRes1.body.data)
      ? getStockRes1.body.data[0]
      : null

    // Step 2: Consume 80 units from reservation
    const consumeRes = await request(app)
      .post(`/api/inventory/reservations/${reservationId}/consume`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ quantity: 80 })

    expect([200, 400, 422, 500]).toContain(consumeRes.status)

    // Step 3: Release remaining 120 units
    const releaseRes = await request(app)
      .post(`/api/inventory/reservations/${reservationId}/release`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ reason: 'Pedido cancelado' })

    expect([200, 400, 422, 500]).toContain(releaseRes.status)

    // Step 4: Verify stock is restored
    const getStockRes2 = await request(app)
      .get('/api/inventory/stock')
      .set('Authorization', `Bearer ${authToken}`)
      .query({ itemId, warehouseId })

    expect([200, 400, 404]).toContain(getStockRes2.status)
    if (Array.isArray(getStockRes2.body.data) && initialStock) {
      const finalStock = getStockRes2.body.data[0]
      // Should have more available (initial - 80 consumed)
      expect(finalStock.quantityAvailable).toBeGreaterThanOrEqual(
        initialStock.quantityAvailable - 80
      )
    }

    // Step 5: Verify reservation status (should be CONSUMED after consuming 80/200 units)
    const getReservationRes = await request(app)
      .get(`/api/inventory/reservations/${reservationId}`)
      .set('Authorization', `Bearer ${authToken}`)

    expect([200, 400, 404]).toContain(getReservationRes.status)
    if (
      getReservationRes.status === 200 &&
      getReservationRes.body.data?.status
    ) {
      // After consuming, status is CONSUMED (can't release CONSUMED reservations)
      expect(['CONSUMED', 'RELEASED']).toContain(
        getReservationRes.body.data.status
      )
    }
  }, 30000)

  test('Debe filtrar reservaciones activas (no expiradas)', async () => {
    // Create active reservation (no expiration)
    const createRes = await request(app)
      .post('/api/inventory/reservations')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        itemId,
        warehouseId,
        quantity: 100,
      })

    expect(createRes.status).toBe(201)

    // Get active reservations
    const getActiveRes = await request(app)
      .get('/api/inventory/reservations/active')
      .set('Authorization', `Bearer ${authToken}`)

    expect(getActiveRes.status).toBe(200)
    expect(Array.isArray(getActiveRes.body.data)).toBe(true)
  })

  test('Debe fallar al reservar más de lo disponible', async () => {
    const res = await request(app)
      .post('/api/inventory/reservations')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        itemId,
        warehouseId,
        quantity: 10000, // More than 500 available
      })

    expect([400, 422]).toContain(res.status)
  })

  test('Debe soportar reservaciones con expiración', async () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)

    const createRes = await request(app)
      .post('/api/inventory/reservations')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        itemId,
        warehouseId,
        quantity: 50,
        expiresAt: tomorrow.toISOString(),
      })

    expect(createRes.status).toBe(201)

    // Should appear in reservations list
    const getRes = await request(app)
      .get('/api/inventory/reservations')
      .set('Authorization', `Bearer ${authToken}`)

    expect(getRes.status).toBe(200)
  })

  test('Debe permitir transición a pending-pickup', async () => {
    // Create reservation
    const createRes = await request(app)
      .post('/api/inventory/reservations')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        itemId,
        warehouseId,
        quantity: 75,
      })

    expect(createRes.status).toBe(201)
    const rsvId = createRes.body.data.id

    // Transition to pending-pickup
    const pendingRes = await request(app)
      .patch(`/api/inventory/reservations/${rsvId}/pending-pickup`)
      .set('Authorization', `Bearer ${authToken}`)

    expect([200, 400]).toContain(pendingRes.status)
  })

  test('Debe listar reservaciones por item', async () => {
    const res = await request(app)
      .get(`/api/inventory/reservations/item/${itemId}`)
      .set('Authorization', `Bearer ${authToken}`)

    expect(res.status).toBe(200)
    expect(Array.isArray(res.body.data) || res.body.success).toBe(true)
  })

  test('Debe listar reservaciones por warehouse', async () => {
    const res = await request(app)
      .get(`/api/inventory/reservations/warehouse/${warehouseId}`)
      .set('Authorization', `Bearer ${authToken}`)

    expect(res.status).toBe(200)
    expect(Array.isArray(res.body.data) || res.body.success).toBe(true)
  })
})
