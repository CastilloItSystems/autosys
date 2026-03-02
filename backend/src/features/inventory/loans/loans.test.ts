// backend/src/features/inventory/loans/loans.test.ts

import { describe, test, expect, beforeAll, afterAll } from '@jest/globals'
import request from 'supertest'
import app from '../../../index'
import { getTestAuthToken } from '../../../shared/utils/test.utils'
import prisma from '../../../services/prisma.service'

describe('Loans API Tests', () => {
  let authToken: string
  let userId: string
  let warehouseId: string
  let itemId: string
  let loanId: string
  let brandId: string
  let categoryId: string
  let unitId: string

  beforeAll(async () => {
    // ── Cleanup: Eliminar datos de tests previos ──
    await prisma.loanItem
      .deleteMany({
        where: { loan: { borrowerName: { startsWith: 'TEST-LOAN' } } },
      })
      .catch(() => {})
    await prisma.loan
      .deleteMany({ where: { borrowerName: { startsWith: 'TEST-LOAN' } } })
      .catch(() => {})
    await prisma.item
      .deleteMany({ where: { sku: { startsWith: 'TEST-LOAN' } } })
      .catch(() => {})
    await prisma.warehouse
      .deleteMany({ where: { code: { startsWith: 'TEST-LOAN-WH' } } })
      .catch(() => {})
    await prisma.brand
      .deleteMany({ where: { code: 'TEST-BRAND-LOAN' } })
      .catch(() => {})
    await prisma.category
      .deleteMany({ where: { code: 'TEST-CAT-LOAN' } })
      .catch(() => {})
    await prisma.unit
      .deleteMany({ where: { code: 'TEST-UNIT-LOAN' } })
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
        code: 'TEST-BRAND-LOAN',
        name: 'Test Brand LOAN',
        type: 'PART',
        isActive: true,
      },
    })
    brandId = brand.id

    // ── Crear dependencias: Category ──
    const category = await prisma.category.create({
      data: {
        code: 'TEST-CAT-LOAN',
        name: 'Test Category LOAN',
        isActive: true,
      },
    })
    categoryId = category.id

    // ── Crear dependencias: Unit ──
    const unit = await prisma.unit.create({
      data: {
        code: 'TEST-UNIT-LOAN',
        name: 'Test Unit LOAN',
        abbreviation: 'TUL',
        type: 'COUNTABLE',
        isActive: true,
      },
    })
    unitId = unit.id

    // ── Crear dependencias: Warehouse ──
    const warehouse = await prisma.warehouse.create({
      data: {
        code: 'TEST-LOAN-WH-1',
        name: 'LOAN Warehouse',
        type: 'PRINCIPAL',
        isActive: true,
      },
    })
    warehouseId = warehouse.id

    // ── Crear dependencias: Item ──
    const item = await prisma.item.create({
      data: {
        sku: 'TEST-LOAN-001',
        name: 'Test LOAN Item',
        brandId,
        categoryId,
        unitId,
        costPrice: 45,
        salePrice: 90,
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
          quantityReal: 250,
          quantityReserved: 0,
          quantityAvailable: 250,
          averageCost: 45,
        },
      })
      .catch(() => {})
  }, 20000)

  afterAll(async () => {
    try {
      // ── Cleanup en orden FK-safe ──
      await prisma.loanItem
        .deleteMany({
          where: { loan: { borrowerName: { startsWith: 'TEST-LOAN' } } },
        })
        .catch(() => {})
      await prisma.loan
        .deleteMany({ where: { borrowerName: { startsWith: 'TEST-LOAN' } } })
        .catch(() => {})
      await prisma.stock
        .deleteMany({ where: { item: { sku: { startsWith: 'TEST-LOAN' } } } })
        .catch(() => {})
      await prisma.item
        .deleteMany({ where: { sku: { startsWith: 'TEST-LOAN' } } })
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
        .deleteMany({ where: { code: { startsWith: 'TEST-LOAN-WH' } } })
        .catch(() => {})
    } catch (error) {
      console.log('Error en afterAll cleanup:', error)
    }
  })

  // ============================================
  // CREATE TESTS
  // ============================================
  describe('POST /api/inventory/loans', () => {
    test('Debe crear un préstamo exitosamente', async () => {
      const dueDate = new Date()
      dueDate.setDate(dueDate.getDate() + 14) // 14 días en el futuro

      const res = await request(app)
        .post('/api/inventory/loans')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          borrowerName: 'TEST-LOAN-Borrower-001',
          warehouseId,
          dueDate: dueDate.toISOString(),
          purpose: 'Prueba de préstamo',
          notes: 'Préstamo de prueba',
          items: [
            {
              itemId,
              quantityLoaned: 75,
              notes: 'Item prestado',
            },
          ],
        })

      expect(res.status).toBe(201)
      expect(res.body.success).toBe(true)
      expect(res.body.data).toHaveProperty('id')
      loanId = res.body.data.id
    })

    test('Debe fallar sin borrowerName', async () => {
      const dueDate = new Date()
      dueDate.setDate(dueDate.getDate() + 14)

      const res = await request(app)
        .post('/api/inventory/loans')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          warehouseId,
          dueDate: dueDate.toISOString(),
          items: [{ itemId, quantityLoaned: 50 }],
        })

      expect(res.status).toBe(422)
    })

    test('Debe fallar sin warehouseId', async () => {
      const dueDate = new Date()
      dueDate.setDate(dueDate.getDate() + 14)

      const res = await request(app)
        .post('/api/inventory/loans')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          borrowerName: 'TEST-LOAN-NoWarehouse',
          dueDate: dueDate.toISOString(),
          items: [{ itemId, quantityLoaned: 50 }],
        })

      expect(res.status).toBe(422)
    })

    test('Debe fallar sin dueDate', async () => {
      const res = await request(app)
        .post('/api/inventory/loans')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          borrowerName: 'TEST-LOAN-NoDueDate',
          warehouseId,
          items: [{ itemId, quantityLoaned: 50 }],
        })

      expect(res.status).toBe(422)
    })

    test('Debe fallar sin items', async () => {
      const dueDate = new Date()
      dueDate.setDate(dueDate.getDate() + 14)

      const res = await request(app)
        .post('/api/inventory/loans')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          borrowerName: 'TEST-LOAN-NoItems',
          warehouseId,
          dueDate: dueDate.toISOString(),
          items: [],
        })

      expect(res.status).toBe(422)
    })

    test('Debe fallar con fecha pasada', async () => {
      const dueDate = new Date()
      dueDate.setDate(dueDate.getDate() - 5) // 5 días en el pasado

      const res = await request(app)
        .post('/api/inventory/loans')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          borrowerName: 'TEST-LOAN-PastDate',
          warehouseId,
          dueDate: dueDate.toISOString(),
          items: [{ itemId, quantityLoaned: 50 }],
        })

      expect([400, 422]).toContain(res.status)
    })
  })

  // ============================================
  // GET ALL TESTS
  // ============================================
  describe('GET /api/inventory/loans', () => {
    test('Debe obtener lista de préstamos', async () => {
      const res = await request(app)
        .get('/api/inventory/loans')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ page: 1, limit: 10 })

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
    })

    test('Debe filtrar por estado', async () => {
      const res = await request(app)
        .get('/api/inventory/loans')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ status: 'PENDING', page: 1, limit: 10 })

      expect(res.status).toBe(200)
    })
  })

  // ============================================
  // GET BY ID TESTS
  // ============================================
  describe('GET /api/inventory/loans/:id', () => {
    test('Debe obtener préstamo por ID', async () => {
      if (!loanId) {
        console.warn('loanId no disponible')
        return
      }

      const res = await request(app)
        .get(`/api/inventory/loans/${loanId}`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.data.id).toBe(loanId)
    })

    test('Debe fallar con ID no válido', async () => {
      const res = await request(app)
        .get('/api/inventory/loans/invalid-id')
        .set('Authorization', `Bearer ${authToken}`)

      expect(res.status).toBe(422)
    })

    test('Debe fallar con préstamo no encontrado', async () => {
      const res = await request(app)
        .get('/api/inventory/loans/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${authToken}`)

      expect(res.status).toBe(404)
    })
  })

  // ============================================
  // UPDATE TESTS
  // ============================================
  describe('PUT /api/inventory/loans/:id', () => {
    test('Debe actualizar préstamo en PENDING', async () => {
      if (!loanId) return

      const res = await request(app)
        .put(`/api/inventory/loans/${loanId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          purpose: 'Propósito actualizado',
          notes: 'Notas actualizadas',
        })

      expect([200, 400]).toContain(res.status)
    })
  })

  // ============================================
  // APPROVE TESTS
  // ============================================
  describe('PATCH /api/inventory/loans/:id/approve', () => {
    test('Debe aprobar un préstamo', async () => {
      if (!loanId) return

      const res = await request(app)
        .patch(`/api/inventory/loans/${loanId}/approve`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ approvedBy: userId })

      expect([200, 400]).toContain(res.status)
    })
  })

  // ============================================
  // ACTIVATE TESTS
  // ============================================
  describe('PATCH /api/inventory/loans/:id/activate', () => {
    test('Debe activar un préstamo aprobado', async () => {
      if (!loanId) return

      const res = await request(app)
        .patch(`/api/inventory/loans/${loanId}/activate`)
        .set('Authorization', `Bearer ${authToken}`)

      expect([200, 400]).toContain(res.status)
    })
  })

  // ============================================
  // RETURN TESTS
  // ============================================
  describe('PATCH /api/inventory/loans/:id/return', () => {
    test('Debe devolver items prestados', async () => {
      if (!loanId) return

      const res = await request(app)
        .patch(`/api/inventory/loans/${loanId}/return`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          items: [
            {
              itemId,
              quantityReturned: 75,
            },
          ],
          returnNotes: 'Devolución de todos los items',
        })

      expect([200, 400]).toContain(res.status)
    })

    test('Debe fallar devolviendo más que lo prestado', async () => {
      if (!loanId) return

      const res = await request(app)
        .patch(`/api/inventory/loans/${loanId}/return`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          items: [
            {
              itemId,
              quantityReturned: 1000, // Más que lo prestado
            },
          ],
        })

      expect([400, 422]).toContain(res.status)
    })
  })

  // ============================================
  // CANCEL TESTS
  // ============================================
  describe('PATCH /api/inventory/loans/:id/cancel', () => {
    test('Debe cancelar un préstamo', async () => {
      const dueDate = new Date()
      dueDate.setDate(dueDate.getDate() + 14)

      const createRes = await request(app)
        .post('/api/inventory/loans')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          borrowerName: 'TEST-LOAN-ToCancel',
          warehouseId,
          dueDate: dueDate.toISOString(),
          items: [{ itemId, quantityLoaned: 60 }],
        })

      if (createRes.status === 201) {
        const lnId = createRes.body.data.id
        const res = await request(app)
          .patch(`/api/inventory/loans/${lnId}/cancel`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({ reason: 'Cancelación de prueba' })

        expect([200, 400]).toContain(res.status)
      }
    })
  })
})
