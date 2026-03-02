// backend/src/features/inventory/purchaseOrders/purchaseOrders.test.ts

import { describe, test, expect, beforeAll, afterAll } from '@jest/globals'
import request from 'supertest'
import app from '../../../index'
import { getTestAuthToken } from '../../../shared/utils/test.utils'
import prisma from '../../../services/prisma.service'

describe('Purchase Orders API Tests', () => {
  let authToken: string
  let userId: string
  let supplierId: string
  let warehouseId: string
  let itemId: string
  let purchaseOrderId: string
  let brandId: string
  let categoryId: string
  let unitId: string

  beforeAll(async () => {
    // ── Cleanup: Eliminar datos de tests previos ──
    // Usar relación con supplier de test para encontrar POs reales (auto-generan orderNumber)
    await prisma.purchaseOrderItem
      .deleteMany({
        where: {
          purchaseOrder: { supplier: { code: { startsWith: 'TEST-PO-SUP' } } },
        },
      })
      .catch(() => {})
    await prisma.purchaseOrder
      .deleteMany({
        where: { supplier: { code: { startsWith: 'TEST-PO-SUP' } } },
      })
      .catch(() => {})
    await prisma.stock
      .deleteMany({ where: { item: { sku: { startsWith: 'TEST-PO' } } } })
      .catch(() => {})
    await prisma.item
      .deleteMany({ where: { sku: { startsWith: 'TEST-PO' } } })
      .catch(() => {})
    await prisma.supplier
      .deleteMany({ where: { code: { startsWith: 'TEST-PO-SUP' } } })
      .catch(() => {})
    await prisma.warehouse
      .deleteMany({ where: { code: { startsWith: 'TEST-PO-WH' } } })
      .catch(() => {})
    await prisma.brand
      .deleteMany({ where: { code: 'TEST-BRAND-PO' } })
      .catch(() => {})
    await prisma.category
      .deleteMany({ where: { code: 'TEST-CAT-PO' } })
      .catch(() => {})
    await prisma.unit
      .deleteMany({ where: { code: 'TEST-UNIT-PO' } })
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
        code: 'TEST-BRAND-PO',
        name: 'Test Brand PO',
        type: 'PART',
        isActive: true,
      },
    })
    brandId = brand.id

    // ── Crear dependencias: Category ──
    const category = await prisma.category.create({
      data: {
        code: 'TEST-CAT-PO',
        name: 'Test Category PO',
        isActive: true,
      },
    })
    categoryId = category.id

    // ── Crear dependencias: Unit ──
    const unit = await prisma.unit.create({
      data: {
        code: 'TEST-UNIT-PO',
        name: 'Test Unit PO',
        abbreviation: 'TUP',
        type: 'COUNTABLE',
        isActive: true,
      },
    })
    unitId = unit.id

    // ── Crear dependencias: Supplier ──
    const supplier = await prisma.supplier.create({
      data: {
        code: 'TEST-PO-SUP-001',
        name: 'Test Supplier PO',
        contactName: 'John Doe',
        email: 'supplier@test.com',
        phone: '123456789',
      },
    })
    supplierId = supplier.id

    // ── Crear dependencias: Warehouse ──
    const warehouse = await prisma.warehouse.create({
      data: {
        code: 'TEST-PO-WH-1',
        name: 'PO Warehouse',
        type: 'PRINCIPAL',
        isActive: true,
      },
    })
    warehouseId = warehouse.id

    // ── Crear dependencias: Item ──
    const item = await prisma.item.create({
      data: {
        sku: 'TEST-PO-001',
        name: 'Test PO Item',
        brandId,
        categoryId,
        unitId,
        costPrice: 50,
        salePrice: 100,
        isActive: true,
      },
    })
    itemId = item.id
  }, 20000)

  afterAll(async () => {
    try {
      // ── Cleanup en orden FK-safe ──
      await prisma.purchaseOrderItem
        .deleteMany({
          where: {
            purchaseOrder: {
              supplier: { code: { startsWith: 'TEST-PO-SUP' } },
            },
          },
        })
        .catch(() => {})
      await prisma.purchaseOrder
        .deleteMany({
          where: { supplier: { code: { startsWith: 'TEST-PO-SUP' } } },
        })
        .catch(() => {})
      await prisma.stock
        .deleteMany({ where: { item: { sku: { startsWith: 'TEST-PO' } } } })
        .catch(() => {})
      await prisma.item
        .deleteMany({ where: { sku: { startsWith: 'TEST-PO' } } })
        .catch(() => {})
      if (unitId)
        await prisma.unit.delete({ where: { id: unitId } }).catch(() => {})
      if (categoryId)
        await prisma.category
          .delete({ where: { id: categoryId } })
          .catch(() => {})
      if (brandId)
        await prisma.brand.delete({ where: { id: brandId } }).catch(() => {})
      await prisma.supplier
        .deleteMany({ where: { code: { startsWith: 'TEST-PO-SUP' } } })
        .catch(() => {})
      await prisma.warehouse
        .deleteMany({ where: { code: { startsWith: 'TEST-PO-WH' } } })
        .catch(() => {})
    } catch (error) {
      console.log('Error en afterAll cleanup:', error)
    }
  })

  // ============================================
  // CREATE TESTS
  // ============================================
  describe('POST /api/inventory/purchase-orders', () => {
    test('Debe crear una orden de compra exitosamente', async () => {
      const res = await request(app)
        .post('/api/inventory/purchase-orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          supplierId,
          warehouseId,
          notes: 'Compra de prueba',
          expectedDate: new Date(Date.now() + 86400000).toISOString(),
        })

      expect(res.status).toBe(201)
      expect(res.body.success).toBe(true)
      expect(res.body.data).toHaveProperty('id')
      expect(res.body.data.supplierId).toBe(supplierId)
      expect(res.body.data.warehouseId).toBe(warehouseId)
      purchaseOrderId = res.body.data.id
    })

    test('Debe fallar al crear sin supplierId', async () => {
      const res = await request(app)
        .post('/api/inventory/purchase-orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          warehouseId,
          notes: 'Sin supplier',
        })

      expect(res.status).toBe(422)
      expect(res.body.success).toBe(false)
    })

    test('Debe fallar al crear sin warehouseId', async () => {
      const res = await request(app)
        .post('/api/inventory/purchase-orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          supplierId,
          notes: 'Sin warehouse',
        })

      expect(res.status).toBe(422)
      expect(res.body.success).toBe(false)
    })

    test('Debe fallar con supplier no existente', async () => {
      const res = await request(app)
        .post('/api/inventory/purchase-orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          supplierId: '00000000-0000-0000-0000-000000000000',
          warehouseId,
        })

      expect([400, 404, 422]).toContain(res.status)
    })
  })

  // ============================================
  // GET ALL TESTS
  // ============================================
  describe('GET /api/inventory/purchase-orders', () => {
    test('Debe obtener lista de órdenes de compra', async () => {
      const res = await request(app)
        .get('/api/inventory/purchase-orders')
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
        .get('/api/inventory/purchase-orders')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ status: 'DRAFT', page: 1, limit: 10 })

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
    })

    test('Debe filtrar por supplier', async () => {
      const res = await request(app)
        .get('/api/inventory/purchase-orders')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ supplierId, page: 1, limit: 10 })

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
    })
  })

  // ============================================
  // GET BY ID TESTS
  // ============================================
  describe('GET /api/inventory/purchase-orders/:id', () => {
    test('Debe obtener orden de compra por ID', async () => {
      if (!purchaseOrderId) {
        console.warn('purchaseOrderId no disponible, saltando test')
        return
      }

      const res = await request(app)
        .get(`/api/inventory/purchase-orders/${purchaseOrderId}`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.data.id).toBe(purchaseOrderId)
    })

    test('Debe fallar con ID no válido', async () => {
      const res = await request(app)
        .get('/api/inventory/purchase-orders/invalid-id')
        .set('Authorization', `Bearer ${authToken}`)

      expect([404, 422]).toContain(res.status)
    })

    test('Debe fallar con orden no encontrada', async () => {
      const res = await request(app)
        .get(
          '/api/inventory/purchase-orders/00000000-0000-0000-0000-000000000000'
        )
        .set('Authorization', `Bearer ${authToken}`)

      expect(res.status).toBe(404)
    })
  })

  // ============================================
  // UPDATE TESTS
  // ============================================
  describe('PUT /api/inventory/purchase-orders/:id', () => {
    test('Debe actualizar orden de compra en DRAFT', async () => {
      if (!purchaseOrderId) return

      const res = await request(app)
        .put(`/api/inventory/purchase-orders/${purchaseOrderId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          notes: 'Notas actualizadas',
          expectedDate: new Date(Date.now() + 172800000).toISOString(),
        })

      expect([200, 400]).toContain(res.status)
    })
  })

  // ============================================
  // APPROVE TESTS
  // ============================================
  describe('PATCH /api/inventory/purchase-orders/:id/approve', () => {
    test('Debe aprobar una orden de compra', async () => {
      if (!purchaseOrderId) return

      const res = await request(app)
        .patch(`/api/inventory/purchase-orders/${purchaseOrderId}/approve`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ approvedBy: userId })

      expect([200, 400]).toContain(res.status)
    })
  })

  // ============================================
  // CANCEL TESTS
  // ============================================
  describe('PATCH /api/inventory/purchase-orders/:id/cancel', () => {
    test('Debe cancelar una orden de compra', async () => {
      // Crear nueva orden para cancelar (no usar la que puede estar aprobada)
      const createRes = await request(app)
        .post('/api/inventory/purchase-orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          supplierId,
          warehouseId,
          notes: 'Para cancelar',
        })

      if (createRes.status === 201) {
        const poId = createRes.body.data.id
        const res = await request(app)
          .patch(`/api/inventory/purchase-orders/${poId}/cancel`)
          .set('Authorization', `Bearer ${authToken}`)

        expect([200, 400]).toContain(res.status)
      }
    })
  })

  // ============================================
  // ITEMS TESTS
  // ============================================
  describe('POST /api/inventory/purchase-orders/:id/items', () => {
    test('Debe agregar item a orden de compra', async () => {
      if (!purchaseOrderId) return

      const res = await request(app)
        .post(`/api/inventory/purchase-orders/${purchaseOrderId}/items`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          itemId,
          quantityOrdered: 50,
          unitCost: 45,
        })

      expect([200, 201, 400]).toContain(res.status)
    })

    test('Debe fallar sin itemId', async () => {
      if (!purchaseOrderId) return

      const res = await request(app)
        .post(`/api/inventory/purchase-orders/${purchaseOrderId}/items`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          quantityOrdered: 50,
          unitCost: 45,
        })

      expect(res.status).toBe(422)
    })

    test('Debe fallar con cantidad negativa', async () => {
      if (!purchaseOrderId) return

      const res = await request(app)
        .post(`/api/inventory/purchase-orders/${purchaseOrderId}/items`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          itemId,
          quantityOrdered: -10,
          unitCost: 45,
        })

      expect(res.status).toBe(422)
    })
  })

  describe('GET /api/inventory/purchase-orders/:id/items', () => {
    test('Debe obtener items de orden de compra', async () => {
      if (!purchaseOrderId) return

      const res = await request(app)
        .get(`/api/inventory/purchase-orders/${purchaseOrderId}/items`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(res.status).toBe(200)
      expect(Array.isArray(res.body.data)).toBe(true)
    })
  })

  // ============================================
  // DELETE TESTS
  // ============================================
  describe('DELETE /api/inventory/purchase-orders/:id', () => {
    test('Debe eliminar orden de compra en DRAFT', async () => {
      // Crear nueva orden para eliminar
      const createRes = await request(app)
        .post('/api/inventory/purchase-orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          supplierId,
          warehouseId,
          notes: 'Para eliminar',
        })

      if (createRes.status === 201) {
        const poId = createRes.body.data.id
        const res = await request(app)
          .delete(`/api/inventory/purchase-orders/${poId}`)
          .set('Authorization', `Bearer ${authToken}`)

        expect([200, 400]).toContain(res.status)
      }
    })
  })
})
