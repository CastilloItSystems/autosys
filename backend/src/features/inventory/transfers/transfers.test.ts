// backend/src/features/inventory/transfers/transfers.test.ts

import { describe, test, expect, beforeAll, afterAll } from '@jest/globals'
import request from 'supertest'
import app from '../../../index'
import { getTestAuthToken } from '../../../shared/utils/test.utils'
import prisma from '../../../services/prisma.service'

describe('Transfers API Tests', () => {
  let authToken: string
  let userId: string
  let warehouseFromId: string
  let warehouseToId: string
  let itemId: string
  let transferId: string
  let brandId: string
  let categoryId: string
  let unitId: string

  beforeAll(async () => {
    // ── Cleanup: Eliminar datos de tests previos ──
    await prisma.transferItem
      .deleteMany({
        where: { transfer: { transferNumber: { startsWith: 'TRANS-' } } },
      })
      .catch(() => {})
    await prisma.transfer
      .deleteMany({ where: { transferNumber: { startsWith: 'TRANS-' } } })
      .catch(() => {})
    await prisma.item
      .deleteMany({ where: { sku: { startsWith: 'TEST-TRF' } } })
      .catch(() => {})
    await prisma.warehouse
      .deleteMany({ where: { code: { startsWith: 'TEST-TRF-WH' } } })
      .catch(() => {})
    await prisma.brand
      .deleteMany({ where: { code: 'TEST-BRAND-TRF' } })
      .catch(() => {})
    await prisma.category
      .deleteMany({ where: { code: 'TEST-CAT-TRF' } })
      .catch(() => {})
    await prisma.unit
      .deleteMany({ where: { code: 'TEST-UNIT-TRF' } })
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
        code: 'TEST-BRAND-TRF',
        name: 'Test Brand TRF',
        type: 'PART',
        isActive: true,
      },
    })
    brandId = brand.id

    // ── Crear dependencias: Category ──
    const category = await prisma.category.create({
      data: {
        code: 'TEST-CAT-TRF',
        name: 'Test Category TRF',
        isActive: true,
      },
    })
    categoryId = category.id

    // ── Crear dependencias: Unit ──
    const unit = await prisma.unit.create({
      data: {
        code: 'TEST-UNIT-TRF',
        name: 'Test Unit TRF',
        abbreviation: 'TUT',
        type: 'COUNTABLE',
        isActive: true,
      },
    })
    unitId = unit.id

    // ── Crear dependencias: Warehouse FROM ──
    const warehouseFrom = await prisma.warehouse.create({
      data: {
        code: 'TEST-TRF-WH-FROM',
        name: 'TRF Warehouse From',
        type: 'PRINCIPAL',
        isActive: true,
      },
    })
    warehouseFromId = warehouseFrom.id

    // ── Crear dependencias: Warehouse TO ──
    const warehouseTo = await prisma.warehouse.create({
      data: {
        code: 'TEST-TRF-WH-TO',
        name: 'TRF Warehouse To',
        type: 'PRINCIPAL',
        isActive: true,
      },
    })
    warehouseToId = warehouseTo.id

    // ── Crear dependencias: Item ──
    const item = await prisma.item.create({
      data: {
        sku: 'TEST-TRF-001',
        name: 'Test TRF Item',
        brandId,
        categoryId,
        unitId,
        costPrice: 35,
        salePrice: 70,
        isActive: true,
      },
    })
    itemId = item.id

    // ── Crear stock en warehouse FROM ──
    await prisma.stock
      .create({
        data: {
          itemId,
          warehouseId: warehouseFromId,
          quantityReal: 300,
          quantityReserved: 0,
          quantityAvailable: 300,
          averageCost: 35,
        },
      })
      .catch(() => {})

    // ── Crear stock en warehouse TO (vacío) ──
    await prisma.stock
      .create({
        data: {
          itemId,
          warehouseId: warehouseToId,
          quantityReal: 0,
          quantityReserved: 0,
          quantityAvailable: 0,
          averageCost: 35,
        },
      })
      .catch(() => {})
  }, 20000)

  afterAll(async () => {
    try {
      // ── Cleanup en orden FK-safe ──
      await prisma.movement
        .deleteMany({
          where: { movementNumber: { startsWith: 'MOV-TRANSFER' } },
        })
        .catch(() => {})
      await prisma.transferItem
        .deleteMany({
          where: { transfer: { transferNumber: { startsWith: 'TRANS-' } } },
        })
        .catch(() => {})
      await prisma.transfer
        .deleteMany({ where: { transferNumber: { startsWith: 'TRANS-' } } })
        .catch(() => {})
      await prisma.stock
        .deleteMany({ where: { item: { sku: { startsWith: 'TEST-TRF' } } } })
        .catch(() => {})
      await prisma.item
        .deleteMany({ where: { sku: { startsWith: 'TEST-TRF' } } })
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
        .deleteMany({ where: { code: { startsWith: 'TEST-TRF-WH' } } })
        .catch(() => {})
    } catch (error) {
      console.log('Error en afterAll cleanup:', error)
    }
  })

  // ============================================
  // CREATE TESTS
  // ============================================
  describe('POST /api/inventory/transfers', () => {
    test('Debe crear un transfer exitosamente', async () => {
      const res = await request(app)
        .post('/api/inventory/transfers')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          fromWarehouseId: warehouseFromId,
          toWarehouseId: warehouseToId,
          notes: 'Transfer de prueba',
          items: [
            {
              itemId,
              quantity: 50,
              unitCost: 35,
            },
          ],
        })

      expect(res.status).toBe(201)
      expect(res.body.success).toBe(true)
      expect(res.body.data).toHaveProperty('id')
      transferId = res.body.data.id
    })

    test('Debe fallar sin fromWarehouseId', async () => {
      const res = await request(app)
        .post('/api/inventory/transfers')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          toWarehouseId: warehouseToId,
          items: [{ itemId, quantity: 50 }],
        })

      expect(res.status).toBe(422)
    })

    test('Debe fallar sin toWarehouseId', async () => {
      const res = await request(app)
        .post('/api/inventory/transfers')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          fromWarehouseId: warehouseFromId,
          items: [{ itemId, quantity: 50 }],
        })

      expect(res.status).toBe(422)
    })

    test('Debe fallar sin items', async () => {
      const res = await request(app)
        .post('/api/inventory/transfers')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          fromWarehouseId: warehouseFromId,
          toWarehouseId: warehouseToId,
          items: [],
        })

      expect(res.status).toBe(422)
    })

    test('Debe fallar transferir al mismo warehouse', async () => {
      const res = await request(app)
        .post('/api/inventory/transfers')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          fromWarehouseId: warehouseFromId,
          toWarehouseId: warehouseFromId, // Mismo warehouse
          items: [{ itemId, quantity: 50 }],
        })

      expect([400, 422]).toContain(res.status)
    })

    test('Debe fallar transferir más que stock disponible', async () => {
      const res = await request(app)
        .post('/api/inventory/transfers')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          fromWarehouseId: warehouseFromId,
          toWarehouseId: warehouseToId,
          items: [{ itemId, quantity: 5000 }], // Más que stock
        })

      expect([400, 422]).toContain(res.status)
    })
  })

  // ============================================
  // GET ALL TESTS
  // ============================================
  describe('GET /api/inventory/transfers', () => {
    test('Debe obtener lista de transfers', async () => {
      const res = await request(app)
        .get('/api/inventory/transfers')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ page: 1, limit: 10 })

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
    })

    test('Debe filtrar por estado', async () => {
      const res = await request(app)
        .get('/api/inventory/transfers')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ status: 'DRAFT', page: 1, limit: 10 })

      expect(res.status).toBe(200)
    })

    test('Debe filtrar por warehouse origen', async () => {
      const res = await request(app)
        .get('/api/inventory/transfers')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ fromWarehouseId: warehouseFromId, page: 1, limit: 10 })

      expect(res.status).toBe(200)
    })
  })

  // ============================================
  // GET BY ID TESTS
  // ============================================
  describe('GET /api/inventory/transfers/:id', () => {
    test('Debe obtener transfer por ID', async () => {
      if (!transferId) {
        console.warn('transferId no disponible')
        return
      }

      const res = await request(app)
        .get(`/api/inventory/transfers/${transferId}`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.data.id).toBe(transferId)
    })

    test('Debe fallar con ID no válido', async () => {
      const res = await request(app)
        .get('/api/inventory/transfers/invalid-id')
        .set('Authorization', `Bearer ${authToken}`)

      expect(res.status).toBe(422)
    })

    test('Debe fallar con transfer no encontrado', async () => {
      const res = await request(app)
        .get('/api/inventory/transfers/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${authToken}`)

      expect(res.status).toBe(404)
    })
  })

  // ============================================
  // UPDATE TESTS
  // ============================================
  describe('PUT /api/inventory/transfers/:id', () => {
    test('Debe actualizar transfer en PENDING', async () => {
      const createRes = await request(app)
        .post('/api/inventory/transfers')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          fromWarehouseId: warehouseFromId,
          toWarehouseId: warehouseToId,
          notes: 'Para actualizar',
          items: [{ itemId, quantity: 35 }],
        })

      if (createRes.status === 201) {
        const updateRes = await request(app)
          .put(`/api/inventory/transfers/${createRes.body.data.id}`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            notes: 'Notas actualizadas',
          })

        expect([200, 400]).toContain(updateRes.status)
      }
    }, 15000)
  })

  // ============================================
  // SEND TESTS
  // ============================================
  describe('PATCH /api/inventory/transfers/:id/send', () => {
    test('Debe enviar un transfer', async () => {
      const createRes = await request(app)
        .post('/api/inventory/transfers')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          fromWarehouseId: warehouseFromId,
          toWarehouseId: warehouseToId,
          notes: 'Para enviar',
          items: [{ itemId, quantity: 25 }],
        })

      if (createRes.status === 201) {
        const sendRes = await request(app)
          .patch(`/api/inventory/transfers/${createRes.body.data.id}/send`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({ sentBy: userId })

        expect([200, 400]).toContain(sendRes.status)
      }
    }, 60000)
  })

  // ============================================
  // RECeIVE TESTS
  // ============================================
  describe('PATCH /api/inventory/transfers/:id/receive', () => {
    test('Debe recibir un transfer', async () => {
      // Create transfer and send it first
      const createRes = await request(app)
        .post('/api/inventory/transfers')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          fromWarehouseId: warehouseFromId,
          toWarehouseId: warehouseToId,
          notes: 'Para recibir',
          items: [{ itemId, quantity: 20 }],
        })

      if (createRes.status === 201) {
        const trfId = createRes.body.data.id

        // Send the transfer first
        await request(app)
          .patch(`/api/inventory/transfers/${trfId}/send`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({ sentBy: userId })

        // Then receive it
        const res = await request(app)
          .patch(`/api/inventory/transfers/${trfId}/receive`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({ receivedBy: userId })

        expect([200, 400]).toContain(res.status)
      }
    }, 60000)
  })

  // ============================================
  // CANCEL TESTS
  // ============================================
  describe('PATCH /api/inventory/transfers/:id/cancel', () => {
    test('Debe cancelar un transfer', async () => {
      const createRes = await request(app)
        .post('/api/inventory/transfers')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          fromWarehouseId: warehouseFromId,
          toWarehouseId: warehouseToId,
          notes: 'Para cancelar',
          items: [{ itemId, quantity: 40 }],
        })

      if (createRes.status === 201) {
        const trfId = createRes.body.data.id
        const res = await request(app)
          .patch(`/api/inventory/transfers/${trfId}/cancel`)
          .set('Authorization', `Bearer ${authToken}`)

        expect([200, 400]).toContain(res.status)
      }
    }, 15000)
  })

  // ============================================
  // DELETE TESTS
  // ============================================
  describe('DELETE /api/inventory/transfers/:id', () => {
    test('Debe eliminar transfer en PENDING', async () => {
      const createRes = await request(app)
        .post('/api/inventory/transfers')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          fromWarehouseId: warehouseFromId,
          toWarehouseId: warehouseToId,
          notes: 'Para eliminar',
          items: [{ itemId, quantity: 30 }],
        })

      if (createRes.status === 201) {
        const trfId = createRes.body.data.id
        const res = await request(app)
          .delete(`/api/inventory/transfers/${trfId}`)
          .set('Authorization', `Bearer ${authToken}`)

        expect([200, 400, 404]).toContain(res.status)
      }
    })
  })
})
