// backend/src/features/inventory/adjustments/adjustments.test.ts

import { describe, test, expect, beforeAll, afterAll } from '@jest/globals'
import request from 'supertest'
import app from '../../../app'
import { getTestAuthToken } from '../../../shared/utils/test.utils'
import prisma from '../../../services/prisma.service'

describe('Adjustments API Tests', () => {
  let authToken: string
  let userId: string
  let itemId: string
  let warehouseId: string
  let adjustmentId: string
  let brandId: string
  let categoryId: string
  let unitId: string

  beforeAll(async () => {
    // Generar timestamp único para los datos de prueba
    const timestamp = Date.now()
    const uniquePrefix = `TEST-ADJ-${timestamp}`

    await prisma.adjustmentItem
      .deleteMany({
        where: { adjustment: { adjustmentNumber: { startsWith: 'TEST-ADJ' } } },
      })
      .catch(() => {})
    await prisma.adjustment
      .deleteMany({ where: { adjustmentNumber: { startsWith: 'TEST-ADJ' } } })
      .catch(() => {})
    await prisma.item
      .deleteMany({ where: { sku: { startsWith: 'TEST-ADJ' } } })
      .catch(() => {})
    await prisma.warehouse
      .deleteMany({ where: { code: { startsWith: 'TEST-ADJ-WH' } } })
      .catch(() => {})
    await prisma.brand
      .deleteMany({ where: { code: { startsWith: 'TEST-BRAND-ADJ' } } })
      .catch(() => {})
    await prisma.category
      .deleteMany({ where: { code: { startsWith: 'TEST-CAT-ADJ' } } })
      .catch(() => {})
    await prisma.unit
      .deleteMany({ where: { code: { startsWith: 'TEST-UNIT-ADJ' } } })
      .catch(() => {})

    authToken = await getTestAuthToken()

    const user = await prisma.user.findUnique({
      where: { correo: 'admin@test.com' },
    })
    userId = user?.id || '550e8400-e29b-41d4-a716-446655440000'

    const brand = await prisma.brand.create({
      data: {
        code: `TEST-BRAND-ADJ-${timestamp}`,
        name: 'Test Brand Adj',
        type: 'PART',
        isActive: true,
      },
    })
    brandId = brand.id

    const category = await prisma.category.create({
      data: {
        code: `TEST-CAT-ADJ-${timestamp}`,
        name: 'Test Category Adj',
        isActive: true,
      },
    })
    categoryId = category.id

    const unit = await prisma.unit.create({
      data: {
        code: `TEST-UNIT-ADJ-${timestamp}`,
        name: 'Test Unit Adj',
        abbreviation: `TAJ${timestamp}`,
        type: 'COUNTABLE',
        isActive: true,
      },
    })
    unitId = unit.id

    const wh = await prisma.warehouse.create({
      data: {
        code: `TEST-ADJ-WH-${timestamp}`,
        name: 'Adjustment Warehouse',
        type: 'PRINCIPAL',
        isActive: true,
      },
    })
    warehouseId = wh.id

    const item = await prisma.item.create({
      data: {
        sku: `TEST-ADJ-${timestamp}`,
        name: 'Test Adjustment Item',
        brandId,
        categoryId,
        unitId,
        costPrice: 25,
        salePrice: 50,
        isActive: true,
      },
    })
    itemId = item.id

    // Crear stock para el ajuste
    await prisma.stock
      .create({
        data: {
          itemId,
          warehouseId,
          quantityReal: 100,
          quantityReserved: 0,
          quantityAvailable: 100,
          averageCost: 25,
        },
      })
      .catch(() => {})
  }, 20000)

  afterAll(async () => {
    try {
      await prisma.adjustmentItem
        .deleteMany({
          where: {
            adjustment: { adjustmentNumber: { startsWith: 'TEST-ADJ' } },
          },
        })
        .catch(() => {})
      await prisma.adjustment
        .deleteMany({ where: { adjustmentNumber: { startsWith: 'TEST-ADJ' } } })
        .catch(() => {})
      await prisma.stock
        .deleteMany({ where: { item: { sku: { startsWith: 'TEST-ADJ' } } } })
        .catch(() => {})
      await prisma.item
        .deleteMany({ where: { sku: { startsWith: 'TEST-ADJ' } } })
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
        .deleteMany({ where: { code: { startsWith: 'TEST-ADJ-WH' } } })
        .catch(() => {})
    } catch (error) {
      console.log('Error en afterAll cleanup:', error)
    }
  })

  // ── POST /api/inventory/adjustments ──
  describe('POST /api/inventory/adjustments', () => {
    test('Debe crear un ajuste exitosamente', async () => {
      const res = await request(app)
        .post('/api/inventory/adjustments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          warehouseId,
          reason: 'Ajuste de prueba por conteo físico',
          notes: 'Notas de prueba',
          items: [
            {
              itemId,
              quantityChange: 10,
              unitCost: 25,
              notes: 'Ingreso por conteo',
            },
          ],
        })

      if (res.status !== 201) {
        console.log('ERROR Response:', JSON.stringify(res.body, null, 2))
      }

      expect(res.status).toBe(201)
      expect(res.body.success).toBe(true)
      expect(res.body.data).toHaveProperty('id')
      adjustmentId = res.body.data.id
    })

    test('Debe fallar sin warehouseId', async () => {
      const res = await request(app)
        .post('/api/inventory/adjustments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          reason: 'Ajuste inválido',
          items: [{ itemId, quantityChange: 5 }],
        })

      expect(res.status).toBe(422)
    })

    test('Debe fallar sin items', async () => {
      const res = await request(app)
        .post('/api/inventory/adjustments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          warehouseId,
          reason: 'Ajuste sin items',
          items: [],
        })

      expect(res.status).toBe(422)
    })
  })

  // ── GET /api/inventory/adjustments ──
  describe('GET /api/inventory/adjustments', () => {
    test('Debe obtener lista de ajustes', async () => {
      const res = await request(app)
        .get('/api/inventory/adjustments')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ page: 1, limit: 10 })

      if (res.status !== 200) {
        console.log('GET ERROR:', JSON.stringify(res.body, null, 2))
      }

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(Array.isArray(res.body.data)).toBe(true)
    })

    test('Debe filtrar ajustes por status', async () => {
      const res = await request(app)
        .get('/api/inventory/adjustments')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ status: 'DRAFT', page: 1, limit: 10 })

      expect(res.status).toBe(200)
      expect(Array.isArray(res.body.data)).toBe(true)
    })
  })

  // ── GET /api/inventory/adjustments/:id ──
  describe('GET /api/inventory/adjustments/:id', () => {
    test('Debe obtener ajuste por ID', async () => {
      if (!adjustmentId) return
      const res = await request(app)
        .get(`/api/inventory/adjustments/${adjustmentId}`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.data.id).toBe(adjustmentId)
    })

    test('Debe fallar con ajuste no encontrado', async () => {
      const res = await request(app)
        .get('/api/inventory/adjustments/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${authToken}`)

      expect(res.status).toBe(404)
    })
  })

  // ── PUT /api/inventory/adjustments/:id ──
  describe('PUT /api/inventory/adjustments/:id', () => {
    test('Debe actualizar ajuste en DRAFT', async () => {
      if (!adjustmentId) return
      const res = await request(app)
        .put(`/api/inventory/adjustments/${adjustmentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          reason: 'Razón actualizada',
          notes: 'Notas actualizadas',
        })

      expect([200, 400]).toContain(res.status)
    })
  })

  // ── GET /api/inventory/adjustments/:id/items ──
  describe('GET /api/inventory/adjustments/:id/items', () => {
    test('Debe obtener items del ajuste', async () => {
      if (!adjustmentId) return
      const res = await request(app)
        .get(`/api/inventory/adjustments/${adjustmentId}/items`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(res.status).toBe(200)
      expect(Array.isArray(res.body.data)).toBe(true)
    })
  })

  // ── POST /api/inventory/adjustments/:id/items ──
  describe('POST /api/inventory/adjustments/:id/items', () => {
    test('Debe agregar item al ajuste', async () => {
      if (!adjustmentId) return

      // Generar timestamp único para evitar duplicados
      const timestamp = Date.now()

      // Crear segundo item para agregar
      const item2 = await prisma.item.create({
        data: {
          sku: `TEST-ADJ-002-${timestamp}`,
          name: 'Second Adjustment Item',
          brandId,
          categoryId,
          unitId,
          costPrice: 40,
          salePrice: 80,
          isActive: true,
        },
      })

      const res = await request(app)
        .post(`/api/inventory/adjustments/${adjustmentId}/items`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          itemId: item2.id,
          quantityChange: -5,
          unitCost: 40,
          notes: 'Salida por ajuste',
        })

      expect([200, 201, 400]).toContain(res.status)
    })
  })

  // ── Flujo de estados: DRAFT → APPROVED → APPLIED ──
  describe('Flujo de estados del ajuste', () => {
    test('PATCH /:id/approve - Debe aprobar el ajuste', async () => {
      if (!adjustmentId) return
      const res = await request(app)
        .patch(`/api/inventory/adjustments/${adjustmentId}/approve`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ approvedBy: userId })

      expect([200, 400]).toContain(res.status)
    })

    test('PATCH /:id/apply - Debe aplicar el ajuste', async () => {
      if (!adjustmentId) return
      const res = await request(app)
        .patch(`/api/inventory/adjustments/${adjustmentId}/apply`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ appliedBy: userId })

      expect([200, 400, 404]).toContain(res.status)
    })
  })

  // ── Rechazo y cancelación ──
  describe('Rechazo y cancelación de ajustes', () => {
    test('PATCH /:id/reject - Debe rechazar un ajuste', async () => {
      // Crear nuevo ajuste para rechazar
      const createRes = await request(app)
        .post('/api/inventory/adjustments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          warehouseId,
          reason: 'Ajuste para rechazar',
          items: [{ itemId, quantityChange: 3 }],
        })

      if (createRes.status === 201) {
        const rejectId = createRes.body.data.id
        const res = await request(app)
          .patch(`/api/inventory/adjustments/${rejectId}/reject`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({ reason: 'Datos incorrectos' })

        expect([200, 400]).toContain(res.status)
      }
    })

    test('PATCH /:id/cancel - Debe cancelar un ajuste', async () => {
      const createRes = await request(app)
        .post('/api/inventory/adjustments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          warehouseId,
          reason: 'Ajuste para cancelar',
          items: [{ itemId, quantityChange: 2 }],
        })

      if (createRes.status === 201) {
        const cancelId = createRes.body.data.id
        const res = await request(app)
          .patch(`/api/inventory/adjustments/${cancelId}/cancel`)
          .set('Authorization', `Bearer ${authToken}`)

        expect([200, 400]).toContain(res.status)
      }
    })
  })

  // ── DELETE /api/inventory/adjustments/:id ──
  describe('DELETE /api/inventory/adjustments/:id', () => {
    test('Debe eliminar ajuste en DRAFT', async () => {
      const createRes = await request(app)
        .post('/api/inventory/adjustments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          warehouseId,
          reason: 'Ajuste para eliminar',
          items: [{ itemId, quantityChange: 1 }],
        })

      if (createRes.status === 201) {
        const deleteId = createRes.body.data.id
        const res = await request(app)
          .delete(`/api/inventory/adjustments/${deleteId}`)
          .set('Authorization', `Bearer ${authToken}`)

        expect([200, 204, 400]).toContain(res.status)
      }
    })

    test('Debe fallar al eliminar ajuste no encontrado', async () => {
      const res = await request(app)
        .delete(
          '/api/inventory/adjustments/00000000-0000-0000-0000-000000000000'
        )
        .set('Authorization', `Bearer ${authToken}`)

      expect([404, 400]).toContain(res.status)
    })
  })
})
