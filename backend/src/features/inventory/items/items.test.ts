// backend/src/features/inventory/items/items.test.ts

import { describe, test, expect, beforeAll, afterAll } from '@jest/globals'
import request from 'supertest'
import app from '../../../app.js'
import { getTestCredentials } from '../../../shared/utils/test.utils.js'
import prisma from '../../../services/prisma.service.js'

describe('Items API Tests', () => {
  let authToken: string
  let empresaId: string
  let brandId: string
  let categoryId: string
  let unitId: string
  let itemId: string
  const testSKU = 'TEST-SKU-001'
  const createTestSKU = 'TEST-SKU-CREATE'
  const testBarcode = 'TEST-BC-001'

  beforeAll(async () => {
    const creds = await getTestCredentials()
    authToken = creds.authToken
    empresaId = creds.empresaId

    // Limpiar datos de prueba anteriores
    await prisma.item
      .deleteMany({
        where: { empresaId, sku: { startsWith: 'TEST' } },
      })
      .catch(() => {})
    await prisma.item
      .deleteMany({
        where: { empresaId, sku: { startsWith: 'BULK' } },
      })
      .catch(() => {})
    await prisma.item
      .deleteMany({
        where: { empresaId, sku: { startsWith: 'HARD' } },
      })
      .catch(() => {})
    await prisma.item
      .deleteMany({
        where: { empresaId, sku: { startsWith: 'UNIQUE' } },
      })
      .catch(() => {})
    await prisma.item
      .deleteMany({
        where: { empresaId, sku: 'DUPLICATED-SKU-001' },
      })
      .catch(() => {})

    await prisma.brand
      .deleteMany({ where: { empresaId, code: 'TESTBRAND' } })
      .catch(() => {})
    await prisma.category
      .deleteMany({ where: { empresaId, code: 'TESTCAT' } })
      .catch(() => {})
    await prisma.unit
      .deleteMany({ where: { empresaId, code: 'TESTUNIT' } })
      .catch(() => {})

    // Crear datos de prueba con empresaId
    const brand = await prisma.brand.create({
      data: {
        empresaId,
        code: 'TESTBRAND',
        name: 'Test Brand',
        type: 'PART',
        isActive: true,
      },
    })
    brandId = brand.id

    const category = await prisma.category.create({
      data: {
        empresaId,
        code: 'TESTCAT',
        name: 'Test Category',
        isActive: true,
      },
    })
    categoryId = category.id

    const unit = await prisma.unit.create({
      data: {
        empresaId,
        code: 'TESTUNIT',
        name: 'Test Unit',
        abbreviation: 'TU',
        type: 'COUNTABLE',
        isActive: true,
      },
    })
    unitId = unit.id

    // Item base en DB para tests de lectura
    const item = await prisma.item.create({
      data: {
        empresaId,
        sku: testSKU,
        code: testSKU,
        barcode: testBarcode,
        name: 'Test Item',
        description: 'Item de prueba',
        brandId,
        categoryId,
        unitId,
        costPrice: 100,
        salePrice: 150,
        minStock: 10,
        maxStock: 100,
        reorderPoint: 20,
        isActive: true,
        isSerialized: false,
        hasBatch: false,
        hasExpiry: false,
        allowNegativeStock: false,
        tags: [],
      },
    })
    itemId = item.id
  }, 30000)

  afterAll(async () => {
    await prisma.item
      .deleteMany({ where: { empresaId, sku: { startsWith: 'TEST' } } })
      .catch(() => {})
    await prisma.item
      .deleteMany({ where: { empresaId, sku: { startsWith: 'BULK' } } })
      .catch(() => {})
    await prisma.item
      .deleteMany({ where: { empresaId, sku: { startsWith: 'HARD' } } })
      .catch(() => {})
    await prisma.item
      .deleteMany({ where: { empresaId, sku: { startsWith: 'UNIQUE' } } })
      .catch(() => {})
    await prisma.item
      .deleteMany({ where: { empresaId, sku: 'DUPLICATED-SKU-001' } })
      .catch(() => {})
    await prisma.brand
      .deleteMany({ where: { empresaId, code: 'TESTBRAND' } })
      .catch(() => {})
    await prisma.category
      .deleteMany({ where: { empresaId, code: 'TESTCAT' } })
      .catch(() => {})
    await prisma.unit
      .deleteMany({ where: { empresaId, code: 'TESTUNIT' } })
      .catch(() => {})
  })

  // ---------------------------------------------------------------------------
  // POST /
  // ---------------------------------------------------------------------------

  describe('POST /api/inventory/items', () => {
    test('Debe crear un artículo exitosamente', async () => {
      const res = await request(app)
        .post('/api/inventory/items')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Empresa-Id', empresaId)
        .send({
          sku: createTestSKU,
          code: createTestSKU,
          barcode: 'UNIQUE-CREATE-BC',
          name: 'Test Item',
          description: 'Item de prueba',
          brandId,
          categoryId,
          unitId,
          costPrice: 100.0,
          salePrice: 150.0,
          minStock: 5,
          maxStock: 100,
          reorderPoint: 15,
          isActive: true,
          isSerialized: false,
          hasBatch: false,
          hasExpiry: false,
          allowNegativeStock: false,
        })

      expect(res.status).toBe(201)
      expect(res.body.success).toBe(true)
      expect(res.body.data.sku).toBe(createTestSKU)
      expect(res.body.data.name).toBe('Test Item')
      itemId = res.body.data.id
    })

    test('Debe fallar con SKU duplicado', async () => {
      const res = await request(app)
        .post('/api/inventory/items')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Empresa-Id', empresaId)
        .send({
          sku: testSKU,
          code: testSKU,
          barcode: 'UNIQUE-BC-002',
          name: 'Another Item',
          brandId,
          categoryId,
          unitId,
          costPrice: 100,
          salePrice: 150,
          minStock: 10,
          reorderPoint: 20,
        })

      expect(res.status).toBe(409)
      expect(res.body.success).toBe(false)
    })

    test('Debe fallar con marca inexistente', async () => {
      const res = await request(app)
        .post('/api/inventory/items')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Empresa-Id', empresaId)
        .send({
          sku: 'UNIQUE-SKU-002',
          code: 'UNIQUE-SKU-002',
          name: 'Test Item',
          brandId: '00000000-0000-0000-0000-000000000000',
          categoryId,
          unitId,
          costPrice: 100,
          salePrice: 150,
          minStock: 10,
          reorderPoint: 20,
        })

      expect(res.status).toBe(404)
      expect(res.body.success).toBe(false)
    })

    test('Debe fallar con validación incorrecta', async () => {
      const res = await request(app)
        .post('/api/inventory/items')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Empresa-Id', empresaId)
        .send({
          sku: '',
          code: '',
          name: '',
          brandId,
          categoryId,
          unitId,
          costPrice: -100,
          salePrice: 150,
        })

      expect(res.status).toBe(422)
      expect(res.body.success).toBe(false)
    })
  })

  // ---------------------------------------------------------------------------
  // GET /
  // ---------------------------------------------------------------------------

  describe('GET /api/inventory/items', () => {
    test('Debe obtener lista de artículos', async () => {
      const res = await request(app)
        .get('/api/inventory/items')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Empresa-Id', empresaId)
        .query({ page: 1, limit: 10 })

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(Array.isArray(res.body.data)).toBe(true)
      expect(res.body.meta).toBeDefined()
    })

    test('Debe filtrar artículos por marca', async () => {
      const res = await request(app)
        .get('/api/inventory/items')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Empresa-Id', empresaId)
        .query({ brandId, page: 1, limit: 10 })

      expect(res.status).toBe(200)
      expect(Array.isArray(res.body.data)).toBe(true)
    })

    test('Debe filtrar artículos por categoría', async () => {
      const res = await request(app)
        .get('/api/inventory/items')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Empresa-Id', empresaId)
        .query({ categoryId, page: 1, limit: 10 })

      expect(res.status).toBe(200)
      expect(Array.isArray(res.body.data)).toBe(true)
    })
  })

  // ---------------------------------------------------------------------------
  // GET /active
  // ---------------------------------------------------------------------------

  describe('GET /api/inventory/items/active', () => {
    test('Debe obtener solo artículos activos', async () => {
      const res = await request(app)
        .get('/api/inventory/items/active')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Empresa-Id', empresaId)

      expect(res.status).toBe(200)
      expect(Array.isArray(res.body.data)).toBe(true)
    })
  })

  // ---------------------------------------------------------------------------
  // GET /search
  // ---------------------------------------------------------------------------

  describe('GET /api/inventory/items/search', () => {
    test('Debe buscar artículos por término', async () => {
      const res = await request(app)
        .get('/api/inventory/items/search')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Empresa-Id', empresaId)
        .query({ term: 'Test' })

      expect(res.status).toBe(200)
      expect(Array.isArray(res.body.data)).toBe(true)
    })

    test('Debe fallar sin término de búsqueda', async () => {
      const res = await request(app)
        .get('/api/inventory/items/search')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Empresa-Id', empresaId)

      expect(res.status).toBe(400)
    })
  })

  // ---------------------------------------------------------------------------
  // GET /low-stock, /out-of-stock
  // ---------------------------------------------------------------------------

  describe('GET /api/inventory/items/low-stock', () => {
    test('Debe obtener artículos con stock bajo', async () => {
      const res = await request(app)
        .get('/api/inventory/items/low-stock')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Empresa-Id', empresaId)

      expect(res.status).toBe(200)
      expect(Array.isArray(res.body.data)).toBe(true)
    })
  })

  describe('GET /api/inventory/items/out-of-stock', () => {
    test('Debe obtener artículos sin stock', async () => {
      const res = await request(app)
        .get('/api/inventory/items/out-of-stock')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Empresa-Id', empresaId)

      expect(res.status).toBe(200)
      expect(Array.isArray(res.body.data)).toBe(true)
    })
  })

  // ---------------------------------------------------------------------------
  // GET /category/:categoryId
  // ---------------------------------------------------------------------------

  describe('GET /api/inventory/items/category/:categoryId', () => {
    test('Debe obtener artículos de una categoría', async () => {
      const res = await request(app)
        .get(`/api/inventory/items/category/${categoryId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Empresa-Id', empresaId)

      expect(res.status).toBe(200)
      expect(Array.isArray(res.body.data)).toBe(true)
    })

    test('Debe fallar con categoría inexistente', async () => {
      const res = await request(app)
        .get(
          '/api/inventory/items/category/00000000-0000-0000-0000-000000000000'
        )
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Empresa-Id', empresaId)

      expect(res.status).toBe(404)
    })
  })

  // ---------------------------------------------------------------------------
  // GET /sku/:sku, /barcode/:barcode
  // ---------------------------------------------------------------------------

  describe('GET /api/inventory/items/sku/:sku', () => {
    test('Debe obtener artículo por SKU', async () => {
      const res = await request(app)
        .get(`/api/inventory/items/sku/${testSKU}`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Empresa-Id', empresaId)

      expect(res.status).toBe(200)
      expect(res.body.data.sku).toBe(testSKU)
    })

    test('Debe retornar 404 con SKU inexistente', async () => {
      const res = await request(app)
        .get('/api/inventory/items/sku/NONEXISTENT-SKU')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Empresa-Id', empresaId)

      expect(res.status).toBe(404)
    })
  })

  describe('GET /api/inventory/items/barcode/:barcode', () => {
    test('Debe obtener artículo por código de barras', async () => {
      const res = await request(app)
        .get(`/api/inventory/items/barcode/${testBarcode}`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Empresa-Id', empresaId)

      expect(res.status).toBe(200)
      expect(res.body.data.barcode).toBe(testBarcode)
    })

    test('Debe retornar 404 con barcode inexistente', async () => {
      const res = await request(app)
        .get('/api/inventory/items/barcode/NONEXISTENT-BC')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Empresa-Id', empresaId)

      expect(res.status).toBe(404)
    })
  })

  // ---------------------------------------------------------------------------
  // GET /:id
  // ---------------------------------------------------------------------------

  describe('GET /api/inventory/items/:id', () => {
    test('Debe obtener artículo por ID', async () => {
      const res = await request(app)
        .get(`/api/inventory/items/${itemId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Empresa-Id', empresaId)

      expect(res.status).toBe(200)
      expect(res.body.data.id).toBe(itemId)
    })

    test('Debe retornar 422 con ID inválido', async () => {
      const res = await request(app)
        .get('/api/inventory/items/invalid-id')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Empresa-Id', empresaId)

      expect(res.status).toBe(422)
    })

    test('Debe retornar 404 con artículo inexistente', async () => {
      const res = await request(app)
        .get('/api/inventory/items/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Empresa-Id', empresaId)

      expect(res.status).toBe(404)
    })
  })

  // ---------------------------------------------------------------------------
  // GET /:id/stats, /:id/history, /:id/related
  // ---------------------------------------------------------------------------

  describe('GET /api/inventory/items/:id/stats', () => {
    test('Debe obtener estadísticas del artículo', async () => {
      const res = await request(app)
        .get(`/api/inventory/items/${itemId}/stats`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Empresa-Id', empresaId)

      expect(res.status).toBe(200)
      expect(res.body.data.stock).toBeDefined()
      expect(res.body.data.pricing).toBeDefined()
    })
  })

  describe('GET /api/inventory/items/:id/history', () => {
    test('Debe obtener historial del artículo', async () => {
      const res = await request(app)
        .get(`/api/inventory/items/${itemId}/history`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Empresa-Id', empresaId)

      expect(res.status).toBe(200)
      expect(Array.isArray(res.body.data)).toBe(true)
    })
  })

  describe('GET /api/inventory/items/:id/related', () => {
    test('Debe obtener artículos relacionados', async () => {
      const res = await request(app)
        .get(`/api/inventory/items/${itemId}/related`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Empresa-Id', empresaId)

      expect(res.status).toBe(200)
      expect(Array.isArray(res.body.data)).toBe(true)
    })
  })

  // ---------------------------------------------------------------------------
  // PUT /:id
  // ---------------------------------------------------------------------------

  describe('PUT /api/inventory/items/:id', () => {
    test('Debe actualizar nombre del artículo', async () => {
      const res = await request(app)
        .put(`/api/inventory/items/${itemId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Empresa-Id', empresaId)
        .send({ name: 'Updated Item Name', description: 'Updated description' })

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.data.name).toBe('Updated Item Name')
    })
  })

  // ---------------------------------------------------------------------------
  // PUT /:id/pricing
  // ---------------------------------------------------------------------------

  describe('PUT /api/inventory/items/:id/pricing', () => {
    test('Debe actualizar precios del artículo', async () => {
      const res = await request(app)
        .put(`/api/inventory/items/${itemId}/pricing`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Empresa-Id', empresaId)
        .send({ costPrice: 120, salePrice: 180, wholesalePrice: 160 })

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
    })
  })

  // ---------------------------------------------------------------------------
  // PATCH /:id/toggle
  // ---------------------------------------------------------------------------

  describe('PATCH /api/inventory/items/:id/toggle', () => {
    test('Debe cambiar estado activo/inactivo', async () => {
      const res = await request(app)
        .patch(`/api/inventory/items/${itemId}/toggle`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Empresa-Id', empresaId)

      expect(res.status).toBe(200)
      expect(res.body.data.isActive).toBeDefined()
    })
  })

  // ---------------------------------------------------------------------------
  // POST /generate-sku, /check-availability, /:id/duplicate
  // ---------------------------------------------------------------------------

  describe('POST /api/inventory/items/generate-sku', () => {
    test('Debe generar SKU automático', async () => {
      const res = await request(app)
        .post('/api/inventory/items/generate-sku')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Empresa-Id', empresaId)
        .send({ categoryCode: 'CAT', brandCode: 'BRD' })

      expect(res.status).toBe(200)
      expect(res.body.data.sku).toBeDefined()
      expect(typeof res.body.data.sku).toBe('string')
    })
  })

  describe('POST /api/inventory/items/check-availability', () => {
    test('Debe verificar disponibilidad', async () => {
      const res = await request(app)
        .post('/api/inventory/items/check-availability')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Empresa-Id', empresaId)
        .send({
          items: [
            {
              itemId,
              quantity: 1,
              warehouseId: '00000000-0000-0000-0000-000000000001',
            },
          ],
        })

      expect(res.status).toBe(200)
      expect(res.body.data.available).toBeDefined()
      expect(Array.isArray(res.body.data.details)).toBe(true)
    })
  })

  describe('POST /api/inventory/items/:id/duplicate', () => {
    test('Debe duplicar un artículo', async () => {
      const res = await request(app)
        .post(`/api/inventory/items/${itemId}/duplicate`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Empresa-Id', empresaId)
        .send({ newSku: 'DUPLICATED-SKU-001' })

      expect(res.status).toBe(201)
      expect(res.body.data.sku).toBe('DUPLICATED-SKU-001')
    })

    test('Debe fallar duplicar artículo inexistente', async () => {
      const res = await request(app)
        .post(
          '/api/inventory/items/00000000-0000-0000-0000-000000000000/duplicate'
        )
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Empresa-Id', empresaId)
        .send({ newSku: 'UNIQUE-DUP-SKU' })

      expect(res.status).toBe(404)
    })
  })

  // ---------------------------------------------------------------------------
  // POST /bulk, PUT /bulk-update
  // ---------------------------------------------------------------------------

  describe('POST /api/inventory/items/bulk', () => {
    test('Debe crear múltiples artículos', async () => {
      const res = await request(app)
        .post('/api/inventory/items/bulk')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Empresa-Id', empresaId)
        .send({
          items: [
            {
              sku: 'BULK-SKU-001',
              name: 'Bulk Item 1',
              brandId,
              categoryId,
              unitId,
              costPrice: 50,
              salePrice: 75,
              minStock: 5,
              reorderPoint: 10,
            },
            {
              sku: 'BULK-SKU-002',
              name: 'Bulk Item 2',
              brandId,
              categoryId,
              unitId,
              costPrice: 60,
              salePrice: 90,
              minStock: 5,
              reorderPoint: 10,
            },
          ],
        })

      expect(res.status).toBe(200)
      expect(res.body.data.success).toBeDefined()
      expect(Array.isArray(res.body.data.success)).toBe(true)
    })
  })

  describe('PUT /api/inventory/items/bulk-update', () => {
    test('Debe actualizar múltiples artículos', async () => {
      const res = await request(app)
        .put('/api/inventory/items/bulk-update')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Empresa-Id', empresaId)
        .send({ itemIds: [itemId], updates: { isActive: true } })

      expect(res.status).toBe(200)
      expect(res.body.data.success).toBeDefined()
    })
  })

  // ---------------------------------------------------------------------------
  // DELETE /:id, /:id/hard
  // ---------------------------------------------------------------------------

  describe('DELETE /api/inventory/items/:id', () => {
    test('Debe retornar 404 con artículo inexistente', async () => {
      const res = await request(app)
        .delete('/api/inventory/items/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Empresa-Id', empresaId)

      expect(res.status).toBe(404)
    })
  })

  describe('DELETE /api/inventory/items/:id/hard', () => {
    test('Debe eliminar permanentemente artículo sin stock ni movimientos', async () => {
      const createRes = await request(app)
        .post('/api/inventory/items')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Empresa-Id', empresaId)
        .send({
          sku: 'HARD-DELETE-SKU',
          name: 'Item to Hard Delete',
          brandId,
          categoryId,
          unitId,
          costPrice: 100,
          salePrice: 150,
          minStock: 10,
          reorderPoint: 20,
        })

      expect(createRes.status).toBe(201)

      const res = await request(app)
        .delete(`/api/inventory/items/${createRes.body.data.id}/hard`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Empresa-Id', empresaId)

      expect(res.status).toBe(200)
    })

    test('Debe retornar 404 con artículo inexistente', async () => {
      const res = await request(app)
        .delete(
          '/api/inventory/items/00000000-0000-0000-0000-000000000000/hard'
        )
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Empresa-Id', empresaId)

      expect(res.status).toBe(404)
    })
  })
})
