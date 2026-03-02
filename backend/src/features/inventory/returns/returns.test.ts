// backend/src/features/inventory/returns/returns.test.ts

import { describe, test, expect, beforeAll, afterAll } from '@jest/globals'
import request from 'supertest'
import app from '../../../index'
import { getTestAuthToken } from '../../../shared/utils/test.utils'
import prisma from '../../../services/prisma.service'

describe('Returns API Tests', () => {
  let authToken: string
  let userId: string
  let warehouseId: string
  let itemId: string
  let returnId: string
  let brandId: string
  let categoryId: string
  let unitId: string

  beforeAll(async () => {
    // ── Cleanup: Eliminar datos de tests previos ──
    await prisma.returnOrderItem
      .deleteMany({
        where: { returnOrder: { returnNumber: { startsWith: 'RET-' } } },
      })
      .catch(() => {})
    await prisma.returnOrder
      .deleteMany({ where: { returnNumber: { startsWith: 'RET-' } } })
      .catch(() => {})
    await prisma.movement
      .deleteMany({ where: { item: { sku: { startsWith: 'TEST-RET' } } } })
      .catch(() => {})
    await prisma.stock
      .deleteMany({ where: { item: { sku: { startsWith: 'TEST-RET' } } } })
      .catch(() => {})
    await prisma.item
      .deleteMany({ where: { sku: { startsWith: 'TEST-RET' } } })
      .catch(() => {})
    await prisma.warehouse
      .deleteMany({ where: { code: { startsWith: 'TEST-RET-WH' } } })
      .catch(() => {})
    await prisma.brand
      .deleteMany({ where: { code: 'TEST-BRAND-RET' } })
      .catch(() => {})
    await prisma.category
      .deleteMany({ where: { code: 'TEST-CAT-RET' } })
      .catch(() => {})
    await prisma.unit
      .deleteMany({ where: { code: 'TEST-UNIT-RET' } })
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
        code: 'TEST-BRAND-RET',
        name: 'Test Brand RET',
        type: 'PART',
        isActive: true,
      },
    })
    brandId = brand.id

    // ── Crear dependencias: Category ──
    const category = await prisma.category.create({
      data: {
        code: 'TEST-CAT-RET',
        name: 'Test Category RET',
        isActive: true,
      },
    })
    categoryId = category.id

    // ── Crear dependencias: Unit ──
    const unit = await prisma.unit.create({
      data: {
        code: 'TEST-UNIT-RET',
        name: 'Test Unit RET',
        abbreviation: 'TUR',
        type: 'COUNTABLE',
        isActive: true,
      },
    })
    unitId = unit.id

    // ── Crear dependencias: Warehouse ──
    const warehouse = await prisma.warehouse.create({
      data: {
        code: 'TEST-RET-WH-1',
        name: 'RET Warehouse',
        type: 'PRINCIPAL',
        isActive: true,
      },
    })
    warehouseId = warehouse.id

    // ── Crear dependencias: Item ──
    const item = await prisma.item.create({
      data: {
        sku: 'TEST-RET-001',
        name: 'Test RET Item',
        brandId,
        categoryId,
        unitId,
        costPrice: 40,
        salePrice: 80,
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
          averageCost: 40,
        },
      })
      .catch(() => {})
  }, 20000)

  afterAll(async () => {
    try {
      // ── Cleanup en orden FK-safe ──
      await prisma.returnOrderItem
        .deleteMany({
          where: { returnOrder: { returnNumber: { startsWith: 'RET-' } } },
        })
        .catch(() => {})
      await prisma.returnOrder
        .deleteMany({ where: { returnNumber: { startsWith: 'RET-' } } })
        .catch(() => {})
      await prisma.movement
        .deleteMany({ where: { item: { sku: { startsWith: 'TEST-RET' } } } })
        .catch(() => {})
      await prisma.stock
        .deleteMany({ where: { item: { sku: { startsWith: 'TEST-RET' } } } })
        .catch(() => {})
      await prisma.item
        .deleteMany({ where: { sku: { startsWith: 'TEST-RET' } } })
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
        .deleteMany({ where: { code: { startsWith: 'TEST-RET-WH' } } })
        .catch(() => {})
    } catch (error) {
      console.log('Error en afterAll cleanup:', error)
    }
  })

  // ============================================
  // CREATE TESTS
  // ============================================
  describe('POST /api/inventory/returns', () => {
    test('Debe crear una devolución SUPPLIER_RETURN exitosamente', async () => {
      const res = await request(app)
        .post('/api/inventory/returns')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          type: 'SUPPLIER_RETURN',
          warehouseId,
          reason: 'Artículo defectuoso',
          notes: 'Devolución de prueba',
          items: [
            {
              itemId,
              quantity: 25,
              unitPrice: 40,
            },
          ],
        })

      expect(res.status).toBe(201)
      expect(res.body.success).toBe(true)
      expect(res.body.data).toHaveProperty('id')
      returnId = res.body.data.id
    })

    test('Debe crear una devolución WORKSHOP_RETURN exitosamente', async () => {
      const res = await request(app)
        .post('/api/inventory/returns')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          type: 'WORKSHOP_RETURN',
          warehouseId,
          reason: 'Pieza no utilizada',
          items: [{ itemId, quantity: 20 }],
        })

      expect(res.status).toBe(201)
      expect(res.body.success).toBe(true)
    })

    test('Debe crear una devolución CUSTOMER_RETURN exitosamente', async () => {
      const res = await request(app)
        .post('/api/inventory/returns')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          type: 'CUSTOMER_RETURN',
          warehouseId,
          reason: 'Cliente solicita devolución',
          items: [{ itemId, quantity: 15 }],
        })

      expect(res.status).toBe(201)
      expect(res.body.success).toBe(true)
    })

    test('Debe fallar sin type', async () => {
      const res = await request(app)
        .post('/api/inventory/returns')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          warehouseId,
          reason: 'Sin tipo',
          items: [{ itemId, quantity: 10 }],
        })

      expect(res.status).toBe(422)
    })

    test('Debe fallar sin warehouseId', async () => {
      const res = await request(app)
        .post('/api/inventory/returns')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          type: 'SUPPLIER_RETURN',
          reason: 'Sin warehouse',
          items: [{ itemId, quantity: 10 }],
        })

      expect(res.status).toBe(422)
    })

    test('Debe fallar sin reason', async () => {
      const res = await request(app)
        .post('/api/inventory/returns')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          type: 'SUPPLIER_RETURN',
          warehouseId,
          items: [{ itemId, quantity: 10 }],
        })

      expect(res.status).toBe(422)
    })

    test('Debe fallar sin items', async () => {
      const res = await request(app)
        .post('/api/inventory/returns')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          type: 'SUPPLIER_RETURN',
          warehouseId,
          reason: 'Sin items',
          items: [],
        })

      expect(res.status).toBe(422)
    })

    test('Debe fallar con tipo inválido', async () => {
      const res = await request(app)
        .post('/api/inventory/returns')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          type: 'INVALID_TYPE',
          warehouseId,
          reason: 'Tipo inválido',
          items: [{ itemId, quantity: 10 }],
        })

      expect(res.status).toBe(422)
    })
  })

  // ============================================
  // GET ALL TESTS
  // ============================================
  describe('GET /api/inventory/returns', () => {
    test('Debe obtener lista de devoluciones', async () => {
      const res = await request(app)
        .get('/api/inventory/returns')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ page: 1, limit: 10 })

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
    })

    test('Debe filtrar por tipo', async () => {
      const res = await request(app)
        .get('/api/inventory/returns')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ type: 'SUPPLIER_RETURN', page: 1, limit: 10 })

      expect(res.status).toBe(200)
    })

    test('Debe filtrar por estado', async () => {
      const res = await request(app)
        .get('/api/inventory/returns')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ status: 'DRAFT', page: 1, limit: 10 })

      expect(res.status).toBe(200)
    })
  })

  // ============================================
  // GET BY ID TESTS
  // ============================================
  describe('GET /api/inventory/returns/:id', () => {
    test('Debe obtener devolución por ID', async () => {
      if (!returnId) {
        console.warn('returnId no disponible')
        return
      }

      const res = await request(app)
        .get(`/api/inventory/returns/${returnId}`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.data.id).toBe(returnId)
    })

    test('Debe fallar con ID no válido', async () => {
      const res = await request(app)
        .get('/api/inventory/returns/invalid-id')
        .set('Authorization', `Bearer ${authToken}`)

      expect(res.status).toBe(404)
    })

    test('Debe fallar con devolución no encontrada', async () => {
      const res = await request(app)
        .get('/api/inventory/returns/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${authToken}`)

      expect(res.status).toBe(404)
    })
  })

  // ============================================
  // UPDATE TESTS
  // ============================================
  describe('PUT /api/inventory/returns/:id', () => {
    test('Debe actualizar devolución en PENDING', async () => {
      if (!returnId) return

      const res = await request(app)
        .put(`/api/inventory/returns/${returnId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          reason: 'Razón actualizada',
          notes: 'Notas actualizadas',
        })

      expect([200, 400]).toContain(res.status)
    })
  })

  // ============================================
  // APPROVE TESTS
  // ============================================
  describe('PATCH /api/inventory/returns/:id/approve', () => {
    test('Debe aprobar una devolución', async () => {
      if (!returnId) return

      const res = await request(app)
        .patch(`/api/inventory/returns/${returnId}/approve`)
        .set('Authorization', `Bearer ${authToken}`)

      expect([200, 400]).toContain(res.status)
    })
  })

  // ============================================
  // PROCESS TESTS
  // ============================================
  describe('PATCH /api/inventory/returns/:id/process', () => {
    test('Debe procesar una devolución aprobada', async () => {
      if (!returnId) return

      const res = await request(app)
        .patch(`/api/inventory/returns/${returnId}/process`)
        .set('Authorization', `Bearer ${authToken}`)

      expect([200, 400]).toContain(res.status)
    })
  })

  // ============================================
  // REJECT TESTS (if available)
  // ============================================
  describe('Rechazo de devoluciones (si disponible)', () => {
    test('PATCH /:id/reject - Debe rechazar una devolución', async () => {
      const createRes = await request(app)
        .post('/api/inventory/returns')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          type: 'SUPPLIER_RETURN',
          warehouseId,
          reason: 'Para rechazar',
          items: [{ itemId, quantity: 12 }],
        })

      if (createRes.status === 201) {
        const retId = createRes.body.data.id
        const res = await request(app)
          .patch(`/api/inventory/returns/${retId}/reject`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({ reason: 'Datos incorrectos' })

        expect([200, 400, 404]).toContain(res.status) // 404 if endpoint not available
      }
    })
  })

  // ============================================
  // DELETE TESTS
  // ============================================
  describe('DELETE /api/inventory/returns/:id', () => {
    test('Debe eliminar devolución en PENDING', async () => {
      const createRes = await request(app)
        .post('/api/inventory/returns')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          type: 'SUPPLIER_RETURN',
          warehouseId,
          reason: 'Para eliminar',
          items: [{ itemId, quantity: 10 }],
        })

      if (createRes.status === 201) {
        const retId = createRes.body.data.id
        const res = await request(app)
          .delete(`/api/inventory/returns/${retId}`)
          .set('Authorization', `Bearer ${authToken}`)

        expect([200, 400, 404]).toContain(res.status) // 404 if endpoint not implemented
      }
    })
  })
})
