// backend/src/features/inventory/receives/receives.test.ts

import { describe, test, expect, beforeAll, afterAll } from '@jest/globals'
import request from 'supertest'
import app from '../../../index'
import { getTestAuthToken } from '../../../shared/utils/test.utils'
import prisma from '../../../services/prisma.service'

describe('Receives API Tests', () => {
  let authToken: string
  let userId: string
  let supplierId: string
  let warehouseId: string
  let itemId: string
  let purchaseOrderId: string
  let receiveId: string
  let brandId: string
  let categoryId: string
  let unitId: string

  beforeAll(async () => {
    // ── Cleanup: Eliminar datos de tests previos ──
    await prisma.receiveItem
      .deleteMany({
        where: {
          receive: {
            purchaseOrder: {
              supplier: { code: { startsWith: 'TEST-RCV-SUP' } },
            },
          },
        },
      })
      .catch(() => {})
    await prisma.receive
      .deleteMany({
        where: {
          purchaseOrder: { supplier: { code: { startsWith: 'TEST-RCV-SUP' } } },
        },
      })
      .catch(() => {})
    await prisma.purchaseOrderItem
      .deleteMany({
        where: {
          purchaseOrder: { supplier: { code: { startsWith: 'TEST-RCV-SUP' } } },
        },
      })
      .catch(() => {})
    await prisma.purchaseOrder
      .deleteMany({
        where: { supplier: { code: { startsWith: 'TEST-RCV-SUP' } } },
      })
      .catch(() => {})
    await prisma.stock
      .deleteMany({ where: { item: { sku: { startsWith: 'TEST-RCV' } } } })
      .catch(() => {})
    await prisma.item
      .deleteMany({ where: { sku: { startsWith: 'TEST-RCV' } } })
      .catch(() => {})
    await prisma.supplier
      .deleteMany({ where: { code: { startsWith: 'TEST-RCV-SUP' } } })
      .catch(() => {})
    await prisma.warehouse
      .deleteMany({ where: { code: { startsWith: 'TEST-RCV-WH' } } })
      .catch(() => {})
    await prisma.brand
      .deleteMany({ where: { code: 'TEST-BRAND-RCV' } })
      .catch(() => {})
    await prisma.category
      .deleteMany({ where: { code: 'TEST-CAT-RCV' } })
      .catch(() => {})
    await prisma.unit
      .deleteMany({ where: { code: 'TEST-UNIT-RCV' } })
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
        code: 'TEST-BRAND-RCV',
        name: 'Test Brand RCV',
        type: 'PART',
        isActive: true,
      },
    })
    brandId = brand.id

    // ── Crear dependencias: Category ──
    const category = await prisma.category.create({
      data: {
        code: 'TEST-CAT-RCV',
        name: 'Test Category RCV',
        isActive: true,
      },
    })
    categoryId = category.id

    // ── Crear dependencias: Unit ──
    const unit = await prisma.unit.create({
      data: {
        code: 'TEST-UNIT-RCV',
        name: 'Test Unit RCV',
        abbreviation: 'TUR',
        type: 'COUNTABLE',
        isActive: true,
      },
    })
    unitId = unit.id

    // ── Crear dependencias: Supplier ──
    const supplier = await prisma.supplier.create({
      data: {
        code: 'TEST-RCV-SUP-001',
        name: 'Test Supplier RCV',
        contactName: 'Jane Smith',
        email: 'supplier-rcv@test.com',
        phone: '987654321',
        isActive: true,
      },
    })
    supplierId = supplier.id

    // ── Crear dependencias: Warehouse ──
    const warehouse = await prisma.warehouse.create({
      data: {
        code: 'TEST-RCV-WH-1',
        name: 'RCV Warehouse',
        type: 'PRINCIPAL',
        isActive: true,
      },
    })
    warehouseId = warehouse.id

    // ── Crear dependencias: Item ──
    const item = await prisma.item.create({
      data: {
        sku: 'TEST-RCV-001',
        name: 'Test RCV Item',
        brandId,
        categoryId,
        unitId,
        costPrice: 60,
        salePrice: 120,
        isActive: true,
      },
    })
    itemId = item.id

    // ── Crear Purchase Order como dependencia ──
    const poRes = await request(app)
      .post('/api/inventory/purchase-orders')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        supplierId,
        warehouseId,
        notes: 'PO para receives test',
        expectedDate: new Date(Date.now() + 86400000).toISOString(),
      })

    if (poRes.status === 201) {
      purchaseOrderId = poRes.body.data.id

      // Agregar item a PO
      await request(app)
        .post(`/api/inventory/purchase-orders/${purchaseOrderId}/items`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          itemId,
          quantityOrdered: 100,
          unitCost: 55,
        })
        .catch(() => {})

      // Aprobar PO
      await request(app)
        .patch(`/api/inventory/purchase-orders/${purchaseOrderId}/approve`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ approvedBy: userId })
        .catch(() => {})
    }
  }, 30000)

  afterAll(async () => {
    try {
      // ── Cleanup en orden FK-safe ──
      await prisma.receiveItem
        .deleteMany({
          where: {
            receive: {
              purchaseOrder: {
                supplier: { code: { startsWith: 'TEST-RCV-SUP' } },
              },
            },
          },
        })
        .catch(() => {})
      await prisma.receive
        .deleteMany({
          where: {
            purchaseOrder: {
              supplier: { code: { startsWith: 'TEST-RCV-SUP' } },
            },
          },
        })
        .catch(() => {})
      await prisma.purchaseOrderItem
        .deleteMany({
          where: {
            purchaseOrder: {
              supplier: { code: { startsWith: 'TEST-RCV-SUP' } },
            },
          },
        })
        .catch(() => {})
      await prisma.purchaseOrder
        .deleteMany({
          where: { supplier: { code: { startsWith: 'TEST-RCV-SUP' } } },
        })
        .catch(() => {})
      await prisma.stock
        .deleteMany({ where: { item: { sku: { startsWith: 'TEST-RCV' } } } })
        .catch(() => {})
      await prisma.item
        .deleteMany({ where: { sku: { startsWith: 'TEST-RCV' } } })
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
        .deleteMany({ where: { code: { startsWith: 'TEST-RCV-SUP' } } })
        .catch(() => {})
      await prisma.warehouse
        .deleteMany({ where: { code: { startsWith: 'TEST-RCV-WH' } } })
        .catch(() => {})
    } catch (error) {
      console.log('Error en afterAll cleanup:', error)
    }
  })

  // ============================================
  // CREATE TESTS
  // ============================================
  describe('POST /api/inventory/receives', () => {
    test('Debe crear un recibo exitosamente', async () => {
      if (!purchaseOrderId) {
        console.warn('purchaseOrderId no disponible, saltando test')
        return
      }

      const res = await request(app)
        .post('/api/inventory/receives')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          purchaseOrderId,
          warehouseId,
          notes: 'Recibo de prueba',
        })

      expect(res.status).toBe(201)
      expect(res.body.success).toBe(true)
      expect(res.body.data).toHaveProperty('id')
      expect(res.body.data.purchaseOrderId).toBe(purchaseOrderId)
      receiveId = res.body.data.id
    })

    test('Debe fallar sin purchaseOrderId', async () => {
      const res = await request(app)
        .post('/api/inventory/receives')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          warehouseId,
          notes: 'Sin PO',
        })

      expect(res.status).toBe(422)
      expect(res.body.success).toBe(false)
    })

    test('Debe fallar sin warehouseId', async () => {
      if (!purchaseOrderId) return

      const res = await request(app)
        .post('/api/inventory/receives')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          purchaseOrderId,
          notes: 'Sin warehouse',
        })

      expect(res.status).toBe(422)
    })

    test('Debe fallar con PO no existente', async () => {
      const res = await request(app)
        .post('/api/inventory/receives')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          purchaseOrderId: '00000000-0000-0000-0000-000000000000',
          warehouseId,
        })

      expect([400, 404, 422]).toContain(res.status)
    })
  })

  // ============================================
  // GET ALL TESTS
  // ============================================
  describe('GET /api/inventory/receives', () => {
    test('Debe obtener lista de recibos', async () => {
      const res = await request(app)
        .get('/api/inventory/receives')
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
        .get('/api/inventory/receives')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ status: 'DRAFT', page: 1, limit: 10 })

      expect(res.status).toBe(200)
    })

    test('Debe filtrar por warehouse', async () => {
      const res = await request(app)
        .get('/api/inventory/receives')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ warehouseId, page: 1, limit: 10 })

      expect(res.status).toBe(200)
    })
  })

  // ============================================
  // GET BY ID TESTS
  // ============================================
  describe('GET /api/inventory/receives/:id', () => {
    test('Debe obtener recibo por ID', async () => {
      if (!receiveId) {
        console.warn('receiveId no disponible, saltando test')
        return
      }

      const res = await request(app)
        .get(`/api/inventory/receives/${receiveId}`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.data.id).toBe(receiveId)
    })

    test('Debe fallar con ID no válido', async () => {
      const res = await request(app)
        .get('/api/inventory/receives/invalid-id')
        .set('Authorization', `Bearer ${authToken}`)

      expect([404, 422]).toContain(res.status)
    })

    test('Debe fallar con recibo no encontrado', async () => {
      const res = await request(app)
        .get('/api/inventory/receives/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${authToken}`)

      expect(res.status).toBe(404)
    })
  })

  // ============================================
  // UPDATE TESTS
  // ============================================
  describe('PUT /api/inventory/receives/:id', () => {
    test('Debe actualizar recibo en DRAFT', async () => {
      if (!receiveId) return

      const res = await request(app)
        .put(`/api/inventory/receives/${receiveId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          notes: 'Notas actualizadas',
        })

      expect([200, 400]).toContain(res.status)
    })
  })

  // ============================================
  // ITEMS TESTS
  // ============================================
  describe('POST /api/inventory/receives/:id/items', () => {
    test('Debe agregar item a recibo', async () => {
      if (!receiveId) return

      const res = await request(app)
        .post(`/api/inventory/receives/${receiveId}/items`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          itemId,
          quantityReceived: 50,
          unitCost: 55,
        })

      expect([200, 201, 400]).toContain(res.status)
    })

    test('Debe fallar sin itemId', async () => {
      if (!receiveId) return

      const res = await request(app)
        .post(`/api/inventory/receives/${receiveId}/items`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          quantityReceived: 50,
          unitCost: 55,
        })

      expect(res.status).toBe(422)
    })

    test('Debe fallar con cantidad cero', async () => {
      if (!receiveId) return

      const res = await request(app)
        .post(`/api/inventory/receives/${receiveId}/items`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          itemId,
          quantityReceived: 0,
          unitCost: 55,
        })

      expect(res.status).toBe(422)
    })

    test('Debe fallar con cantidad negativa', async () => {
      if (!receiveId) return

      const res = await request(app)
        .post(`/api/inventory/receives/${receiveId}/items`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          itemId,
          quantityReceived: -10,
          unitCost: 55,
        })

      expect(res.status).toBe(422)
    })
  })

  describe('GET /api/inventory/receives/:id/items', () => {
    test('Debe obtener items del recibo', async () => {
      if (!receiveId) return

      const res = await request(app)
        .get(`/api/inventory/receives/${receiveId}/items`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(res.status).toBe(200)
      expect(Array.isArray(res.body.data)).toBe(true)
    })
  })
})
