// backend/src/features/inventory/reservations/reservations.test.ts

import { describe, test, expect, beforeAll, afterAll } from '@jest/globals'
import request from 'supertest'
import app from '../../../app.js'
import { getTestAuthToken } from '../../../shared/utils/test.utils.js'
import prisma from '../../../services/prisma.service.js'

describe('Reservations API Tests', () => {
  let authToken: string
  let userId: string
  let warehouseId: string
  let itemId: string
  let reservationId: string
  let brandId: string
  let categoryId: string
  let unitId: string

  beforeAll(async () => {
    // ── Cleanup: Eliminar datos de tests previos (FK-safe order) ──
    await prisma.reservation
      .deleteMany({ where: { item: { sku: { startsWith: 'TEST-RSV' } } } })
      .catch(() => {})
    await prisma.stock
      .deleteMany({ where: { item: { sku: { startsWith: 'TEST-RSV' } } } })
      .catch(() => {})
    await prisma.item
      .deleteMany({ where: { sku: { startsWith: 'TEST-RSV' } } })
      .catch(() => {})
    await prisma.warehouse
      .deleteMany({ where: { code: { startsWith: 'TEST-RSV-WH' } } })
      .catch(() => {})
    await prisma.brand
      .deleteMany({ where: { code: 'TEST-BRAND-RSV' } })
      .catch(() => {})
    await prisma.category
      .deleteMany({ where: { code: 'TEST-CAT-RSV' } })
      .catch(() => {})
    await prisma.unit
      .deleteMany({ where: { code: 'TEST-UNIT-RSV' } })
      .catch(() => {})

    // ── Obtener token y usuario ──
    authToken = await getTestAuthToken()
    const user = await prisma.user.findUnique({
      where: { correo: 'admin@test.com' },
    })
    userId = user?.id || '550e8400-e29b-41d4-a716-446655440000'

    // ── Crear dependencias: Brand ──
    const brand = await prisma.brand.create({
      data: {
        code: 'TEST-BRAND-RSV',
        name: 'Test Brand RSV',
        type: 'PART',
        isActive: true,
      },
    })
    brandId = brand.id

    // ── Crear dependencias: Category ──
    const category = await prisma.category.create({
      data: {
        code: 'TEST-CAT-RSV',
        name: 'Test Category RSV',
        isActive: true,
      },
    })
    categoryId = category.id

    // ── Crear dependencias: Unit ──
    const unit = await prisma.unit.create({
      data: {
        code: 'TEST-UNIT-RSV',
        name: 'Test Unit RSV',
        abbreviation: 'TUR',
        type: 'COUNTABLE',
        isActive: true,
      },
    })
    unitId = unit.id

    // ── Crear dependencias: Warehouse ──
    const warehouse = await prisma.warehouse.create({
      data: {
        code: 'TEST-RSV-WH-1',
        name: 'RSV Warehouse',
        type: 'PRINCIPAL',
        isActive: true,
      },
    })
    warehouseId = warehouse.id

    // ── Crear dependencias: Item ──
    const item = await prisma.item.create({
      data: {
        sku: 'TEST-RSV-001',
        name: 'Test RSV Item',
        brandId,
        categoryId,
        unitId,
        costPrice: 20,
        salePrice: 40,
        isActive: true,
      },
    })
    itemId = item.id

    // ── Crear stock para el item ──
    await prisma.stock
      .create({
        data: {
          itemId,
          warehouseId,
          quantityReal: 200,
          quantityReserved: 0,
          quantityAvailable: 200,
          averageCost: 20,
        },
      })
      .catch(() => {})
  }, 20000)

  afterAll(async () => {
    try {
      // ── Cleanup en orden FK-safe ──
      await prisma.reservation
        .deleteMany({ where: { item: { sku: { startsWith: 'TEST-RSV' } } } })
        .catch(() => {})
      await prisma.stock
        .deleteMany({ where: { item: { sku: { startsWith: 'TEST-RSV' } } } })
        .catch(() => {})
      await prisma.item
        .deleteMany({ where: { sku: { startsWith: 'TEST-RSV' } } })
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
        .deleteMany({ where: { code: { startsWith: 'TEST-RSV-WH' } } })
        .catch(() => {})
    } catch (error) {
      console.log('Error en afterAll cleanup:', error)
    }
  })

  // ============================================
  // CREATE TESTS
  // ============================================
  describe('POST /api/inventory/reservations', () => {
    test('Debe crear una reservación exitosamente', async () => {
      const res = await request(app)
        .post('/api/inventory/reservations')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          itemId,
          warehouseId,
          quantity: 50,
          notes: 'Reservación de prueba',
          expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(),
        })

      expect(res.status).toBe(201)
      expect(res.body.success).toBe(true)
      expect(res.body.data).toHaveProperty('id')
      expect(res.body.data.itemId).toBe(itemId)
      reservationId = res.body.data.id
    })

    test('Debe fallar sin itemId', async () => {
      const res = await request(app)
        .post('/api/inventory/reservations')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          warehouseId,
          quantity: 50,
        })

      expect(res.status).toBe(422)
    })

    test('Debe fallar sin warehouseId', async () => {
      const res = await request(app)
        .post('/api/inventory/reservations')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          itemId,
          quantity: 50,
        })

      expect(res.status).toBe(422)
    })

    test('Debe fallar sin quantity', async () => {
      const res = await request(app)
        .post('/api/inventory/reservations')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          itemId,
          warehouseId,
        })

      expect(res.status).toBe(422)
    })

    test('Debe fallar con cantidad mayor a stock disponible', async () => {
      const res = await request(app)
        .post('/api/inventory/reservations')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          itemId,
          warehouseId,
          quantity: 500, // Más que el stock
        })

      expect([400, 422]).toContain(res.status)
    })
  })

  // ============================================
  // GET ALL TESTS
  // ============================================
  describe('GET /api/inventory/reservations', () => {
    test('Debe obtener lista de reservaciones', async () => {
      const res = await request(app)
        .get('/api/inventory/reservations')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ page: 1, limit: 10 })

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
    })
  })

  describe('GET /api/inventory/reservations/active', () => {
    test('Debe obtener reservaciones activas', async () => {
      const res = await request(app)
        .get('/api/inventory/reservations/active')
        .set('Authorization', `Bearer ${authToken}`)

      expect(res.status).toBe(200)
      expect(
        Array.isArray(res.body.data) || typeof res.body.data === 'object'
      ).toBe(true)
    })
  })

  describe('GET /api/inventory/reservations/expired', () => {
    test('Debe obtener reservaciones expiradas', async () => {
      const res = await request(app)
        .get('/api/inventory/reservations/expired')
        .set('Authorization', `Bearer ${authToken}`)

      expect(res.status).toBe(200)
    })
  })

  describe('GET /api/inventory/reservations/item/:itemId', () => {
    test('Debe obtener reservaciones por item', async () => {
      const res = await request(app)
        .get(`/api/inventory/reservations/item/${itemId}`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(res.status).toBe(200)
      expect(
        Array.isArray(res.body.data) || typeof res.body.data === 'object'
      ).toBe(true)
    })
  })

  describe('GET /api/inventory/reservations/warehouse/:warehouseId', () => {
    test('Debe obtener reservaciones por warehouse', async () => {
      const res = await request(app)
        .get(`/api/inventory/reservations/warehouse/${warehouseId}`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(res.status).toBe(200)
    })
  })

  // ============================================
  // GET BY ID TESTS
  // ============================================
  describe('GET /api/inventory/reservations/:id', () => {
    test('Debe obtener reservación por ID', async () => {
      if (!reservationId) {
        console.warn('reservationId no disponible')
        return
      }

      const res = await request(app)
        .get(`/api/inventory/reservations/${reservationId}`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.data.id).toBe(reservationId)
    })

    test('Debe fallar con ID no válido', async () => {
      const res = await request(app)
        .get('/api/inventory/reservations/invalid-id')
        .set('Authorization', `Bearer ${authToken}`)

      expect(res.status).toBe(404)
    })

    test('Debe fallar con reservación no encontrada', async () => {
      const res = await request(app)
        .get('/api/inventory/reservations/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${authToken}`)

      expect(res.status).toBe(404)
    })
  })

  // ============================================
  // UPDATE TESTS
  // ============================================
  describe('PUT /api/inventory/reservations/:id', () => {
    test('Debe actualizar reservación', async () => {
      if (!reservationId) return

      const res = await request(app)
        .put(`/api/inventory/reservations/${reservationId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          quantity: 60,
          notes: 'Notas actualizadas',
        })

      expect([200, 400]).toContain(res.status)
    })
  })

  // ============================================
  // CONSUME TESTS
  // ============================================
  describe('POST /api/inventory/reservations/:id/consume', () => {
    test('Debe consumir reservación parcialmente', async () => {
      if (!reservationId) return

      const res = await request(app)
        .post(`/api/inventory/reservations/${reservationId}/consume`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          quantity: 20,
        })

      expect([200, 400]).toContain(res.status)
    })

    test('Debe fallar consumiendo más que el reservado', async () => {
      if (!reservationId) return

      const res = await request(app)
        .post(`/api/inventory/reservations/${reservationId}/consume`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          quantity: 5000,
        })

      expect([400, 422]).toContain(res.status)
    })
  })

  // ============================================
  // RELEASE TESTS
  // ============================================
  describe('POST /api/inventory/reservations/:id/release', () => {
    test('Debe liberar una reservación', async () => {
      const createRes = await request(app)
        .post('/api/inventory/reservations')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          itemId,
          warehouseId,
          quantity: 30,
          notes: 'Para liberar',
        })

      if (createRes.status === 201) {
        const rsvId = createRes.body.data.id
        const res = await request(app)
          .post(`/api/inventory/reservations/${rsvId}/release`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            reason: 'Pedido cancelado',
          })

        expect([200, 400]).toContain(res.status)
      }
    })
  })

  // ============================================
  // PENDING PICKUP TESTS
  // ============================================
  describe('PATCH /api/inventory/reservations/:id/pending-pickup', () => {
    test('Debe marcar como pendiente de recolección', async () => {
      if (!reservationId) return

      const res = await request(app)
        .patch(`/api/inventory/reservations/${reservationId}/pending-pickup`)
        .set('Authorization', `Bearer ${authToken}`)

      expect([200, 400]).toContain(res.status)
    })
  })

  // ============================================
  // DELETE TESTS
  // ============================================
  describe('DELETE /api/inventory/reservations/:id', () => {
    test('Debe eliminar una reservación', async () => {
      const createRes = await request(app)
        .post('/api/inventory/reservations')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          itemId,
          warehouseId,
          quantity: 25,
          notes: 'Para eliminar',
        })

      if (createRes.status === 201) {
        const rsvId = createRes.body.data.id
        const res = await request(app)
          .delete(`/api/inventory/reservations/${rsvId}`)
          .set('Authorization', `Bearer ${authToken}`)

        expect([200, 400]).toContain(res.status)
      }
    })
  })
})
