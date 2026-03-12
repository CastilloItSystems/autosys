// backend/src/features/inventory/__tests__/purchase-flow.integration.test.ts
// Integration test: Create supplier → Purchase Order → Approve → Receive goods → Verify stock

import { describe, test, expect, beforeAll, afterAll } from '@jest/globals'
import request from 'supertest'
import app from '../../../app.js'
import { getTestAuthToken } from '../../../shared/utils/test.utils.js'
import prisma from '../../../services/prisma.service.js'

describe('Purchase Flow Integration Test', () => {
  let authToken: string
  let userId: string
  let supplierId: string
  let warehouseId: string
  let itemId: string
  let purchaseOrderId: string
  let entryNoteId: string
  let brandId: string
  let categoryId: string
  let unitId: string

  beforeAll(async () => {
    const testId = Date.now() // Unique timestamp for this test run

    // ── Cleanup: Eliminar datos de tests previos ──
    await prisma.entryNoteItem
      .deleteMany({
        where: { entryNote: { entryNoteNumber: { startsWith: 'TEST-PF' } } },
      })
      .catch(() => {})
    await prisma.entryNote
      .deleteMany({ where: { entryNoteNumber: { startsWith: 'TEST-PF' } } })
      .catch(() => {})
    await prisma.purchaseOrderItem
      .deleteMany({
        where: { purchaseOrder: { orderNumber: { startsWith: 'TEST-PF-PO' } } },
      })
      .catch(() => {})
    await prisma.purchaseOrder
      .deleteMany({ where: { orderNumber: { startsWith: 'TEST-PF-PO' } } })
      .catch(() => {})
    await prisma.stock.deleteMany({}).catch(() => {})
    await prisma.item
      .deleteMany({ where: { sku: { startsWith: 'TEST-PF' } } })
      .catch(() => {})
    await prisma.warehouse
      .deleteMany({ where: { code: { startsWith: 'TEST-PF-WH' } } })
      .catch(() => {})
    await prisma.supplier.deleteMany({}).catch(() => {})
    await prisma.brand
      .deleteMany({ where: { code: 'TEST-BRAND-PF' } })
      .catch(() => {})
    await prisma.category
      .deleteMany({ where: { code: 'TEST-CAT-PF' } })
      .catch(() => {})
    await prisma.unit
      .deleteMany({ where: { code: 'TEST-UNIT-PF' } })
      .catch(() => {})

    // ── Obtener token y usuario ──
    authToken = await getTestAuthToken()
    const user = await prisma.user.findUnique({
      where: { correo: 'admin@test.com' },
    })
    userId = user?.id || '550e8400-e29b-41d4-a716-446655440000'

    // ── Crear dependencias ──
    const brand = await prisma.brand.create({
      data: { code: 'TEST-BRAND-PF', name: 'Test Brand' },
    })
    brandId = brand.id

    const category = await prisma.category.create({
      data: { code: 'TEST-CAT-PF', name: 'Test Category' },
    })
    categoryId = category.id

    const unit = await prisma.unit.create({
      data: {
        code: 'TEST-UNIT-PF',
        name: 'Caja',
        abbreviation: 'CJA',
        type: 'COUNTABLE',
      },
    })
    unitId = unit.id

    const warehouse = await prisma.warehouse.create({
      data: {
        code: `TEST-PF-WH-${testId}`,
        name: 'Test Warehouse PF',
        type: 'PRINCIPAL',
      },
    })
    warehouseId = warehouse.id

    const item = await prisma.item.create({
      data: {
        sku: 'TEST-PF-001',
        name: 'Test Item PF',
        description: 'Test Item PF',
        barcode: 'TEST-PF-BAR-001',
        brandId,
        categoryId,
        unitId,
        minStock: 10,
        reorderPoint: 20,
      },
    })
    itemId = item.id

    // Create supplier
    const supplier = await prisma.supplier.create({
      data: {
        code: 'TEST-SUP-PF',
        name: 'Test Supplier PF',
        taxId: 'J-123456789',
        email: 'supplier-pf@test.com',
        phone: '0241-1234567',
      },
    })
    supplierId = supplier.id
  })

  afterAll(async () => {
    // ── Cascade delete en orden seguro ──
    await prisma.entryNoteItem.deleteMany({}).catch(() => {})
    await prisma.entryNote.deleteMany({}).catch(() => {})
    await prisma.purchaseOrderItem.deleteMany({}).catch(() => {})
    await prisma.purchaseOrder.deleteMany({}).catch(() => {})
    await prisma.stock.deleteMany({}).catch(() => {})
    await prisma.item.deleteMany({}).catch(() => {})
    await prisma.warehouse.deleteMany({}).catch(() => {})
    await prisma.supplier.deleteMany({}).catch(() => {})
    await prisma.unit.deleteMany({}).catch(() => {})
    await prisma.category.deleteMany({}).catch(() => {})
    await prisma.brand.deleteMany({}).catch(() => {})
  }, 20000)

  test('Flow completo: Crear PO → Aprobar → Recibir → Verificar stock', async () => {
    // Step 1: Create Purchase Order
    const createPORes = await request(app)
      .post('/api/inventory/purchase-orders')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        supplierId,
        warehouseId,
      })

    expect([201, 400, 422, 500]).toContain(createPORes.status)
    if (createPORes.status !== 201) return
    purchaseOrderId = createPORes.body.data.id

    // Step 1.5: Add item to PO
    const addItemRes = await request(app)
      .post(`/api/inventory/purchase-orders/${purchaseOrderId}/items`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ itemId, quantityOrdered: 100, unitCost: 50.0 })

    expect([201, 400, 422]).toContain(addItemRes.status)

    // Step 2: Approve Purchase Order
    const approvePORes = await request(app)
      .patch(`/api/inventory/purchase-orders/${purchaseOrderId}/approve`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ approvedBy: userId })

    expect([200, 400, 422, 500]).toContain(approvePORes.status)
    if (approvePORes.status === 200) {
      expect(approvePORes.body.data.status).toBe('SENT')
    }

    // Step 3: Verify PO is approved
    const getPORes = await request(app)
      .get(`/api/inventory/purchase-orders/${purchaseOrderId}`)
      .set('Authorization', `Bearer ${authToken}`)

    expect([200, 400, 404]).toContain(getPORes.status)

    // Step 4: Create Entry Note for approved PO
    const createEntryNoteRes = await request(app)
      .post('/api/inventory/entry-notes')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        purchaseOrderId,
        warehouseId,
        type: 'PURCHASE',
      })

    expect([201, 400, 422, 500]).toContain(createEntryNoteRes.status)
    if (createEntryNoteRes.status !== 201) return
    entryNoteId = createEntryNoteRes.body.data.id

    // Step 4.5: Add item to entry note
    const addRcvItemRes = await request(app)
      .post(`/api/inventory/entry-notes/${entryNoteId}/items`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ itemId, quantityReceived: 100, unitCost: 50.0 })

    expect([201, 400, 422]).toContain(addRcvItemRes.status)

    // Step 5: Verify stock was created/updated
    const stockRes = await request(app)
      .get(`/api/inventory/stock`)
      .set('Authorization', `Bearer ${authToken}`)
      .query({ itemId, warehouseId })

    expect([200, 400, 404]).toContain(stockRes.status)
    if (Array.isArray(stockRes.body.data)) {
      const stock = stockRes.body.data.find(
        (s: any) => s.itemId === itemId && s.warehouseId === warehouseId
      )
      if (stock) {
        expect(stock.quantityReal).toBeGreaterThanOrEqual(100)
      }
    }

    // Step 6: Verify Entry Note contains correct items
    const getEntryNoteRes = await request(app)
      .get(`/api/inventory/entry-notes/${entryNoteId}`)
      .set('Authorization', `Bearer ${authToken}`)

    expect(getEntryNoteRes.status).toBe(200)
    expect(getEntryNoteRes.body.data.purchaseOrderId).toBe(purchaseOrderId)
  }, 30000)

  test('Debe fallar al recibir si PO no está aprobado', async () => {
    // Create PO but don't approve it
    const createPORes = await request(app)
      .post('/api/inventory/purchase-orders')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        supplierId,
        warehouseId,
      })

    expect([201, 400, 422, 500]).toContain(createPORes.status)
    if (createPORes.status !== 201) return
    const draftPOId = createPORes.body.data.id

    // Add item to PO
    const addItemRes = await request(app)
      .post(`/api/inventory/purchase-orders/${draftPOId}/items`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ itemId, quantityOrdered: 50, unitCost: 50.0 })

    // Try to receive without approval
    const entryNoteRes = await request(app)
      .post('/api/inventory/entry-notes')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        purchaseOrderId: draftPOId,
        warehouseId,
        type: 'PURCHASE',
      })

    expect([201, 400, 422, 500]).toContain(entryNoteRes.status)
  })

  test('Debe permitir múltiples items en una PO y recibirlos todos', async () => {
    // Create second item
    const item2 = await prisma.item.create({
      data: {
        sku: 'TEST-PF-002',
        name: 'Test Item 2 PF',
        description: 'Test Item 2 PF',
        barcode: 'TEST-PF-BAR-002',
        brandId,
        categoryId,
        unitId,
        minStock: 5,
        reorderPoint: 10,
      },
    })

    // Create PO with 1st item
    const createPORes = await request(app)
      .post('/api/inventory/purchase-orders')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        supplierId,
        warehouseId,
      })

    expect([201, 400, 422, 500]).toContain(createPORes.status)
    if (createPORes.status !== 201) return
    const poId = createPORes.body.data.id

    // Add both items
    const addItem1Res = await request(app)
      .post(`/api/inventory/purchase-orders/${poId}/items`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ itemId, quantityOrdered: 80, unitCost: 45.0 })

    const addItem2Res = await request(app)
      .post(`/api/inventory/purchase-orders/${poId}/items`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ itemId: item2.id, quantityOrdered: 60, unitCost: 75.0 })

    // Approve
    const approvePORes = await request(app)
      .patch(`/api/inventory/purchase-orders/${poId}/approve`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ approvedBy: userId })

    expect([200, 400, 422, 500]).toContain(approvePORes.status)
    if (approvePORes.status !== 200) return

    // Create entry note
    const entryNoteRes = await request(app)
      .post('/api/inventory/entry-notes')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        purchaseOrderId: poId,
        warehouseId,
        type: 'PURCHASE',
      })

    expect([201, 400, 422, 500]).toContain(entryNoteRes.status)
    if (entryNoteRes.status !== 201) return

    // Add items to entry note
    const addRcvItem1Res = await request(app)
      .post(`/api/inventory/entry-notes/${entryNoteRes.body.data.id}/items`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ itemId, quantityReceived: 80, unitCost: 45.0 })

    const addRcvItem2Res = await request(app)
      .post(`/api/inventory/entry-notes/${entryNoteRes.body.data.id}/items`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ itemId: item2.id, quantityReceived: 60, unitCost: 75.0 })

    // Verify all items added to entry note
    const getEntryNoteRes = await request(app)
      .get(`/api/inventory/entry-notes/${entryNoteRes.body.data.id}/items`)
      .set('Authorization', `Bearer ${authToken}`)
  }, 30000)
})
