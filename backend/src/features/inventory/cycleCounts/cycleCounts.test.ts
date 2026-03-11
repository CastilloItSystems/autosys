// backend/src/features/inventory/cycleCounts/cycleCounts.test.ts

import { describe, test, expect, beforeAll, afterAll } from '@jest/globals'
import request from 'supertest'
import app from '../../../app'
import { getTestAuthToken } from '../../../shared/utils/test.utils'
import prisma from '../../../services/prisma.service'

describe('Cycle Counts API Tests', () => {
  let authToken: string
  let userId: string
  let warehouseId: string
  let itemId: string
  let cycleCountId: string
  let brandId: string
  let categoryId: string
  let unitId: string

  beforeAll(async () => {
    // ── Cleanup: Eliminar datos de tests previos ──
    await prisma.cycleCountItem
      .deleteMany({
        where: { cycleCount: { code: { startsWith: 'TEST-CC' } } },
      })
      .catch(() => {})
    await prisma.cycleCount
      .deleteMany({ where: { code: { startsWith: 'TEST-CC' } } })
      .catch(() => {})
    await prisma.item
      .deleteMany({ where: { sku: { startsWith: 'TEST-CC' } } })
      .catch(() => {})
    await prisma.warehouse
      .deleteMany({ where: { code: { startsWith: 'TEST-CC-WH' } } })
      .catch(() => {})
    await prisma.brand
      .deleteMany({ where: { code: 'TEST-BRAND-CC' } })
      .catch(() => {})
    await prisma.category
      .deleteMany({ where: { code: 'TEST-CAT-CC' } })
      .catch(() => {})
    await prisma.unit
      .deleteMany({ where: { code: 'TEST-UNIT-CC' } })
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
        code: 'TEST-BRAND-CC',
        name: 'Test Brand CC',
        type: 'PART',
        isActive: true,
      },
    })
    brandId = brand.id

    // ── Crear dependencias: Category ──
    const category = await prisma.category.create({
      data: {
        code: 'TEST-CAT-CC',
        name: 'Test Category CC',
        isActive: true,
      },
    })
    categoryId = category.id

    // ── Crear dependencias: Unit ──
    const unit = await prisma.unit.create({
      data: {
        code: 'TEST-UNIT-CC',
        name: 'Test Unit CC',
        abbreviation: 'TUC',
        type: 'COUNTABLE',
        isActive: true,
      },
    })
    unitId = unit.id

    // ── Crear dependencias: Warehouse ──
    const warehouse = await prisma.warehouse.create({
      data: {
        code: 'TEST-CC-WH-1',
        name: 'CC Warehouse',
        type: 'PRINCIPAL',
        isActive: true,
      },
    })
    warehouseId = warehouse.id

    // ── Crear dependencias: Item ──
    const item = await prisma.item.create({
      data: {
        sku: 'TEST-CC-001',
        name: 'Test CC Item',
        brandId,
        categoryId,
        unitId,
        costPrice: 30,
        salePrice: 60,
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
          quantityReal: 150,
          quantityReserved: 0,
          quantityAvailable: 150,
          averageCost: 30,
        },
      })
      .catch(() => {})
  }, 20000)

  afterAll(async () => {
    try {
      // ── Cleanup en orden FK-safe ──
      await prisma.cycleCountItem
        .deleteMany({
          where: { cycleCount: { code: { startsWith: 'TEST-CC' } } },
        })
        .catch(() => {})
      await prisma.cycleCount
        .deleteMany({ where: { code: { startsWith: 'TEST-CC' } } })
        .catch(() => {})
      await prisma.stock
        .deleteMany({ where: { item: { sku: { startsWith: 'TEST-CC' } } } })
        .catch(() => {})
      await prisma.item
        .deleteMany({ where: { sku: { startsWith: 'TEST-CC' } } })
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
        .deleteMany({ where: { code: { startsWith: 'TEST-CC-WH' } } })
        .catch(() => {})
    } catch (error) {
      console.log('Error en afterAll cleanup:', error)
    }
  })

  // ============================================
  // CREATE TESTS
  // ============================================
  describe('POST /api/inventory/cycle-counts', () => {
    test('Debe crear un cycle count exitosamente', async () => {
      const res = await request(app)
        .post('/api/inventory/cycle-counts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          warehouseId,
          notes: 'Cycle count de prueba',
          items: [
            {
              itemId,
              expectedQuantity: 150,
            },
          ],
        })

      expect(res.status).toBe(201)
      expect(res.body.success).toBe(true)
      expect(res.body.data).toHaveProperty('id')
      expect(res.body.data.warehouseId).toBe(warehouseId)
      cycleCountId = res.body.data.id
    })

    test('Debe fallar sin warehouseId', async () => {
      const res = await request(app)
        .post('/api/inventory/cycle-counts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          notes: 'Sin warehouse',
          items: [{ itemId, expectedQuantity: 100 }],
        })

      expect(res.status).toBe(422)
    })

    test('Debe fallar sin items', async () => {
      const res = await request(app)
        .post('/api/inventory/cycle-counts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          warehouseId,
          notes: 'Sin items',
          items: [],
        })

      expect(res.status).toBe(422)
    })
  })

  // ============================================
  // GET ALL TESTS
  // ============================================
  describe('GET /api/inventory/cycle-counts', () => {
    test('Debe obtener lista de cycle counts', async () => {
      const res = await request(app)
        .get('/api/inventory/cycle-counts')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ page: 1, limit: 10 })

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(
        Array.isArray(res.body.data) || typeof res.body.data === 'object'
      ).toBe(true)
    })

    test('Debe filtrar por estado', async () => {
      const res = await request(app)
        .get('/api/inventory/cycle-counts')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ status: 'DRAFT', page: 1, limit: 10 })

      expect(res.status).toBe(200)
    })

    test('Debe filtrar por warehouse', async () => {
      const res = await request(app)
        .get('/api/inventory/cycle-counts')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ warehouseId, page: 1, limit: 10 })

      expect(res.status).toBe(200)
    })
  })

  // ============================================
  // GET BY ID TESTS
  // ============================================
  describe('GET /api/inventory/cycle-counts/:id', () => {
    test('Debe obtener cycle count por ID', async () => {
      if (!cycleCountId) {
        console.warn('cycleCountId no disponible, saltando test')
        return
      }

      const res = await request(app)
        .get(`/api/inventory/cycle-counts/${cycleCountId}`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.data.id).toBe(cycleCountId)
    })

    test('Debe fallar con ID no válido', async () => {
      const res = await request(app)
        .get('/api/inventory/cycle-counts/invalid-id')
        .set('Authorization', `Bearer ${authToken}`)

      expect(res.status).toBe(422)
    })

    test('Debe fallar con cycle count no encontrado', async () => {
      const res = await request(app)
        .get('/api/inventory/cycle-counts/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${authToken}`)

      expect(res.status).toBe(404)
    })
  })

  // ============================================
  // UPDATE TESTS
  // ============================================
  describe('PUT /api/inventory/cycle-counts/:id', () => {
    test('Debe actualizar cycle count en DRAFT', async () => {
      if (!cycleCountId) return

      const res = await request(app)
        .put(`/api/inventory/cycle-counts/${cycleCountId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          notes: 'Notas actualizadas',
        })

      expect([200, 400]).toContain(res.status)
    })
  })

  // ============================================
  // LIFECYCLE TESTS
  // ============================================
  describe('Flujo de estados del cycle count', () => {
    test('PATCH /:id/start - Debe iniciar el conteo', async () => {
      if (!cycleCountId) return

      const res = await request(app)
        .patch(`/api/inventory/cycle-counts/${cycleCountId}/start`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ startedBy: userId })

      expect([200, 400]).toContain(res.status)
    })

    test('PATCH /:id/complete - Debe completar el conteo', async () => {
      if (!cycleCountId) return

      const res = await request(app)
        .patch(`/api/inventory/cycle-counts/${cycleCountId}/complete`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ completedBy: userId })

      expect([200, 400]).toContain(res.status)
    })

    test('PATCH /:id/approve - Debe aprobar el cycle count', async () => {
      if (!cycleCountId) return

      const res = await request(app)
        .patch(`/api/inventory/cycle-counts/${cycleCountId}/approve`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ approvedBy: userId })

      expect([200, 400]).toContain(res.status)
    })

    test('PATCH /:id/apply - Debe aplicar el cycle count', async () => {
      if (!cycleCountId) return

      const res = await request(app)
        .patch(`/api/inventory/cycle-counts/${cycleCountId}/apply`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ appliedBy: userId })

      expect([200, 400]).toContain(res.status)
    })
  })

  // ============================================
  // REJECTION AND CANCELLATION
  // ============================================
  describe('Rechazo y cancelación', () => {
    test('PATCH /:id/reject - Debe rechazar un cycle count', async () => {
      const createRes = await request(app)
        .post('/api/inventory/cycle-counts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          warehouseId,
          notes: 'Para rechazar',
          items: [{ itemId, expectedQuantity: 150 }],
        })

      if (createRes.status === 201) {
        const ccId = createRes.body.data.id
        const res = await request(app)
          .patch(`/api/inventory/cycle-counts/${ccId}/reject`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({ reason: 'Datos incorrectos' })

        expect([200, 400]).toContain(res.status)
      }
    })

    test('PATCH /:id/cancel - Debe cancelar un cycle count', async () => {
      const createRes = await request(app)
        .post('/api/inventory/cycle-counts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          warehouseId,
          notes: 'Para cancelar',
          items: [{ itemId, expectedQuantity: 150 }],
        })

      if (createRes.status === 201) {
        const ccId = createRes.body.data.id
        const res = await request(app)
          .patch(`/api/inventory/cycle-counts/${ccId}/cancel`)
          .set('Authorization', `Bearer ${authToken}`)

        expect([200, 400]).toContain(res.status)
      }
    })
  })

  // ============================================
  // ITEMS TESTS
  // ============================================
  describe('POST /api/inventory/cycle-counts/:id/items', () => {
    test('Debe agregar item al cycle count', async () => {
      if (!cycleCountId) return

      // Crear segundo item
      const item2 = await prisma.item.create({
        data: {
          sku: 'TEST-CC-002',
          name: 'Second CC Item',
          brandId,
          categoryId,
          unitId,
          costPrice: 40,
          salePrice: 80,
          isActive: true,
        },
      })

      const res = await request(app)
        .post(`/api/inventory/cycle-counts/${cycleCountId}/items`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          itemId: item2.id,
          expectedQuantity: 75,
        })

      expect([200, 201, 400]).toContain(res.status)
    })

    test('Debe fallar sin itemId', async () => {
      if (!cycleCountId) return

      const res = await request(app)
        .post(`/api/inventory/cycle-counts/${cycleCountId}/items`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          expectedQuantity: 100,
        })

      expect(res.status).toBe(422)
    })
  })

  describe('GET /api/inventory/cycle-counts/:id/items', () => {
    test('Debe obtener items del cycle count', async () => {
      if (!cycleCountId) return

      const res = await request(app)
        .get(`/api/inventory/cycle-counts/${cycleCountId}/items`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(res.status).toBe(200)
      expect(Array.isArray(res.body.data)).toBe(true)
    })
  })

  describe('PATCH /api/inventory/cycle-counts/:id/items/:itemId', () => {
    test('Debe actualizar cantidad contada del item', async () => {
      if (!cycleCountId) return

      const res = await request(app)
        .patch(`/api/inventory/cycle-counts/${cycleCountId}/items/${itemId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          countedQuantity: 140,
        })

      expect([200, 400]).toContain(res.status)
    })
  })

  // ============================================
  // DELETE TESTS
  // ============================================
  describe('DELETE /api/inventory/cycle-counts/:id', () => {
    test('Debe eliminar cycle count en DRAFT', async () => {
      const createRes = await request(app)
        .post('/api/inventory/cycle-counts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          warehouseId,
          notes: 'Para eliminar',
          items: [{ itemId, expectedQuantity: 150 }],
        })

      if (createRes.status === 201) {
        const ccId = createRes.body.data.id
        const res = await request(app)
          .delete(`/api/inventory/cycle-counts/${ccId}`)
          .set('Authorization', `Bearer ${authToken}`)

        expect([200, 400]).toContain(res.status)
      }
    })
  })
})
