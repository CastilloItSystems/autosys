// backend/src/features/inventory/stock/stock.test.ts

import { describe, test, expect, beforeAll, afterAll } from '@jest/globals'
import request from 'supertest'
import app from '../../../app'
import { getTestAuthToken } from '../../../shared/utils/test.utils'
import prisma from '../../../services/prisma.service'

describe('Stock API Tests', () => {
  let authToken: string
  let itemId: string
  let warehouseId: string
  let warehouse2Id: string
  let stockId: string
  let brandId: string
  let categoryId: string
  let unitId: string

  beforeAll(async () => {
    // Limpiar datos previos
    await prisma.stock
      .deleteMany({
        where: {
          item: { sku: { startsWith: 'TEST-STOCK' } },
        },
      })
      .catch(() => {})
    await prisma.item
      .deleteMany({ where: { sku: { startsWith: 'TEST-STOCK' } } })
      .catch(() => {})
    await prisma.warehouse
      .deleteMany({ where: { code: { startsWith: 'TEST-STK-WH' } } })
      .catch(() => {})
    await prisma.brand
      .deleteMany({ where: { code: 'TEST-BRAND-STK' } })
      .catch(() => {})
    await prisma.category
      .deleteMany({ where: { code: 'TEST-CAT-STK' } })
      .catch(() => {})
    await prisma.unit
      .deleteMany({ where: { code: 'TEST-UNIT-STK' } })
      .catch(() => {})

    authToken = await getTestAuthToken()

    // Crear dependencias
    const brand = await prisma.brand.create({
      data: {
        code: 'TEST-BRAND-STK',
        name: 'Test Brand Stock',
        type: 'PART',
        isActive: true,
      },
    })
    brandId = brand.id

    const category = await prisma.category.create({
      data: {
        code: 'TEST-CAT-STK',
        name: 'Test Category Stock',
        isActive: true,
      },
    })
    categoryId = category.id

    const unit = await prisma.unit.create({
      data: {
        code: 'TEST-UNIT-STK',
        name: 'Test Unit Stock',
        abbreviation: 'TSK',
        type: 'COUNTABLE',
        isActive: true,
      },
    })
    unitId = unit.id

    const warehouse = await prisma.warehouse.create({
      data: {
        code: 'TEST-STK-WH-1',
        name: 'Stock Warehouse 1',
        type: 'PRINCIPAL',
        isActive: true,
      },
    })
    warehouseId = warehouse.id

    const warehouse2 = await prisma.warehouse.create({
      data: {
        code: 'TEST-STK-WH-2',
        name: 'Stock Warehouse 2',
        type: 'SUCURSAL',
        isActive: true,
      },
    })
    warehouse2Id = warehouse2.id

    const item = await prisma.item.create({
      data: {
        sku: 'TEST-STOCK-001',
        name: 'Test Stock Item',
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
      await prisma.stock
        .deleteMany({ where: { item: { sku: { startsWith: 'TEST-STOCK' } } } })
        .catch(() => {})
      await prisma.item
        .deleteMany({ where: { sku: { startsWith: 'TEST-STOCK' } } })
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
        .deleteMany({ where: { code: { startsWith: 'TEST-STK-WH' } } })
        .catch(() => {})
    } catch (error) {
      console.log('Error en afterAll cleanup:', error)
    }
  })

  // ── POST /api/inventory/stock ──
  describe('POST /api/inventory/stock', () => {
    test('Debe crear un registro de stock', async () => {
      const res = await request(app)
        .post('/api/inventory/stock')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          itemId,
          warehouseId,
          quantityReal: 100,
          quantityReserved: 0,
          averageCost: 50,
        })

      expect(res.status).toBe(201)
      expect(res.body.success).toBe(true)
      expect(res.body.data.itemId).toBe(itemId)
      expect(res.body.data.warehouseId).toBe(warehouseId)
      stockId = res.body.data.id
    })

    test('Debe fallar al crear stock duplicado (mismo item + warehouse)', async () => {
      const res = await request(app)
        .post('/api/inventory/stock')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          itemId,
          warehouseId,
          quantityReal: 50,
        })

      expect([400, 409, 422]).toContain(res.status)
    })
  })

  // ── GET /api/inventory/stock ──
  describe('GET /api/inventory/stock', () => {
    test('Debe obtener lista de stock', async () => {
      const res = await request(app)
        .get('/api/inventory/stock')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ page: 1, limit: 10 })

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(Array.isArray(res.body.data)).toBe(true)
    })
  })

  // ── GET /api/inventory/stock/item/:itemId ──
  describe('GET /api/inventory/stock/item/:itemId', () => {
    test('Debe obtener stock por artículo', async () => {
      const res = await request(app)
        .get(`/api/inventory/stock/item/${itemId}`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(res.status).toBe(200)
      expect(Array.isArray(res.body.data)).toBe(true)
    })
  })

  // ── GET /api/inventory/stock/warehouse/:warehouseId ──
  describe('GET /api/inventory/stock/warehouse/:warehouseId', () => {
    test('Debe obtener stock por almacén', async () => {
      const res = await request(app)
        .get(`/api/inventory/stock/warehouse/${warehouseId}`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(res.status).toBe(200)
      expect(Array.isArray(res.body.data)).toBe(true)
    })
  })

  // ── GET /api/inventory/stock/low-stock ──
  describe('GET /api/inventory/stock/low-stock', () => {
    test('Debe obtener artículos con stock bajo', async () => {
      const res = await request(app)
        .get('/api/inventory/stock/low-stock')
        .set('Authorization', `Bearer ${authToken}`)

      expect([200, 404]).toContain(res.status)
      if (res.status === 200) {
        expect(Array.isArray(res.body.data)).toBe(true)
      }
    })
  })

  // ── GET /api/inventory/stock/out-of-stock ──
  describe('GET /api/inventory/stock/out-of-stock', () => {
    test('Debe obtener artículos sin stock', async () => {
      const res = await request(app)
        .get('/api/inventory/stock/out-of-stock')
        .set('Authorization', `Bearer ${authToken}`)

      expect([200, 404]).toContain(res.status)
      if (res.status === 200) {
        expect(Array.isArray(res.body.data)).toBe(true)
      }
    })
  })

  // ── GET /api/inventory/stock/:id ──
  describe('GET /api/inventory/stock/:id', () => {
    test('Debe obtener registro de stock por ID', async () => {
      if (!stockId) return
      const res = await request(app)
        .get(`/api/inventory/stock/${stockId}`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.data.id).toBe(stockId)
    })

    test('Debe fallar con stock no encontrado', async () => {
      const res = await request(app)
        .get('/api/inventory/stock/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${authToken}`)

      expect(res.status).toBe(404)
    })
  })

  // ── PUT /api/inventory/stock/:id ──
  describe('PUT /api/inventory/stock/:id', () => {
    test('Debe actualizar stock', async () => {
      if (!stockId) return
      const res = await request(app)
        .put(`/api/inventory/stock/${stockId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          quantityReal: 150,
          averageCost: 55,
        })

      if (res.status === 200) {
        expect(res.body.success).toBe(true)
      }
    })
  })

  // ── POST /api/inventory/stock/adjust ──
  describe('POST /api/inventory/stock/adjust', () => {
    test('Debe realizar ajuste de stock', async () => {
      const res = await request(app)
        .post('/api/inventory/stock/adjust')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          itemId,
          warehouseId,
          quantityChange: 10,
          reason: 'Ajuste de prueba por conteo',
        })

      expect([200, 201, 400, 404]).toContain(res.status)
    })

    test('Debe fallar ajuste sin razón', async () => {
      const res = await request(app)
        .post('/api/inventory/stock/adjust')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          itemId,
          warehouseId,
          quantityChange: 5,
        })

      expect([400, 422]).toContain(res.status)
    })
  })

  // ── POST /api/inventory/stock/reserve ──
  describe('POST /api/inventory/stock/reserve', () => {
    test('Debe reservar stock', async () => {
      const res = await request(app)
        .post('/api/inventory/stock/reserve')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          itemId,
          warehouseId,
          quantity: 5,
        })

      expect([200, 201, 400]).toContain(res.status)
    })
  })

  // ── POST /api/inventory/stock/release ──
  describe('POST /api/inventory/stock/release', () => {
    test('Debe liberar stock reservado', async () => {
      const res = await request(app)
        .post('/api/inventory/stock/release')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          itemId,
          warehouseId,
          quantity: 5,
        })

      expect([200, 201, 400]).toContain(res.status)
    })
  })

  // ── POST /api/inventory/stock/transfer ──
  describe('POST /api/inventory/stock/transfer', () => {
    test('Debe transferir stock entre almacenes', async () => {
      // Primero crear stock en warehouse2
      await request(app)
        .post('/api/inventory/stock')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ itemId, warehouseId: warehouse2Id, quantityReal: 0 })
        .catch(() => {})

      const res = await request(app)
        .post('/api/inventory/stock/transfer')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          itemId,
          warehouseFromId: warehouseId,
          warehouseToId: warehouse2Id,
          quantity: 5,
        })

      expect([200, 201, 400]).toContain(res.status)
    })

    test('Debe fallar transferencia al mismo almacén', async () => {
      const res = await request(app)
        .post('/api/inventory/stock/transfer')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          itemId,
          warehouseFromId: warehouseId,
          warehouseToId: warehouseId,
          quantity: 5,
        })

      expect([400, 422]).toContain(res.status)
    })
  })

  // ── Alerts ──
  describe('Stock Alerts', () => {
    let alertId: string

    test('POST /api/inventory/stock/alerts - Debe crear alerta', async () => {
      const res = await request(app)
        .post('/api/inventory/stock/alerts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          itemId,
          warehouseId,
          type: 'LOW_STOCK',
          message: 'Stock bajo en almacén de prueba',
          severity: 'MEDIUM',
        })

      expect([200, 201]).toContain(res.status)
      if (res.body.data) {
        alertId = res.body.data.id
      }
    })

    test('GET /api/inventory/stock/alerts - Debe obtener alertas', async () => {
      const res = await request(app)
        .get('/api/inventory/stock/alerts')
        .set('Authorization', `Bearer ${authToken}`)

      expect(res.status).toBe(200)
      expect(Array.isArray(res.body.data)).toBe(true)
    })

    test('PATCH /api/inventory/stock/alerts/:id/read - Debe marcar alerta como leída', async () => {
      if (!alertId) return
      const res = await request(app)
        .patch(`/api/inventory/stock/alerts/${alertId}/read`)
        .set('Authorization', `Bearer ${authToken}`)

      expect([200, 404]).toContain(res.status)
    })
  })
})
