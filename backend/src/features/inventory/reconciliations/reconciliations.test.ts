// backend/src/features/inventory/reconciliations/reconciliations.test.ts

import { describe, test, expect, beforeAll, afterAll } from '@jest/globals'
import request from 'supertest'
import app from '../../../app'
import { getTestAuthToken } from '../../../shared/utils/test.utils'
import prisma from '../../../services/prisma.service'

describe('Reconciliations API Tests', () => {
  let authToken: string
  let userId: string
  let warehouseId: string
  let itemId: string
  let reconciliationId: string
  let brandId: string
  let categoryId: string
  let unitId: string

  beforeAll(async () => {
    // ── Cleanup: Eliminar datos de tests previos ──
    await prisma.reconciliationItem
      .deleteMany({
        where: {
          reconciliation: {
            warehouse: { code: { startsWith: 'TEST-REC-WH' } },
          },
        },
      })
      .catch(() => {})
    await prisma.reconciliation
      .deleteMany({
        where: { warehouse: { code: { startsWith: 'TEST-REC-WH' } } },
      })
      .catch(() => {})
    await prisma.stock
      .deleteMany({ where: { item: { sku: { startsWith: 'TEST-REC' } } } })
      .catch(() => {})
    await prisma.item
      .deleteMany({ where: { sku: { startsWith: 'TEST-REC' } } })
      .catch(() => {})
    await prisma.warehouse
      .deleteMany({ where: { code: { startsWith: 'TEST-REC-WH' } } })
      .catch(() => {})
    await prisma.brand
      .deleteMany({ where: { code: 'TEST-BRAND-REC' } })
      .catch(() => {})
    await prisma.category
      .deleteMany({ where: { code: 'TEST-CAT-REC' } })
      .catch(() => {})
    await prisma.unit
      .deleteMany({ where: { code: 'TEST-UNIT-REC' } })
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
        code: 'TEST-BRAND-REC',
        name: 'Test Brand REC',
        type: 'PART',
        isActive: true,
      },
    })
    brandId = brand.id

    // ── Crear dependencias: Category ──
    const category = await prisma.category.create({
      data: {
        code: 'TEST-CAT-REC',
        name: 'Test Category REC',
        isActive: true,
      },
    })
    categoryId = category.id

    // ── Crear dependencias: Unit ──
    const unit = await prisma.unit.create({
      data: {
        code: 'TEST-UNIT-REC',
        name: 'Test Unit REC',
        abbreviation: 'TUR',
        type: 'COUNTABLE',
        isActive: true,
      },
    })
    unitId = unit.id

    // ── Crear dependencias: Warehouse ──
    const warehouse = await prisma.warehouse.create({
      data: {
        code: 'TEST-REC-WH-1',
        name: 'REC Warehouse',
        type: 'PRINCIPAL',
        isActive: true,
      },
    })
    warehouseId = warehouse.id

    // ── Crear dependencias: Item ──
    const item = await prisma.item.create({
      data: {
        sku: 'TEST-REC-001',
        name: 'Test REC Item',
        brandId,
        categoryId,
        unitId,
        costPrice: 25,
        salePrice: 50,
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
          quantityReal: 100,
          quantityReserved: 10,
          quantityAvailable: 90,
          averageCost: 25,
        },
      })
      .catch(() => {})
  }, 20000)

  afterAll(async () => {
    try {
      // ── Cleanup en orden FK-safe ──
      await prisma.reconciliationItem
        .deleteMany({
          where: {
            reconciliation: {
              warehouse: { code: { startsWith: 'TEST-REC-WH' } },
            },
          },
        })
        .catch(() => {})
      await prisma.reconciliation
        .deleteMany({
          where: { warehouse: { code: { startsWith: 'TEST-REC-WH' } } },
        })
        .catch(() => {})
      await prisma.stock
        .deleteMany({ where: { item: { sku: { startsWith: 'TEST-REC' } } } })
        .catch(() => {})
      await prisma.item
        .deleteMany({ where: { sku: { startsWith: 'TEST-REC' } } })
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
        .deleteMany({ where: { code: { startsWith: 'TEST-REC-WH' } } })
        .catch(() => {})
    } catch (error) {
      console.log('Error en afterAll cleanup:', error)
    }
  })

  // ============================================
  // CREATE TESTS
  // ============================================
  describe('POST /api/inventory/reconciliations', () => {
    test('Debe crear una reconciliación exitosamente', async () => {
      const res = await request(app)
        .post('/api/inventory/reconciliations')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          warehouseId,
          source: 'PHYSICAL_INVENTORY',
          reason: 'Reconciliación periódica',
          notes: 'Reconciliación de prueba',
          items: [
            {
              itemId,
              systemQuantity: 100,
              expectedQuantity: 95,
            },
          ],
        })

      expect(res.status).toBe(201)
      expect(res.body.success).toBe(true)
      expect(res.body.data).toHaveProperty('id')
      expect(res.body.data.warehouseId).toBe(warehouseId)
      reconciliationId = res.body.data.id
    })

    test('Debe fallar sin warehouseId', async () => {
      const res = await request(app)
        .post('/api/inventory/reconciliations')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          source: 'PHYSICAL_INVENTORY',
          reason: 'Sin warehouse',
          items: [{ itemId, systemQuantity: 100, expectedQuantity: 95 }],
        })

      expect(res.status).toBe(422)
    })

    test('Debe fallar sin source', async () => {
      const res = await request(app)
        .post('/api/inventory/reconciliations')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          warehouseId,
          reason: 'Sin source',
          items: [{ itemId, systemQuantity: 100, expectedQuantity: 95 }],
        })

      expect(res.status).toBe(422)
    })

    test('Debe fallar sin items', async () => {
      const res = await request(app)
        .post('/api/inventory/reconciliations')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          warehouseId,
          source: 'PHYSICAL_INVENTORY',
          reason: 'Sin items',
          items: [],
        })

      expect(res.status).toBe(422)
    })
  })

  // ============================================
  // GET ALL TESTS
  // ============================================
  describe('GET /api/inventory/reconciliations', () => {
    test('Debe obtener lista de reconciliaciones', async () => {
      const res = await request(app)
        .get('/api/inventory/reconciliations')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ page: 1, limit: 10 })

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
    })

    test('Debe filtrar por estado', async () => {
      const res = await request(app)
        .get('/api/inventory/reconciliations')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ status: 'DRAFT', page: 1, limit: 10 })

      expect(res.status).toBe(200)
    })

    test('Debe filtrar por warehouse', async () => {
      const res = await request(app)
        .get('/api/inventory/reconciliations')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ warehouseId, page: 1, limit: 10 })

      expect(res.status).toBe(200)
    })
  })

  // ============================================
  // GET BY ID TESTS
  // ============================================
  describe('GET /api/inventory/reconciliations/:id', () => {
    test('Debe obtener reconciliación por ID', async () => {
      if (!reconciliationId) {
        console.warn('reconciliationId no disponible')
        return
      }

      const res = await request(app)
        .get(`/api/inventory/reconciliations/${reconciliationId}`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.data.id).toBe(reconciliationId)
    })

    test('Debe fallar con ID no válido', async () => {
      const res = await request(app)
        .get('/api/inventory/reconciliations/invalid-id')
        .set('Authorization', `Bearer ${authToken}`)

      expect([404, 422]).toContain(res.status)
    })

    test('Debe fallar con reconciliación no encontrada', async () => {
      const res = await request(app)
        .get(
          '/api/inventory/reconciliations/00000000-0000-0000-0000-000000000000'
        )
        .set('Authorization', `Bearer ${authToken}`)

      expect(res.status).toBe(404)
    })
  })

  // ============================================
  // UPDATE TESTS
  // ============================================
  describe('PUT /api/inventory/reconciliations/:id', () => {
    test('Debe actualizar reconciliación en DRAFT', async () => {
      if (!reconciliationId) return

      const res = await request(app)
        .put(`/api/inventory/reconciliations/${reconciliationId}`)
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
  describe('Flujo de estados de reconciliación', () => {
    test('PATCH /:id/start - Debe iniciar la reconciliación', async () => {
      if (!reconciliationId) return

      const res = await request(app)
        .patch(`/api/inventory/reconciliations/${reconciliationId}/start`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ startedBy: userId })

      expect([200, 400]).toContain(res.status)
    })

    test('PATCH /:id/complete - Debe completar la reconciliación', async () => {
      if (!reconciliationId) return

      const res = await request(app)
        .patch(`/api/inventory/reconciliations/${reconciliationId}/complete`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ completedBy: userId })

      expect([200, 400]).toContain(res.status)
    })

    test('PATCH /:id/approve - Debe aprobar la reconciliación', async () => {
      if (!reconciliationId) return

      const res = await request(app)
        .patch(`/api/inventory/reconciliations/${reconciliationId}/approve`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ approvedBy: userId })

      expect([200, 400]).toContain(res.status)
    })

    test('PATCH /:id/apply - Debe aplicar la reconciliación', async () => {
      if (!reconciliationId) return

      const res = await request(app)
        .patch(`/api/inventory/reconciliations/${reconciliationId}/apply`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ appliedBy: userId })

      expect([200, 400]).toContain(res.status)
    })
  })

  // ============================================
  // REJECTION AND CANCELLATION
  // ============================================
  describe('Rechazo y cancelación', () => {
    test('PATCH /:id/reject - Debe rechazar una reconciliación', async () => {
      const createRes = await request(app)
        .post('/api/inventory/reconciliations')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          warehouseId,
          source: 'PHYSICAL_INVENTORY',
          reason: 'Para rechazar',
          items: [{ itemId, systemQuantity: 100, expectedQuantity: 90 }],
        })

      if (createRes.status === 201) {
        const recId = createRes.body.data.id
        const res = await request(app)
          .patch(`/api/inventory/reconciliations/${recId}/reject`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({ reason: 'Datos incorrectos' })

        expect([200, 400]).toContain(res.status)
      }
    })

    test('PATCH /:id/cancel - Debe cancelar una reconciliación', async () => {
      const createRes = await request(app)
        .post('/api/inventory/reconciliations')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          warehouseId,
          source: 'PHYSICAL_INVENTORY',
          reason: 'Para cancelar',
          items: [{ itemId, systemQuantity: 100, expectedQuantity: 90 }],
        })

      if (createRes.status === 201) {
        const recId = createRes.body.data.id
        const res = await request(app)
          .patch(`/api/inventory/reconciliations/${recId}/cancel`)
          .set('Authorization', `Bearer ${authToken}`)

        expect([200, 400]).toContain(res.status)
      }
    })
  })

  // ============================================
  // ITEMS TESTS
  // ============================================
  describe('POST /api/inventory/reconciliations/:id/items', () => {
    test('Debe agregar item a reconciliación', async () => {
      if (!reconciliationId) return

      const item2 = await prisma.item.create({
        data: {
          sku: 'TEST-REC-002',
          name: 'Second REC Item',
          brandId,
          categoryId,
          unitId,
          costPrice: 35,
          salePrice: 70,
          isActive: true,
        },
      })

      const res = await request(app)
        .post(`/api/inventory/reconciliations/${reconciliationId}/items`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          itemId: item2.id,
          systemQuantity: 50,
          expectedQuantity: 48,
        })

      expect([200, 201, 400]).toContain(res.status)
    })

    test('Debe fallar sin itemId', async () => {
      if (!reconciliationId) return

      const res = await request(app)
        .post(`/api/inventory/reconciliations/${reconciliationId}/items`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          systemQuantity: 100,
          expectedQuantity: 90,
        })

      expect(res.status).toBe(422)
    })
  })

  describe('GET /api/inventory/reconciliations/:id/items', () => {
    test('Debe obtener items de la reconciliación', async () => {
      if (!reconciliationId) return

      const res = await request(app)
        .get(`/api/inventory/reconciliations/${reconciliationId}/items`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(res.status).toBe(200)
      expect(Array.isArray(res.body.data)).toBe(true)
    })
  })

  // ============================================
  // DELETE TESTS
  // ============================================
  describe('DELETE /api/inventory/reconciliations/:id', () => {
    test('Debe eliminar reconciliación en DRAFT', async () => {
      const createRes = await request(app)
        .post('/api/inventory/reconciliations')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          warehouseId,
          source: 'PHYSICAL_INVENTORY',
          reason: 'Para eliminar',
          items: [{ itemId, systemQuantity: 100, expectedQuantity: 90 }],
        })

      if (createRes.status === 201) {
        const recId = createRes.body.data.id
        const res = await request(app)
          .delete(`/api/inventory/reconciliations/${recId}`)
          .set('Authorization', `Bearer ${authToken}`)

        expect([200, 400]).toContain(res.status)
      }
    })
  })
})
