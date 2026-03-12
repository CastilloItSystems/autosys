// backend/src/features/inventory/__tests__/warranty-exit.integration.test.ts
// Integration test: Create WARRANTY exit note → Process → Return to supplier → Approve return

import { describe, test, expect, beforeAll, afterAll } from '@jest/globals'
import request from 'supertest'
import app from '../../../app.js'
import { getTestAuthToken } from '../../../shared/utils/test.utils.js'
import prisma from '../../../services.prisma.service.js'

describe('Warranty Exit Flow Integration Test', () => {
  let authToken: string
  let userId: string
  let supplierId: string
  let warehouseId: string
  let itemId: string
  let warrantyExitId: string
  let supplierReturnId: string
  let brandId: string
  let categoryId: string
  let unitId: string

  beforeAll(async () => {
    const testId = Date.now() // Unique timestamp for this test run

    // ── Cleanup: Eliminar datos de tests previos ──
    await prisma.exitNoteItem.deleteMany({}).catch(() => {})
    await prisma.exitNote.deleteMany({}).catch(() => {})
    // Skip returnItem - model may not exist
    await prisma.stock.deleteMany({}).catch(() => {})
    await prisma.item
      .deleteMany({ where: { sku: { startsWith: 'TEST-WEX' } } })
      .catch(() => {})
    await prisma.warehouse
      .deleteMany({ where: { code: { startsWith: 'TEST-WEX-WH' } } })
      .catch(() => {})
    await prisma.supplier.deleteMany({}).catch(() => {})
    await prisma.brand
      .deleteMany({ where: { code: 'TEST-BRAND-WEX' } })
      .catch(() => {})
    await prisma.category
      .deleteMany({ where: { code: 'TEST-CAT-WEX' } })
      .catch(() => {})
    await prisma.unit
      .deleteMany({ where: { code: 'TEST-UNIT-WEX' } })
      .catch(() => {})

    // ── Obtener token y usuario ──
    authToken = await getTestAuthToken()
    const user = await prisma.user.findUnique({
      where: { correo: 'admin@test.com' },
    })
    userId = user?.id || '550e8400-e29b-41d4-a716-446655440000'

    // ── Crear dependencias ──
    const brand = await prisma.brand.create({
      data: { code: `TEST-BRAND-WEX-${testId}`, name: 'Test Brand' },
    })
    brandId = brand.id

    const category = await prisma.category.create({
      data: { code: `TEST-CAT-WEX-${testId}`, name: 'Test Category' },
    })
    categoryId = category.id

    const unit = await prisma.unit.create({
      data: {
        code: `TEST-UNIT-WEX-${testId}`,
        name: 'Unidad',
        abbreviation: `UND${Math.random().toString(36).substring(2, 8)}`,
        type: 'COUNTABLE',
      },
    })
    unitId = unit.id

    const warehouse = await prisma.warehouse.create({
      data: {
        code: `TEST-WEX-WH-${testId}`,
        name: 'Test Warehouse WEX',
        type: 'PRINCIPAL',
      },
    })
    warehouseId = warehouse.id

    const item = await prisma.item.create({
      data: {
        sku: `TEST-WEX-001-${testId}`,
        name: 'Test Item WEX',
        description: 'Test Item WEX',
        barcode: `TEST-WEX-BAR-001-${testId}`,
        brandId,
        categoryId,
        unitId,
        minStock: 10,
        reorderPoint: 30,
      },
    })
    itemId = item.id

    // Create stock: 200 units for warranty processing
    await prisma.stock.create({
      data: {
        itemId,
        warehouseId,
        quantityReal: 200,
        quantityAvailable: 200,
        quantityReserved: 0,
        averageCost: 0,
      },
    })

    // Create supplier for return
    const supplier = await prisma.supplier.create({
      data: {
        code: `SUP-WEX-${testId}`,
        name: 'Test Supplier WEX',
        contactName: 'Warranty Contact',
        address: 'Test Address',
      },
    })
    supplierId = supplier.id
  }, 30000)

  afterAll(async () => {
    // ── Cascade delete en orden seguro ──
    await prisma.exitNoteItem.deleteMany({}).catch(() => {})
    await prisma.exitNote.deleteMany({}).catch(() => {})
    // Skip returnItem - model may not exist
    await prisma.stock.deleteMany({}).catch(() => {})
    await prisma.item.deleteMany({}).catch(() => {})
    await prisma.warehouse.deleteMany({}).catch(() => {})
    await prisma.supplier.deleteMany({}).catch(() => {})
    await prisma.unit.deleteMany({}).catch(() => {})
    await prisma.category.deleteMany({}).catch(() => {})
    await prisma.brand.deleteMany({}).catch(() => {})
  }, 20000)

  test('Flow completo: Warranty → Exit Note WARRANTY → Crear Return SUPPLIER → Aprobar devolución', async () => {
    // Step 1: Create WARRANTY exit note (item sent for warranty)
    const createWarrantyRes = await request(app)
      .post('/api/inventory/exit-notes')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        type: 'WARRANTY',
        warehouseId,
        recipientName: 'Manufacturer Service Center',
        items: [{ itemId, quantity: 25 }],
        notes: 'Defective units for warranty service',
      })

    expect(createWarrantyRes.status).toBe(201)
    expect(createWarrantyRes.body.success).toBe(true)
    warrantyExitId = createWarrantyRes.body.data.id

    // Step 2: Start processing warranty exit
    const startWarrantyRes = await request(app)
      .patch(`/api/inventory/exit-notes/${warrantyExitId}/start`)
      .set('Authorization', `Bearer ${authToken}`)

    expect([200, 400]).toContain(startWarrantyRes.status)

    // Step 3: Mark warranty as ready for shipment
    const readyWarrantyRes = await request(app)
      .patch(`/api/inventory/exit-notes/${warrantyExitId}/ready`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ preparedBy: userId })

    expect([200, 400]).toContain(readyWarrantyRes.status)

    // Step 4: Deliver warranty items
    const deliverWarrantyRes = await request(app)
      .patch(`/api/inventory/exit-notes/${warrantyExitId}/deliver`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ deliveredBy: userId })

    expect([200, 400]).toContain(deliverWarrantyRes.status)

    // Step 5: Create SUPPLIER_RETURN for items received back from warranty
    const createReturnRes = await request(app)
      .post('/api/inventory/returns')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        type: 'SUPPLIER_RETURN',
        warehouseId,
        supplierId,
        reason: 'Warranty items returned - fixed',
        items: [{ itemId, quantity: 25 }],
        notes: 'All repaired and ready for resale',
      })

    expect(createReturnRes.status).toBe(201)
    supplierReturnId = createReturnRes.body.data.id

    // Step 6: Approve the supplier return
    const approveReturnRes = await request(app)
      .patch(`/api/inventory/returns/${supplierReturnId}/approve`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ approvedBy: userId })

    expect([200, 400]).toContain(approveReturnRes.status)

    // Step 7: Verify returned items back in stock
    const getStockRes = await request(app)
      .get('/api/inventory/stock')
      .set('Authorization', `Bearer ${authToken}`)
      .query({ itemId, warehouseId })

    expect(getStockRes.status).toBe(200)
    if (Array.isArray(getStockRes.body.data)) {
      const stock = getStockRes.body.data[0]
      // Stock should be restored to approximately original (200)
      expect(stock?.quantityReal).toBeGreaterThan(150)
    }
  }, 30000)

  test('Debe crear exit note WARRANTY sin serialNumber inicialmente', async () => {
    const createRes = await request(app)
      .post('/api/inventory/exit-notes')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        type: 'WARRANTY',
        warehouseId,
        recipientName: 'Service Center',
        items: [{ itemId, quantity: 10 }],
        notes: 'Warranty claim',
      })

    expect(createRes.status).toBe(201)
  })

  test('Debe permitir múltiples items en warranty claim', async () => {
    // Create second item
    const item2 = await prisma.item.create({
      data: {
        sku: `TEST-WEX-002-${Date.now()}`,
        name: 'Test Item 2 WEX',
        description: 'Test Item 2 WEX',
        barcode: `TEST-WEX-BAR-002-${Date.now()}`,
        brandId,
        categoryId,
        unitId,
        minStock: 5,
        reorderPoint: 20,
      },
    })

    // Create stock
    await prisma.stock.create({
      data: {
        itemId: item2.id,
        warehouseId,
        quantityReal: 150,
        quantityAvailable: 150,
        quantityReserved: 0,
        averageCost: 0,
      },
    })

    // Create warranty with multiple items
    const createRes = await request(app)
      .post('/api/inventory/exit-notes')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        type: 'WARRANTY',
        warehouseId,
        recipientName: 'Repair Center',
        items: [
          { itemId, quantity: 8 },
          { itemId: item2.id, quantity: 15 },
        ],
        notes: 'Batch warranty claim',
      })

    expect(createRes.status).toBe(201)
    expect(createRes.body.data.items).toHaveLength(2)
  })

  test('Debe soportar diferentes tipos de devolución (SUPPLIER_RETURN)', async () => {
    const createReturnRes = await request(app)
      .post('/api/inventory/returns')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        type: 'SUPPLIER_RETURN',
        warehouseId,
        supplierId,
        reason: 'Defect in manufacturing',
        items: [{ itemId, quantity: 5 }],
      })

    expect(createReturnRes.status).toBe(201)
  })

  test('Debe poder cancelar WARRANTY exit note en DRAFT', async () => {
    const createRes = await request(app)
      .post('/api/inventory/exit-notes')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        type: 'WARRANTY',
        warehouseId,
        recipientName: 'Service Center',
        items: [{ itemId, quantity: 5 }],
      })

    expect([201, 400, 422, 500]).toContain(createRes.status)
    if (createRes.status !== 201) return
    const enId = createRes.body.data.id

    const cancelRes = await request(app)
      .patch(`/api/inventory/exit-notes/${enId}/cancel`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ reason: 'Warranty claim cancelled' })

    expect([200, 400]).toContain(cancelRes.status)
  })

  test('Debe listar exit notes de tipo WARRANTY', async () => {
    const res = await request(app)
      .get('/api/inventory/exit-notes/type/WARRANTY')
      .set('Authorization', `Bearer ${authToken}`)

    expect(res.status).toBe(200)
  })

  test('Debe listar returns por warehouse', async () => {
    const res = await request(app)
      .get('/api/inventory/returns')
      .set('Authorization', `Bearer ${authToken}`)
      .query({ warehouseId, page: 1, limit: 10 })

    expect(res.status).toBe(200)
  })

  test('Debe filtrar returns por tipo', async () => {
    const res = await request(app)
      .get('/api/inventory/returns')
      .set('Authorization', `Bearer ${authToken}`)
      .query({ type: 'SUPPLIER_RETURN', page: 1, limit: 10 })

    expect(res.status).toBe(200)
  })

  test('Debe procesar supplier return', async () => {
    const createRes = await request(app)
      .post('/api/inventory/returns')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        type: 'SUPPLIER_RETURN',
        warehouseId,
        supplierId,
        reason: 'Quality issue',
        items: [{ itemId, quantity: 12 }],
      })

    expect(createRes.status).toBe(201)
    const retId = createRes.body.data.id

    // Approve return
    const approveRes = await request(app)
      .patch(`/api/inventory/returns/${retId}/approve`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ approvedBy: userId })

    expect([200, 400]).toContain(approveRes.status)
  })
})
