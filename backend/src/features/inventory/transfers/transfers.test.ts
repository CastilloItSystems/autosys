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

  // ── Helper: create a transfer in DRAFT ──
  async function createDraftTransfer(qty = 25) {
    const res = await request(app)
      .post('/api/inventory/transfers')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        fromWarehouseId: warehouseFromId,
        toWarehouseId: warehouseToId,
        notes: 'Test transfer',
        items: [{ itemId, quantity: qty, unitCost: 35 }],
      })
    expect(res.status).toBe(201)
    return res.body.data.id as string
  }

  // ── Helper: advance transfer through the approval flow ──
  async function advanceTo(
    id: string,
    target: 'PENDING_APPROVAL' | 'APPROVED' | 'IN_TRANSIT' | 'RECEIVED'
  ) {
    if (
      ['PENDING_APPROVAL', 'APPROVED', 'IN_TRANSIT', 'RECEIVED'].includes(
        target
      )
    ) {
      await request(app)
        .patch(`/api/inventory/transfers/${id}/submit`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
    }
    if (['APPROVED', 'IN_TRANSIT', 'RECEIVED'].includes(target)) {
      await request(app)
        .patch(`/api/inventory/transfers/${id}/approve`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
    }
    if (['IN_TRANSIT', 'RECEIVED'].includes(target)) {
      await request(app)
        .patch(`/api/inventory/transfers/${id}/send`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
    }
    if (target === 'RECEIVED') {
      await request(app)
        .patch(`/api/inventory/transfers/${id}/receive`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
    }
  }

  // ============================================
  // CREATE TESTS
  // ============================================
  describe('POST /api/inventory/transfers', () => {
    test('Debe crear un transfer exitosamente en DRAFT', async () => {
      const res = await request(app)
        .post('/api/inventory/transfers')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          fromWarehouseId: warehouseFromId,
          toWarehouseId: warehouseToId,
          notes: 'Transfer de prueba',
          items: [{ itemId, quantity: 50, unitCost: 35 }],
        })

      expect(res.status).toBe(201)
      expect(res.body.success).toBe(true)
      expect(res.body.data).toHaveProperty('id')
      expect(res.body.data.status).toBe('DRAFT')
      expect(res.body.data.transferNumber).toMatch(/^TRANS-/)
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
          toWarehouseId: warehouseFromId,
          items: [{ itemId, quantity: 50 }],
        })

      expect(res.status).toBe(400)
    })

    test('Debe fallar transferir más que stock disponible', async () => {
      const res = await request(app)
        .post('/api/inventory/transfers')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          fromWarehouseId: warehouseFromId,
          toWarehouseId: warehouseToId,
          items: [{ itemId, quantity: 5000 }],
        })

      expect(res.status).toBe(400)
    })
  })

  // ============================================
  // GET ALL TESTS
  // ============================================
  describe('GET /api/inventory/transfers', () => {
    test('Debe obtener lista de transfers paginada', async () => {
      const res = await request(app)
        .get('/api/inventory/transfers')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ page: 1, limit: 10 })

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.data).toBeInstanceOf(Array)
      expect(res.body).toHaveProperty('pagination')
    })

    test('Debe filtrar por estado DRAFT', async () => {
      const res = await request(app)
        .get('/api/inventory/transfers')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ status: 'DRAFT', page: 1, limit: 10 })

      expect(res.status).toBe(200)
      if (res.body.data.length > 0) {
        expect(res.body.data[0].status).toBe('DRAFT')
      }
    })

    test('Debe filtrar por warehouse origen', async () => {
      const res = await request(app)
        .get('/api/inventory/transfers')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ fromWarehouseId: warehouseFromId, page: 1, limit: 10 })

      expect(res.status).toBe(200)
    })

    test('Debe buscar por texto', async () => {
      const res = await request(app)
        .get('/api/inventory/transfers')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ search: 'Transfer de prueba', page: 1, limit: 10 })

      expect(res.status).toBe(200)
    })
  })

  // ============================================
  // GET BY ID TESTS
  // ============================================
  describe('GET /api/inventory/transfers/:id', () => {
    test('Debe obtener transfer por ID con items', async () => {
      expect(transferId).toBeDefined()

      const res = await request(app)
        .get(`/api/inventory/transfers/${transferId}`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.data.id).toBe(transferId)
      expect(res.body.data).toHaveProperty('items')
      expect(res.body.data).toHaveProperty('fromWarehouse')
      expect(res.body.data).toHaveProperty('toWarehouse')
    })

    test('Debe fallar con ID no válido', async () => {
      const res = await request(app)
        .get('/api/inventory/transfers/invalid-id')
        .set('Authorization', `Bearer ${authToken}`)

      expect(res.status).toBe(422)
    })

    test('Debe retornar 404 con transfer no encontrado', async () => {
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
    test('Debe actualizar notas de un transfer en DRAFT', async () => {
      const id = await createDraftTransfer(5)

      const res = await request(app)
        .put(`/api/inventory/transfers/${id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ notes: 'Notas actualizadas' })

      expect(res.status).toBe(200)
      expect(res.body.data.notes).toBe('Notas actualizadas')
    }, 15000)
  })

  // ============================================
  // APPROVAL FLOW TESTS
  // ============================================
  describe('Approval Flow', () => {
    test('DRAFT → PENDING_APPROVAL (submit)', async () => {
      const id = await createDraftTransfer(5)

      const res = await request(app)
        .patch(`/api/inventory/transfers/${id}/submit`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(res.status).toBe(200)
      expect(res.body.data.status).toBe('PENDING_APPROVAL')
    }, 15000)

    test('PENDING_APPROVAL → APPROVED (approve)', async () => {
      const id = await createDraftTransfer(5)
      await advanceTo(id, 'PENDING_APPROVAL')

      const res = await request(app)
        .patch(`/api/inventory/transfers/${id}/approve`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(res.status).toBe(200)
      expect(res.body.data.status).toBe('APPROVED')
      expect(res.body.data).toHaveProperty('approvedAt')
    }, 15000)

    test('PENDING_APPROVAL → REJECTED (reject)', async () => {
      const id = await createDraftTransfer(5)
      await advanceTo(id, 'PENDING_APPROVAL')

      const res = await request(app)
        .patch(`/api/inventory/transfers/${id}/reject`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ reason: 'Stock insuficiente verificado' })

      expect(res.status).toBe(200)
      expect(res.body.data.status).toBe('REJECTED')
      expect(res.body.data.rejectionReason).toBe(
        'Stock insuficiente verificado'
      )
    }, 15000)

    test('Debe fallar reject sin razón', async () => {
      const id = await createDraftTransfer(5)
      await advanceTo(id, 'PENDING_APPROVAL')

      const res = await request(app)
        .patch(`/api/inventory/transfers/${id}/reject`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({})

      expect(res.status).toBe(422)
    }, 15000)

    test('Debe fallar submit en estado no DRAFT', async () => {
      const id = await createDraftTransfer(5)
      await advanceTo(id, 'PENDING_APPROVAL')

      const res = await request(app)
        .patch(`/api/inventory/transfers/${id}/submit`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(res.status).toBe(400)
    }, 15000)

    test('Debe fallar approve en estado no PENDING_APPROVAL', async () => {
      const id = await createDraftTransfer(5)

      const res = await request(app)
        .patch(`/api/inventory/transfers/${id}/approve`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(res.status).toBe(400)
    }, 15000)
  })

  // ============================================
  // SEND TESTS (no body needed)
  // ============================================
  describe('PATCH /api/inventory/transfers/:id/send', () => {
    test('Debe enviar un transfer aprobado (no body)', async () => {
      const id = await createDraftTransfer(10)
      await advanceTo(id, 'APPROVED')

      const res = await request(app)
        .patch(`/api/inventory/transfers/${id}/send`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(res.status).toBe(200)
      expect(res.body.data.status).toBe('IN_TRANSIT')
      expect(res.body.data).toHaveProperty('sentAt')
    }, 60000)

    test('Debe fallar send en estado DRAFT (no aprobado)', async () => {
      const id = await createDraftTransfer(5)

      const res = await request(app)
        .patch(`/api/inventory/transfers/${id}/send`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(res.status).toBe(400)
    }, 15000)
  })

  // ============================================
  // RECEIVE TESTS (no body needed)
  // ============================================
  describe('PATCH /api/inventory/transfers/:id/receive', () => {
    test('Debe recibir un transfer en tránsito (no body)', async () => {
      const id = await createDraftTransfer(10)
      await advanceTo(id, 'IN_TRANSIT')

      const res = await request(app)
        .patch(`/api/inventory/transfers/${id}/receive`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(res.status).toBe(200)
      expect(res.body.data.status).toBe('RECEIVED')
      expect(res.body.data).toHaveProperty('receivedAt')
    }, 60000)
  })

  // ============================================
  // CANCEL TESTS
  // ============================================
  describe('PATCH /api/inventory/transfers/:id/cancel', () => {
    test('Debe cancelar un transfer en DRAFT', async () => {
      const id = await createDraftTransfer(5)

      const res = await request(app)
        .patch(`/api/inventory/transfers/${id}/cancel`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(res.status).toBe(200)
      expect(res.body.data.status).toBe('CANCELLED')
    }, 15000)

    test('Debe cancelar un transfer en IN_TRANSIT y revertir stock', async () => {
      // Check stock before
      const stockBefore = await prisma.stock.findFirst({
        where: { itemId, warehouseId: warehouseFromId },
      })

      const id = await createDraftTransfer(10)
      await advanceTo(id, 'IN_TRANSIT')

      // Stock should have decreased after send
      const stockAfterSend = await prisma.stock.findFirst({
        where: { itemId, warehouseId: warehouseFromId },
      })
      expect(Number(stockAfterSend?.quantityAvailable)).toBeLessThan(
        Number(stockBefore?.quantityAvailable)
      )

      // Cancel should reverse the stock
      const res = await request(app)
        .patch(`/api/inventory/transfers/${id}/cancel`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(res.status).toBe(200)
      expect(res.body.data.status).toBe('CANCELLED')

      // Stock should be restored
      const stockAfterCancel = await prisma.stock.findFirst({
        where: { itemId, warehouseId: warehouseFromId },
      })
      expect(Number(stockAfterCancel?.quantityAvailable)).toBe(
        Number(stockBefore?.quantityAvailable)
      )
    }, 60000)

    test('Debe fallar cancelar un transfer ya RECEIVED', async () => {
      const id = await createDraftTransfer(5)
      await advanceTo(id, 'RECEIVED')

      const res = await request(app)
        .patch(`/api/inventory/transfers/${id}/cancel`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(res.status).toBe(400)
    }, 60000)
  })

  // ============================================
  // DELETE TESTS
  // ============================================
  describe('DELETE /api/inventory/transfers/:id', () => {
    test('Debe eliminar transfer en DRAFT', async () => {
      const id = await createDraftTransfer(5)

      const res = await request(app)
        .delete(`/api/inventory/transfers/${id}`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(res.status).toBe(204)

      // Confirm it's gone
      const getRes = await request(app)
        .get(`/api/inventory/transfers/${id}`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(getRes.status).toBe(404)
    }, 15000)

    test('Debe fallar eliminar transfer no en DRAFT', async () => {
      const id = await createDraftTransfer(5)
      await advanceTo(id, 'PENDING_APPROVAL')

      const res = await request(app)
        .delete(`/api/inventory/transfers/${id}`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(res.status).toBe(400)
    }, 15000)
  })
})
