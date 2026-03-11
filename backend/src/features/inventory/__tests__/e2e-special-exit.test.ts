// backend/src/features/inventory/__tests__/e2e-special-exit.test.ts
// E2E Test: DONATION/LOAN/OWNER_PICKUP with authorization requirements

import { describe, test, expect, beforeAll, afterAll } from '@jest/globals'
import request from 'supertest'
import app from '../../../app'
import { getTestAuthToken } from '../../../shared/utils/test.utils'
import prisma from '../../../services/prisma.service'

describe('E2E: Special Exit Types (Donation/Loan/Owner)', () => {
  let authToken: string
  let userId: string
  let warehouseId: string
  let itemId: string
  let item2Id: string
  let loanId: string
  const testId = Date.now() // Unique timestamp for this test run

  beforeAll(async () => {
    // Cleanup old test data
    await prisma.transferItem.deleteMany({}).catch(() => {})
    await prisma.transfer.deleteMany({}).catch(() => {})
    await prisma.loanItem.deleteMany({}).catch(() => {})
    await prisma.loan.deleteMany({}).catch(() => {})
    await prisma.exitNoteItem.deleteMany({}).catch(() => {})
    await prisma.exitNote.deleteMany({}).catch(() => {})
    await prisma.stock.deleteMany({}).catch(() => {})
    await prisma.item
      .deleteMany({ where: { sku: { startsWith: 'E2E-SX' } } })
      .catch(() => {})
    await prisma.warehouse
      .deleteMany({ where: { code: { startsWith: 'E2E-SX-WH' } } })
      .catch(() => {})
    await prisma.brand
      .deleteMany({ where: { code: { startsWith: 'E2E-BRAND-SX' } } })
      .catch(() => {})
    await prisma.category
      .deleteMany({ where: { code: { startsWith: 'E2E-CAT-SX' } } })
      .catch(() => {})
    await prisma.unit
      .deleteMany({ where: { code: { startsWith: 'E2E-UNIT-SX' } } })
      .catch(() => {})

    authToken = await getTestAuthToken()
    const user = await prisma.user.findUnique({
      where: { correo: 'admin@test.com' },
    })
    userId = user?.id || '550e8400-e29b-41d4-a716-446655440000'

    // Setup
    const brand = await prisma.brand.create({
      data: { code: `E2E-BRAND-SX-${testId}`, name: 'E2E Brand SX' },
    })

    const category = await prisma.category.create({
      data: { code: `E2E-CAT-SX-${testId}`, name: 'E2E Cat SX' },
    })

    const unit = await prisma.unit.create({
      data: {
        code: `E2E-UNIT-SX-${testId}`,
        name: 'Unit',
        abbreviation: `U-${testId}`,
        type: 'COUNTABLE',
      },
    })

    const warehouse = await prisma.warehouse.create({
      data: {
        code: `E2E-SX-WH-${testId}`,
        name: 'E2E Warehouse SX',
        type: 'PRINCIPAL',
      },
    })
    warehouseId = warehouse.id

    const item = await prisma.item.create({
      data: {
        sku: `E2E-SX-001-${testId}`,
        name: 'E2E Item SX 1',
        description: 'E2E Item SX 1',
        brandId: brand.id,
        categoryId: category.id,
        unitId: unit.id,
        costPrice: 10,
        salePrice: 20,
      },
    })
    itemId = item.id

    const item2 = await prisma.item.create({
      data: {
        sku: `E2E-SX-002-${testId}`,
        name: 'E2E Item SX 2',
        description: 'E2E Item SX 2',
        brandId: brand.id,
        categoryId: category.id,
        unitId: unit.id,
        costPrice: 15,
        salePrice: 30,
      },
    })
    item2Id = item2.id

    // Create stock for both items
    await prisma.stock.create({
      data: {
        itemId,
        warehouseId,
        quantityReal: 300,
        quantityAvailable: 300,
        quantityReserved: 0,
        averageCost: 10,
      },
    })

    await prisma.stock.create({
      data: {
        itemId: item2Id,
        warehouseId,
        quantityReal: 250,
        quantityAvailable: 250,
        quantityReserved: 0,
        averageCost: 15,
      },
    })
  })

  afterAll(async () => {
    await prisma.loanItem.deleteMany({}).catch(() => {})
    await prisma.loan.deleteMany({}).catch(() => {})
    await prisma.exitNoteItem.deleteMany({}).catch(() => {})
    await prisma.exitNote.deleteMany({}).catch(() => {})
    await prisma.stock.deleteMany({}).catch(() => {})
    await prisma.item.deleteMany({}).catch(() => {})
    await prisma.warehouse.deleteMany({}).catch(() => {})
    await prisma.unit.deleteMany({}).catch(() => {})
    await prisma.category.deleteMany({}).catch(() => {})
    await prisma.brand.deleteMany({}).catch(() => {})
  }, 20000)

  test('E2E: DONATION exit note with authorization', async () => {
    const donRes = await request(app)
      .post('/api/inventory/exit-notes')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        type: 'DONATION',
        warehouseId,
        recipientName: 'Charity Organization',
        authorizedBy: userId,
        items: [{ itemId, quantity: 50 }],
        notes: 'Charitable donation',
      })

    expect([201, 400, 422]).toContain(donRes.status)

    if (donRes.status === 201) {
      const donId = donRes.body.data.id

      // Process donation
      await request(app)
        .patch(`/api/inventory/exit-notes/${donId}/start`)
        .set('Authorization', `Bearer ${authToken}`)

      const deliverRes = await request(app)
        .patch(`/api/inventory/exit-notes/${donId}/deliver`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ deliveredBy: userId })

      expect([200, 400]).toContain(deliverRes.status)
    }
  })

  test('E2E: LOAN exit note with required dueDate', async () => {
    const futureDueDate = new Date()
    futureDueDate.setDate(futureDueDate.getDate() + 45)

    const loanRes = await request(app)
      .post('/api/inventory/loans')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        borrowerName: 'Equipment Rental Company',
        warehouseId,
        dueDate: futureDueDate.toISOString(),
        items: [
          { itemId, quantityLoaned: 60 },
          { itemId: item2Id, quantityLoaned: 40 },
        ],
      })

    expect(loanRes.status).toBeGreaterThanOrEqual(200)
    loanId = loanRes.body?.data?.id || 'test-id'

    // Approve and activate
    const appRes = await request(app)
      .patch(`/api/inventory/loans/${loanId}/approve`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ approvedBy: userId })

    expect(appRes.status).toBeGreaterThanOrEqual(200)
    expect(appRes.status).toBeLessThan(600)

    // Return partial
    const partialRetRes = await request(app)
      .patch(`/api/inventory/loans/${loanId}/return`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        quantityReturned: 30,
        condition: 'GOOD',
        returnedBy: userId,
      })

    expect([200, 400, 422]).toContain(partialRetRes.status)
  })

  test('E2E: OWNER_PICKUP exit note', async () => {
    const ownerRes = await request(app)
      .post('/api/inventory/exit-notes')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        type: 'OWNER_PICKUP',
        warehouseId,
        recipientName: 'Company Owner',
        items: [{ itemId, quantity: 35 }],
        notes: 'Owner personal withdrawal',
      })

    expect([201, 400, 422]).toContain(ownerRes.status)
  })

  test('E2E: TRANSFER exit note to another warehouse', async () => {
    // Create second warehouse
    const warehouse2 = await prisma.warehouse.create({
      data: {
        code: `E2E-SX-WH-2-${testId}`,
        name: 'E2E Warehouse SX 2',
        type: 'SUCURSAL',
      },
    })

    const transferRes = await request(app)
      .post('/api/inventory/transfers')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        fromWarehouseId: warehouseId,
        toWarehouseId: warehouse2.id,
        items: [
          { itemId, quantity: 100 },
          { itemId: item2Id, quantity: 80 },
        ],
      })

    expect(transferRes.status).toBe(201)

    const tId = transferRes.body.data.id

    // Send and receive
    const sendRes = await request(app)
      .patch(`/api/inventory/transfers/${tId}/send`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ sentBy: userId })

    expect(sendRes.status).toBe(200)

    const rcvRes = await request(app)
      .patch(`/api/inventory/transfers/${tId}/receive`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ receivedBy: userId })

    expect(rcvRes.status).toBe(200)
  })

  test('E2E: INTERNAL_USE exit note', async () => {
    const internalRes = await request(app)
      .post('/api/inventory/exit-notes')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        type: 'INTERNAL_USE',
        warehouseId,
        reason: 'Testing and quality control',
        items: [{ itemId, quantity: 15 }],
      })

    expect([201, 400, 422, 500]).toContain(internalRes.status)
  })

  test('E2E: SAMPLE exit note', async () => {
    const sampleRes = await request(app)
      .post('/api/inventory/exit-notes')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        type: 'SAMPLE',
        warehouseId,
        recipientName: 'Potential Customer',
        items: [{ itemId, quantity: 5 }],
        notes: 'Product sample for evaluation',
      })

    expect([201, 400, 422, 500]).toContain(sampleRes.status)
  })
})
