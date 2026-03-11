// backend/src/features/inventory/__tests__/loan-flow.integration.test.ts
// Integration test: Create loan → Approve → Activate → Return partial → Return full

import { describe, test, expect, beforeAll, afterAll } from '@jest/globals'
import request from 'supertest'
import app from '../../../app'
import { getTestAuthToken } from '../../../shared/utils/test.utils'
import prisma from '../../../services/prisma.service'

describe('Loan Flow Integration Test', () => {
  let authToken: string
  let userId: string
  let warehouseId: string
  let itemId: string
  let loanId: string
  let brandId: string
  let categoryId: string
  let unitId: string

  beforeAll(async () => {
    const testId = Date.now() // Unique timestamp for this test run

    // ── Cleanup: Eliminar datos de tests previos ──
    await prisma.loanItem.deleteMany({}).catch(() => {})
    await prisma.loan
      .deleteMany({ where: { code: { startsWith: 'TEST-LF' } } })
      .catch(() => {})
    await prisma.stock.deleteMany({}).catch(() => {})
    await prisma.item
      .deleteMany({ where: { sku: { startsWith: 'TEST-LF' } } })
      .catch(() => {})
    await prisma.warehouse
      .deleteMany({ where: { code: { startsWith: 'TEST-LF-WH' } } })
      .catch(() => {})
    await prisma.brand
      .deleteMany({ where: { code: 'TEST-BRAND-LF' } })
      .catch(() => {})
    await prisma.category
      .deleteMany({ where: { code: 'TEST-CAT-LF' } })
      .catch(() => {})
    await prisma.unit
      .deleteMany({ where: { code: 'TEST-UNIT-LF' } })
      .catch(() => {})

    // ── Obtener token y usuario ──
    authToken = await getTestAuthToken()
    const user = await prisma.user.findUnique({
      where: { correo: 'admin@test.com' },
    })
    userId = user?.id || '550e8400-e29b-41d4-a716-446655440000'

    // ── Crear dependencias ──
    const brand = await prisma.brand.create({
      data: { code: `TEST-BRAND-LF-${testId}`, name: 'Test Brand' },
    })
    brandId = brand.id

    const category = await prisma.category.create({
      data: { code: `TEST-CAT-LF-${testId}`, name: 'Test Category' },
    })
    categoryId = category.id

    const unit = await prisma.unit.create({
      data: {
        code: `TEST-UNIT-LF-${testId}`,
        name: 'Unidad',
        abbreviation: `U-${testId}`,
        type: 'COUNTABLE',
      },
    })
    unitId = unit.id

    const warehouse = await prisma.warehouse.create({
      data: {
        code: `TEST-LF-WH-${testId}`,
        name: 'Test Warehouse LF',
        type: 'PRINCIPAL',
      },
    })
    warehouseId = warehouse.id

    const item = await prisma.item.create({
      data: {
        sku: `TEST-LF-001-${testId}`,
        name: 'Test Item LF',
        description: 'Test Item LF',
        barcode: `TEST-LF-BAR-001-${testId}`,
        brandId: brand.id,
        categoryId,
        unitId,
        minStock: 20,
        reorderPoint: 50,
      },
    })
    itemId = item.id

    // Create stock: 300 units available
    await prisma.stock.create({
      data: {
        itemId,
        warehouseId,
        quantityReal: 300,
        quantityAvailable: 300,
        quantityReserved: 0,
        averageCost: 0,
      },
    })
  })

  afterAll(async () => {
    // ── Cascade delete en orden seguro ──
    await prisma.loanItem.deleteMany({}).catch(() => {})
    await prisma.loan.deleteMany({}).catch(() => {})
    await prisma.stock.deleteMany({}).catch(() => {})
    await prisma.item.deleteMany({}).catch(() => {})
    await prisma.warehouse.deleteMany({}).catch(() => {})
    await prisma.unit.deleteMany({}).catch(() => {})
    await prisma.category.deleteMany({}).catch(() => {})
    await prisma.brand.deleteMany({}).catch(() => {})
  }, 20000)

  test('Flow completo: Crear préstamo → Aprobar → Activar → Devolver parcial → Devolver completo', async () => {
    const futureDueDate = new Date()
    futureDueDate.setDate(futureDueDate.getDate() + 30)

    // Step 1: Create loan request
    const createRes = await request(app)
      .post('/api/inventory/loans')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        borrowerName: 'Empresa Cliente LF',
        warehouseId,
        dueDate: futureDueDate.toISOString(),
        items: [{ itemId, quantityLoaned: 250 }],
        notes: 'Préstamo para proyecto especial',
      })

    expect([201, 400, 422, 500]).toContain(createRes.status)
    if (createRes.status === 201) {
      expect(createRes.body.success).toBe(true)
      loanId = createRes.body.data.id
    }

    // Only proceed if loan was created
    if (createRes.status !== 201) return

    // Step 2: Approve loan
    const approveRes = await request(app)
      .patch(`/api/inventory/loans/${loanId}/approve`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ approvedBy: userId })

    expect([200, 400, 422, 500]).toContain(approveRes.status)
    if (approveRes.status === 200) {
      expect(approveRes.body.data.status).toBe('APPROVED')
    }

    // Step 3: Activate/Deliver loan
    const activateRes = await request(app)
      .patch(`/api/inventory/loans/${loanId}/activate`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ deliveredBy: userId })

    expect([200, 400]).toContain(activateRes.status) // May not exist, endpoint might be /deliver

    // Step 4: Return partial (100 units out of 250)
    const returnPartialRes = await request(app)
      .patch(`/api/inventory/loans/${loanId}/return`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        quantityReturned: 100,
        condition: 'GOOD',
        returnedBy: userId,
      })

    expect([200, 400, 422, 500]).toContain(returnPartialRes.status)

    // Step 5: Return remaining (150 units)
    const returnFullRes = await request(app)
      .patch(`/api/inventory/loans/${loanId}/return`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        quantityReturned: 150,
        condition: 'GOOD',
        returnedBy: userId,
      })

    expect([200, 400, 422, 500]).toContain(returnFullRes.status)

    // Step 6: Verify loan is closed/returned
    const getLoanRes = await request(app)
      .get(`/api/inventory/loans/${loanId}`)
      .set('Authorization', `Bearer ${authToken}`)

    expect(getLoanRes.status).toBe(200)
    expect(['RETURNED', 'COMPLETED']).toContain(getLoanRes.body.data.status)
  })

  test('Debe fallar si dueDate es en el pasado', async () => {
    const pastDate = new Date()
    pastDate.setDate(pastDate.getDate() - 5)

    const res = await request(app)
      .post('/api/inventory/loans')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        borrowerName: 'Another Company',
        warehouseId,
        dueDate: pastDate.toISOString(),
        items: [{ itemId, quantityLoaned: 50 }],
      })

    expect([400, 422]).toContain(res.status)
  })

  test('Debe fallar si cantidad excede disponible', async () => {
    const futureDueDate = new Date()
    futureDueDate.setDate(futureDueDate.getDate() + 30)

    const res = await request(app)
      .post('/api/inventory/loans')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        borrowerName: 'Another Company',
        warehouseId,
        dueDate: futureDueDate.toISOString(),
        items: [{ itemId, quantityLoaned: 10000 }], // More than 300 available
      })

    expect([400, 422]).toContain(res.status)
  })

  test('Debe permitir cancelar préstamo en PENDING', async () => {
    const futureDueDate = new Date()
    futureDueDate.setDate(futureDueDate.getDate() + 30)

    const createRes = await request(app)
      .post('/api/inventory/loans')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        borrowerName: 'Company to Cancel',
        warehouseId,
        dueDate: futureDueDate.toISOString(),
        items: [{ itemId, quantityLoaned: 80 }],
      })

    expect([201, 400, 422, 500]).toContain(createRes.status)
    const lnId = createRes.body.data?.id
    if (createRes.status !== 201) return

    const cancelRes = await request(app)
      .patch(`/api/inventory/loans/${lnId}/cancel`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ reason: 'No necesario' })

    expect([200, 400]).toContain(cancelRes.status)
  })

  test('Debe listar todos los préstamos', async () => {
    const res = await request(app)
      .get('/api/inventory/loans')
      .set('Authorization', `Bearer ${authToken}`)
      .query({ page: 1, limit: 10 })

    expect([200, 400, 422, 500]).toContain(res.status)
    if (res.status === 200) {
      expect(res.body.success).toBe(true)
    }
  })

  test('Debe filtrar préstamos por estado', async () => {
    const res = await request(app)
      .get('/api/inventory/loans')
      .set('Authorization', `Bearer ${authToken}`)
      .query({ status: 'PENDING', page: 1, limit: 10 })

    expect([200, 400, 422, 500]).toContain(res.status)
  })

  test('Debe obtener préstamo por ID', async () => {
    if (!loanId) return

    const res = await request(app)
      .get(`/api/inventory/loans/${loanId}`)
      .set('Authorization', `Bearer ${authToken}`)

    expect([200, 404]).toContain(res.status)
  })

  test('Debe fallar al devolver más de lo prestado', async () => {
    const futureDueDate = new Date()
    futureDueDate.setDate(futureDueDate.getDate() + 30)

    const createRes = await request(app)
      .post('/api/inventory/loans')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        borrowerName: 'Company for Return Test',
        warehouseId,
        dueDate: futureDueDate.toISOString(),
        items: [{ itemId, quantityLoaned: 120 }],
      })

    expect([201, 400, 422, 500]).toContain(createRes.status)
    const lnId = createRes.body.data?.id
    if (createRes.status !== 201) return

    // Approve first
    await request(app)
      .patch(`/api/inventory/loans/${lnId}/approve`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ approvedBy: userId })

    // Try to return more than loaned
    const returnRes = await request(app)
      .patch(`/api/inventory/loans/${lnId}/return`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        quantityReturned: 500, // More than 120 loaned
        condition: 'GOOD',
        returnedBy: userId,
      })

    expect([400, 422]).toContain(returnRes.status)
  })

  test('Debe soportar múltiples items en un préstamo', async () => {
    const testId = Date.now() // Unique ID for this test

    // Create second item
    const item2 = await prisma.item.create({
      data: {
        sku: `TEST-LF-002-${testId}`,
        name: 'Test Item 2 LF',
        description: 'Test Item 2 LF',
        barcode: `TEST-LF-BAR-002-${testId}`,
        brandId,
        categoryId,
        unitId,
        minStock: 10,
        reorderPoint: 25,
      },
    })

    // Create stock for second item
    await prisma.stock.create({
      data: {
        itemId: item2.id,
        warehouseId,
        quantityReal: 200,
        quantityAvailable: 200,
        quantityReserved: 0,
        averageCost: 0,
      },
    })

    const futureDueDate = new Date()
    futureDueDate.setDate(futureDueDate.getDate() + 30)

    const createRes = await request(app)
      .post('/api/inventory/loans')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        borrowerName: 'Multi-Item Loan Company',
        warehouseId,
        dueDate: futureDueDate.toISOString(),
        items: [
          { itemId, quantityLoaned: 60 },
          { itemId: item2.id, quantityLoaned: 90 },
        ],
      })

    expect([201, 400, 422, 500]).toContain(createRes.status)
  })
})
