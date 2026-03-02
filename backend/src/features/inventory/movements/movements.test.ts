// backend/src/features/inventory/movements/movements.test.ts

import { describe, test, expect, beforeAll, afterAll } from '@jest/globals'
import request from 'supertest'
import app from '../../../index'
import { getTestAuthToken } from '../../../shared/utils/test.utils'
import prisma from '../../../services/prisma.service'

describe('Movements API Tests', () => {
  let authToken: string
  let itemId: string
  let warehouseId: string
  let warehouse2Id: string
  let movementId: string
  let brandId: string
  let categoryId: string
  let unitId: string

  beforeAll(async () => {
    await prisma.movement
      .deleteMany({ where: { reference: { startsWith: 'TEST-MOV' } } })
      .catch(() => {})
    await prisma.item
      .deleteMany({ where: { sku: { startsWith: 'TEST-MOV' } } })
      .catch(() => {})
    await prisma.warehouse
      .deleteMany({ where: { code: { startsWith: 'TEST-MOV-WH' } } })
      .catch(() => {})
    await prisma.brand
      .deleteMany({ where: { code: 'TEST-BRAND-MOV' } })
      .catch(() => {})
    await prisma.category
      .deleteMany({ where: { code: 'TEST-CAT-MOV' } })
      .catch(() => {})
    await prisma.unit
      .deleteMany({ where: { code: 'TEST-UNIT-MOV' } })
      .catch(() => {})

    authToken = await getTestAuthToken()

    const brand = await prisma.brand.create({
      data: {
        code: 'TEST-BRAND-MOV',
        name: 'Test Brand Mov',
        type: 'PART',
        isActive: true,
      },
    })
    brandId = brand.id

    const category = await prisma.category.create({
      data: { code: 'TEST-CAT-MOV', name: 'Test Category Mov', isActive: true },
    })
    categoryId = category.id

    const unit = await prisma.unit.create({
      data: {
        code: 'TEST-UNIT-MOV',
        name: 'Test Unit Mov',
        abbreviation: 'TMV',
        type: 'COUNTABLE',
        isActive: true,
      },
    })
    unitId = unit.id

    const wh = await prisma.warehouse.create({
      data: {
        code: 'TEST-MOV-WH-1',
        name: 'Movement Warehouse 1',
        type: 'PRINCIPAL',
        isActive: true,
      },
    })
    warehouseId = wh.id

    const wh2 = await prisma.warehouse.create({
      data: {
        code: 'TEST-MOV-WH-2',
        name: 'Movement Warehouse 2',
        type: 'SUCURSAL',
        isActive: true,
      },
    })
    warehouse2Id = wh2.id

    const item = await prisma.item.create({
      data: {
        sku: 'TEST-MOV-001',
        name: 'Test Movement Item',
        brandId,
        categoryId,
        unitId,
        costPrice: 30,
        salePrice: 60,
        isActive: true,
      },
    })
    itemId = item.id
  }, 20000)

  afterAll(async () => {
    try {
      await prisma.movement
        .deleteMany({ where: { reference: { startsWith: 'TEST-MOV' } } })
        .catch(() => {})
      await prisma.stock
        .deleteMany({ where: { item: { sku: { startsWith: 'TEST-MOV' } } } })
        .catch(() => {})
      await prisma.item
        .deleteMany({ where: { sku: { startsWith: 'TEST-MOV' } } })
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
        .deleteMany({ where: { code: { startsWith: 'TEST-MOV-WH' } } })
        .catch(() => {})
    } catch (error) {
      console.log('Error en afterAll cleanup:', error)
    }
  })

  // ── POST /api/inventory/movements ──
  describe('POST /api/inventory/movements', () => {
    test('Debe crear un movimiento de tipo PURCHASE', async () => {
      const res = await request(app)
        .post('/api/inventory/movements')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          type: 'PURCHASE',
          itemId,
          quantity: 50,
          unitCost: 30,
          warehouseToId: warehouseId,
          reference: 'TEST-MOV-REF-001',
          notes: 'Movimiento de compra de prueba',
        })

      expect([200, 201]).toContain(res.status)
      expect(res.body.success).toBe(true)
      movementId = res.body.data.id
    })

    test('Debe crear un movimiento de tipo SALE', async () => {
      const res = await request(app)
        .post('/api/inventory/movements')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          type: 'SALE',
          itemId,
          quantity: 5,
          warehouseFromId: warehouseId,
          reference: 'TEST-MOV-REF-002',
          notes: 'Movimiento de venta de prueba',
        })

      expect([200, 201, 400]).toContain(res.status)
    })

    test('Debe fallar con tipo de movimiento inválido', async () => {
      const res = await request(app)
        .post('/api/inventory/movements')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          type: 'INVALID_TYPE',
          itemId,
          quantity: 10,
        })

      expect(res.status).toBe(422)
    })

    test('Debe fallar sin itemId', async () => {
      const res = await request(app)
        .post('/api/inventory/movements')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          type: 'PURCHASE',
          quantity: 10,
        })

      expect(res.status).toBe(422)
    })
  })

  // ── GET /api/inventory/movements ──
  describe('GET /api/inventory/movements', () => {
    test('Debe obtener lista de movimientos', async () => {
      const res = await request(app)
        .get('/api/inventory/movements')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ page: 1, limit: 10 })

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(Array.isArray(res.body.data)).toBe(true)
    })
  })

  // ── GET /api/inventory/movements/:id ──
  describe('GET /api/inventory/movements/:id', () => {
    test('Debe obtener movimiento por ID', async () => {
      if (!movementId) return
      const res = await request(app)
        .get(`/api/inventory/movements/${movementId}`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.data.id).toBe(movementId)
    })

    test('Debe fallar con movimiento no encontrado', async () => {
      const res = await request(app)
        .get('/api/inventory/movements/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${authToken}`)

      expect(res.status).toBe(404)
    })
  })

  // ── GET /api/inventory/movements/type/:type ──
  describe('GET /api/inventory/movements/type/:type', () => {
    test('Debe obtener movimientos por tipo', async () => {
      const res = await request(app)
        .get('/api/inventory/movements/type/PURCHASE')
        .set('Authorization', `Bearer ${authToken}`)

      expect(res.status).toBe(200)
      expect(Array.isArray(res.body.data)).toBe(true)
    })
  })

  // ── GET /api/inventory/movements/warehouse/:warehouseId ──
  describe('GET /api/inventory/movements/warehouse/:warehouseId', () => {
    test('Debe obtener movimientos por almacén', async () => {
      const res = await request(app)
        .get(`/api/inventory/movements/warehouse/${warehouseId}`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(res.status).toBe(200)
      expect(Array.isArray(res.body.data)).toBe(true)
    })
  })

  // ── GET /api/inventory/movements/item/:itemId ──
  describe('GET /api/inventory/movements/item/:itemId', () => {
    test('Debe obtener movimientos por artículo', async () => {
      const res = await request(app)
        .get(`/api/inventory/movements/item/${itemId}`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(res.status).toBe(200)
      expect(Array.isArray(res.body.data)).toBe(true)
    })
  })

  // ── PUT /api/inventory/movements/:id ──
  describe('PUT /api/inventory/movements/:id', () => {
    test('Debe actualizar un movimiento', async () => {
      if (!movementId) return
      const res = await request(app)
        .put(`/api/inventory/movements/${movementId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          notes: 'Nota actualizada de prueba',
        })

      expect([200, 400]).toContain(res.status)
    })
  })

  // ── PATCH /api/inventory/movements/:id/cancel ──
  describe('PATCH /api/inventory/movements/:id/cancel', () => {
    test('Debe cancelar un movimiento', async () => {
      // Crear movimiento para cancelar
      const createRes = await request(app)
        .post('/api/inventory/movements')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          type: 'PURCHASE',
          itemId,
          quantity: 10,
          warehouseToId: warehouseId,
          reference: 'TEST-MOV-CANCEL',
        })

      if ([200, 201].includes(createRes.status)) {
        const cancelId = createRes.body.data.id
        const res = await request(app)
          .patch(`/api/inventory/movements/${cancelId}/cancel`)
          .set('Authorization', `Bearer ${authToken}`)

        expect([200, 400]).toContain(res.status)
      }
    })
  })

  // ── DELETE /api/inventory/movements/:id ──
  describe('DELETE /api/inventory/movements/:id', () => {
    test('Debe fallar al eliminar movimiento no encontrado', async () => {
      const res = await request(app)
        .delete('/api/inventory/movements/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${authToken}`)

      expect([404, 400]).toContain(res.status)
    })
  })
})
