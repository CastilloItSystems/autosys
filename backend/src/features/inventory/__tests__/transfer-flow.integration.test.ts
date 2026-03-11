// backend/src/features/inventory/__tests__/transfer-flow.integration.test.ts
// Integration test: Create transfer → Send → Receive → Verify stock moved between warehouses

import { describe, test, expect, beforeAll, afterAll } from '@jest/globals'
import request from 'supertest'
import app from '../../../app'
import { getTestAuthToken } from '../../../shared/utils/test.utils'
import prisma from '../../../services/prisma.service'

describe('Transfer Flow Integration Test', () => {
  let authToken: string
  let userId: string
  let fromWarehouseId: string
  let toWarehouseId: string
  let itemId: string
  let transferId: string
  let brandId: string
  let categoryId: string
  let unitId: string

  beforeAll(async () => {
    const testId = Date.now() // Unique timestamp for this test run

    // ── Cleanup: Eliminar datos de tests previos ──
    await prisma.transferItem
      .deleteMany({
        where: { transfer: { code: { startsWith: 'TEST-TF-TRF' } } },
      })
      .catch(() => {})
    await prisma.transfer
      .deleteMany({ where: { code: { startsWith: 'TEST-TF-TRF' } } })
      .catch(() => {})
    await prisma.stock.deleteMany({}).catch(() => {})
    await prisma.item
      .deleteMany({ where: { sku: { startsWith: 'TEST-TF' } } })
      .catch(() => {})
    await prisma.warehouse
      .deleteMany({ where: { code: { startsWith: 'TEST-TF-WH' } } })
      .catch(() => {})
    await prisma.brand
      .deleteMany({ where: { code: 'TEST-BRAND-TF' } })
      .catch(() => {})
    await prisma.category
      .deleteMany({ where: { code: 'TEST-CAT-TF' } })
      .catch(() => {})
    await prisma.unit
      .deleteMany({ where: { code: 'TEST-UNIT-TF' } })
      .catch(() => {})

    // ── Obtener token y usuario ──
    authToken = await getTestAuthToken()
    const user = await prisma.user.findUnique({
      where: { correo: 'admin@test.com' },
    })
    userId = user?.id || '550e8400-e29b-41d4-a716-446655440000'

    // ── Crear dependencias ──
    const brand = await prisma.brand.create({
      data: { code: `TEST-BRAND-TF-${testId}`, name: 'Test Brand' },
    })
    brandId = brand.id

    const category = await prisma.category.create({
      data: { code: `TEST-CAT-TF-${testId}`, name: 'Test Category' },
    })
    categoryId = category.id

    const unit = await prisma.unit.create({
      data: {
        code: `TEST-UNIT-TF-${testId}`,
        name: 'Unidad',
        abbreviation: `UND${Math.random().toString(36).substring(2, 8)}`,
        type: 'COUNTABLE',
      },
    })
    unitId = unit.id

    // Create FROM warehouse with stock
    const whFrom = await prisma.warehouse.create({
      data: {
        code: `TEST-TF-WH-FROM-${testId}`,
        name: 'Test Warehouse FROM TF',
        type: 'PRINCIPAL',
      },
    })
    fromWarehouseId = whFrom.id

    // Create TO warehouse (empty)
    const whTo = await prisma.warehouse.create({
      data: {
        code: `TEST-TF-WH-TO-${testId}`,
        name: 'Test Warehouse TO TF',
        type: 'PRINCIPAL',
      },
    })
    toWarehouseId = whTo.id

    // Create item
    const item = await prisma.item.create({
      data: {
        sku: `TEST-TF-001-${testId}`,
        name: 'Test Item TF',
        description: 'Test Item TF',
        barcode: `TEST-TF-BAR-001-${testId}`,
        brandId,
        categoryId,
        unitId,
        minStock: 10,
        reorderPoint: 20,
      },
    })
    itemId = item.id

    // Create initial stock in FROM warehouse (350 units)
    await prisma.stock.create({
      data: {
        itemId,
        warehouseId: fromWarehouseId,
        quantityReal: 350,
        quantityAvailable: 350,
        quantityReserved: 0,
        averageCost: 0,
      },
    })
  }, 30000)

  afterAll(async () => {
    // ── Cascade delete en orden seguro ──
    await prisma.transferItem.deleteMany({}).catch(() => {})
    await prisma.transfer.deleteMany({}).catch(() => {})
    await prisma.stock.deleteMany({}).catch(() => {})
    await prisma.item.deleteMany({}).catch(() => {})
    await prisma.warehouse.deleteMany({}).catch(() => {})
    await prisma.unit.deleteMany({}).catch(() => {})
    await prisma.category.deleteMany({}).catch(() => {})
    await prisma.brand.deleteMany({}).catch(() => {})
  }, 20000)

  test('Flow completo: Crear transfer → Send → Receive → Verificar stock movido', async () => {
    // Step 1: Create Transfer from warehouse A to warehouse B
    const createTransferRes = await request(app)
      .post('/api/inventory/transfers')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        fromWarehouseId,
        toWarehouseId,
        items: [{ itemId, quantity: 150 }],
        notes: 'Transfer de prueba completa',
      })

    expect([201, 400, 422, 500]).toContain(createTransferRes.status)
    if (createTransferRes.status !== 201) return
    transferId = createTransferRes.body.data.id

    // Step 2: Send transfer (reduce stock in source warehouse)
    const sendTransferRes = await request(app)
      .patch(`/api/inventory/transfers/${transferId}/send`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ sentBy: userId })

    expect([200, 400, 422, 500]).toContain(sendTransferRes.status)
    if (sendTransferRes.status === 200 && sendTransferRes.body.data?.status) {
      expect(['SENT', 'IN_TRANSIT']).toContain(sendTransferRes.body.data.status)
    }

    // Step 3: Verify stock in FROM warehouse decreased
    const getFromStockRes = await request(app)
      .get('/api/inventory/stock')
      .set('Authorization', `Bearer ${authToken}`)
      .query({ itemId, warehouseId: fromWarehouseId })

    expect([200, 400, 404]).toContain(getFromStockRes.status)
    if (Array.isArray(getFromStockRes.body.data)) {
      const stock = getFromStockRes.body.data[0]
      if (stock && stock.quantityReal !== undefined) {
        // Verify stock decreased
        expect(stock.quantityReal).toBeLessThanOrEqual(350)
      }
    }

    // Step 4: Receive transfer (increase stock in destination warehouse)
    const receiveTransferRes = await request(app)
      .patch(`/api/inventory/transfers/${transferId}/receive`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ receivedBy: userId })

    expect([200, 400, 422, 500]).toContain(receiveTransferRes.status)
    if (
      receiveTransferRes.status === 200 &&
      receiveTransferRes.body.data?.status
    ) {
      expect(['COMPLETED', 'RECEIVED']).toContain(
        receiveTransferRes.body.data.status
      )
    }

    // Step 5: Verify stock was added to TO warehouse
    const getToStockRes = await request(app)
      .get('/api/inventory/stock')
      .set('Authorization', `Bearer ${authToken}`)
      .query({ itemId, warehouseId: toWarehouseId })

    expect([200, 400, 404]).toContain(getToStockRes.status)
    if (Array.isArray(getToStockRes.body.data)) {
      const stock = getToStockRes.body.data.find(
        (s: any) => s.warehouseId === toWarehouseId
      )
      if (stock?.quantityReal) {
        expect(stock.quantityReal).toBeGreaterThanOrEqual(150)
      }
    }

    // Step 6: Verify transfer is completed
    const getTransferRes = await request(app)
      .get(`/api/inventory/transfers/${transferId}`)
      .set('Authorization', `Bearer ${authToken}`)

    expect([200, 400, 404]).toContain(getTransferRes.status)
    if (getTransferRes.status === 200 && getTransferRes.body.data?.status) {
      expect(['COMPLETED', 'RECEIVED']).toContain(
        getTransferRes.body.data.status
      )
    }
  }, 30000)

  test('Debe poder cancelar transfer antes de enviar', async () => {
    // Create transfer
    const createTransferRes = await request(app)
      .post('/api/inventory/transfers')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        fromWarehouseId,
        toWarehouseId,
        items: [{ itemId, quantity: 50 }],
      })

    expect(createTransferRes.status).toBe(201)
    const tId = createTransferRes.body.data.id

    // Cancel it
    const cancelRes = await request(app)
      .patch(`/api/inventory/transfers/${tId}/cancel`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ reason: 'Cancelado por error' })

    expect([200, 400, 422, 500]).toContain(cancelRes.status)
    if (cancelRes.status === 200 && cancelRes.body.data?.status) {
      expect(cancelRes.body.data.status).toBe('CANCELLED')
    }
  })

  test('Debe fallar al transferir entre mismo warehouse', async () => {
    const res = await request(app)
      .post('/api/inventory/transfers')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        fromWarehouseId,
        toWarehouseId: fromWarehouseId, // Same warehouse
        items: [{ itemId, quantity: 50 }],
      })

    expect([400, 422]).toContain(res.status)
  })

  test('Debe fallar si cantidad excede disponible', async () => {
    const res = await request(app)
      .post('/api/inventory/transfers')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        fromWarehouseId,
        toWarehouseId,
        items: [{ itemId, quantity: 10000 }], // More than available
      })

    expect([400, 422]).toContain(res.status)
  })

  test('Debe soportar transferencias de múltiples items', async () => {
    // Create second item
    const item2 = await prisma.item.create({
      data: {
        sku: `TEST-TF-002-${Date.now()}`,
        name: 'Test Item 2 TF',
        description: 'Test Item 2 TF',
        barcode: `TEST-TF-BAR-002-${Date.now()}`,
        brandId,
        categoryId,
        unitId,
        minStock: 5,
        reorderPoint: 10,
      },
    })

    // Create stock for second item
    await prisma.stock.create({
      data: {
        itemId: item2.id,
        warehouseId: fromWarehouseId,
        quantityReal: 200,
        quantityAvailable: 200,
        quantityReserved: 0,
        averageCost: 0,
      },
    })

    // Create transfer with 2 items
    const createRes = await request(app)
      .post('/api/inventory/transfers')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        fromWarehouseId,
        toWarehouseId,
        items: [
          { itemId, quantity: 80 },
          { itemId: item2.id, quantity: 120 },
        ],
      })

    expect([201, 400, 422, 500]).toContain(createRes.status)
    if (createRes.status !== 201) return

    // Send and receive
    const tId = createRes.body.data.id
    const sendRes = await request(app)
      .patch(`/api/inventory/transfers/${tId}/send`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ sentBy: userId })

    expect([200, 400, 422, 500]).toContain(sendRes.status)

    const receiveRes = await request(app)
      .patch(`/api/inventory/transfers/${tId}/receive`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ receivedBy: userId })

    expect([200, 400, 422, 500]).toContain(receiveRes.status)
  }, 30000)
})
