import { describe, test, expect, beforeAll, afterAll, jest } from '@jest/globals'
import request from 'supertest'
import app from '../../../app.js'
import { getTestCredentials } from '../../../shared/utils/test.utils.js'
import prisma from '../../../services/prisma.service.js'

jest.setTimeout(30000)

describe('Purchase Orders API Tests', () => {
  let authToken: string
  let empresaId: string
  let userId: string
  let supplierId: string
  let warehouseId: string
  let itemId: string
  let brandId: string
  let categoryId: string
  let unitId: string

  const auth = (req: any) =>
    req
      .set('Authorization', `Bearer ${authToken}`)
      .set('X-Empresa-Id', empresaId)

  const cleanup = async () => {
    await prisma.movement
      .deleteMany({ where: { item: { sku: { startsWith: 'TEST-PO' } } } })
      .catch(() => {})
    await prisma.entryNoteItem
      .deleteMany({ where: { item: { sku: { startsWith: 'TEST-PO' } } } })
      .catch(() => {})
    await prisma.entryNote
      .deleteMany({
        where: {
          purchaseOrder: { supplier: { code: { startsWith: 'TEST-PO-SUP' } } },
        },
      })
      .catch(() => {})
    if (empresaId) {
      await prisma.auditLog
        .deleteMany({ where: { entity: 'PurchaseOrder', empresaId } })
        .catch(() => {})
    }
    await prisma.purchaseOrderItem
      .deleteMany({
        where: {
          purchaseOrder: { supplier: { code: { startsWith: 'TEST-PO-SUP' } } },
        },
      })
      .catch(() => {})
    await prisma.purchaseOrder
      .deleteMany({
        where: { supplier: { code: { startsWith: 'TEST-PO-SUP' } } },
      })
      .catch(() => {})
    await prisma.stock
      .deleteMany({ where: { item: { sku: { startsWith: 'TEST-PO' } } } })
      .catch(() => {})
    await prisma.itemSupplier
      .deleteMany({ where: { item: { sku: { startsWith: 'TEST-PO' } } } })
      .catch(() => {})
    await prisma.item
      .deleteMany({ where: { sku: { startsWith: 'TEST-PO' } } })
      .catch(() => {})
    await prisma.supplier
      .deleteMany({ where: { code: { startsWith: 'TEST-PO-SUP' } } })
      .catch(() => {})
    await prisma.warehouse
      .deleteMany({ where: { code: { startsWith: 'TEST-PO-WH' } } })
      .catch(() => {})
    await prisma.brand
      .deleteMany({ where: { code: 'TEST-BRAND-PO' } })
      .catch(() => {})
    await prisma.category
      .deleteMany({ where: { code: 'TEST-CAT-PO' } })
      .catch(() => {})
    await prisma.unit
      .deleteMany({ where: { code: 'TEST-UNIT-PO' } })
      .catch(() => {})
  }

  const createOrderWithItems = async (quantityOrdered = 10) => {
    const res = await auth(request(app).post('/api/inventory/purchase-orders'))
      .send({
        supplierId,
        warehouseId,
        notes: 'Orden con items',
        expectedDate: new Date(Date.now() + 86400000).toISOString(),
        items: [
          {
            itemId,
            quantityOrdered,
            unitCost: 45,
            discountPercent: 0,
            taxType: 'IVA',
          },
        ],
      })

    expect(res.status).toBe(201)
    expect(res.body.success).toBe(true)
    return res.body.data
  }

  beforeAll(async () => {
    const credentials = await getTestCredentials()
    authToken = credentials.authToken
    empresaId = credentials.empresaId
    await cleanup()

    const user = await prisma.user.findUnique({
      where: { correo: 'admin@test.com' },
    })
    userId = user!.id

    const brand = await prisma.brand.create({
      data: {
        code: 'TEST-BRAND-PO',
        name: 'Test Brand PO',
        type: 'PART',
        isActive: true,
        empresaId,
      },
    })
    brandId = brand.id

    const category = await prisma.category.create({
      data: {
        code: 'TEST-CAT-PO',
        name: 'Test Category PO',
        isActive: true,
        empresaId,
      },
    })
    categoryId = category.id

    const unit = await prisma.unit.create({
      data: {
        code: 'TEST-UNIT-PO',
        name: 'Test Unit PO',
        abbreviation: 'TUP',
        type: 'COUNTABLE',
        isActive: true,
        empresaId,
      },
    })
    unitId = unit.id

    const supplier = await prisma.supplier.create({
      data: {
        code: 'TEST-PO-SUP-001',
        name: 'Test Supplier PO',
        contactName: 'John Doe',
        email: 'supplier@test.com',
        phone: '123456789',
        empresaId,
      },
    })
    supplierId = supplier.id

    const warehouse = await prisma.warehouse.create({
      data: {
        code: 'TEST-PO-WH-1',
        name: 'PO Warehouse',
        type: 'PRINCIPAL',
        isActive: true,
        empresaId,
      },
    })
    warehouseId = warehouse.id

    const item = await prisma.item.create({
      data: {
        sku: 'TEST-PO-001',
        code: 'TEST-PO-001',
        name: 'Test PO Item',
        brandId,
        categoryId,
        unitId,
        costPrice: 50,
        salePrice: 100,
        isActive: true,
        tags: [],
        empresaId,
      },
    })
    itemId = item.id
  }, 30000)

  afterAll(async () => {
    await cleanup()
  })

  describe('POST /api/inventory/purchase-orders', () => {
    test('crea una orden de compra en DRAFT', async () => {
      const res = await auth(request(app).post('/api/inventory/purchase-orders'))
        .send({
          supplierId,
          warehouseId,
          notes: 'Compra de prueba',
          expectedDate: new Date(Date.now() + 86400000).toISOString(),
        })

      expect(res.status).toBe(201)
      expect(res.body.success).toBe(true)
      expect(res.body.data.status).toBe('DRAFT')
      expect(res.body.data.supplierId).toBe(supplierId)
      expect(res.body.data.warehouseId).toBe(warehouseId)
    })

    test('falla al crear sin supplierId', async () => {
      const res = await auth(request(app).post('/api/inventory/purchase-orders'))
        .send({
          warehouseId,
          notes: 'Sin supplier',
        })

      expect(res.status).toBe(422)
      expect(res.body.success).toBe(false)
    })
  })

  describe('flujo formal de aprobación', () => {
    test('DRAFT -> PENDING_APPROVAL -> APPROVED -> SENT -> PARTIAL -> COMPLETED', async () => {
      const order = await createOrderWithItems(10)

      const blockedPut = await auth(
        request(app).put(`/api/inventory/purchase-orders/${order.id}`)
      ).send({ status: 'SENT' })
      expect(blockedPut.status).toBe(422)

      const submitted = await auth(
        request(app).patch(`/api/inventory/purchase-orders/${order.id}/submit`)
      )
      expect(submitted.status).toBe(200)
      expect(submitted.body.data.status).toBe('PENDING_APPROVAL')
      expect(submitted.body.data.submittedBy).toBe(userId)

      const approved = await auth(
        request(app).patch(`/api/inventory/purchase-orders/${order.id}/approve`)
      ).send({ approvedBy: '00000000-0000-4000-8000-000000000000' })
      expect(approved.status).toBe(200)
      expect(approved.body.data.status).toBe('APPROVED')
      expect(approved.body.data.approvedBy).toBe(userId)

      const receiveWhileApproved = await auth(
        request(app).post(`/api/inventory/purchase-orders/${order.id}/receive`)
      ).send({
        items: [{ itemId, quantityReceived: 1, unitCost: 45 }],
      })
      expect(receiveWhileApproved.status).toBe(400)

      const sent = await auth(
        request(app).patch(`/api/inventory/purchase-orders/${order.id}/send`)
      )
      expect(sent.status).toBe(200)
      expect(sent.body.data.status).toBe('SENT')
      expect(sent.body.data.sentBy).toBe(userId)

      const partial = await auth(
        request(app).post(`/api/inventory/purchase-orders/${order.id}/receive`)
      ).send({
        warehouseId,
        notes: 'Recepción parcial',
        items: [{ itemId, quantityReceived: 4, unitCost: 45 }],
      })
      expect(partial.status).toBe(201)
      expect(partial.body.data.status).toBe('PARTIAL')

      const completed = await auth(
        request(app).post(`/api/inventory/purchase-orders/${order.id}/receive`)
      ).send({
        warehouseId,
        notes: 'Recepción final',
        items: [{ itemId, quantityReceived: 6, unitCost: 45 }],
      })
      expect(completed.status).toBe(201)
      expect(completed.body.data.status).toBe('COMPLETED')

      const audit = await auth(request(app).get('/api/audit-logs')).query({
        entity: 'PurchaseOrder',
        entityId: order.id,
        limit: 50,
      })
      expect(audit.status).toBe(200)
      expect(audit.body.data.map((log: any) => log.action)).toEqual(
        expect.arrayContaining(['SUBMIT', 'APPROVE', 'SEND', 'RECEIVE'])
      )
      expect(
        audit.body.data.every((log: any) => log.empresaId === empresaId)
      ).toBe(true)
    })

    test('rechaza una orden pendiente con motivo obligatorio', async () => {
      const order = await createOrderWithItems(3)

      const submitted = await auth(
        request(app).patch(`/api/inventory/purchase-orders/${order.id}/submit`)
      )
      expect(submitted.status).toBe(200)
      expect(submitted.body.data.status).toBe('PENDING_APPROVAL')

      const missingReason = await auth(
        request(app).patch(`/api/inventory/purchase-orders/${order.id}/reject`)
      ).send({ rejectionReason: '' })
      expect(missingReason.status).toBe(422)

      const rejected = await auth(
        request(app).patch(`/api/inventory/purchase-orders/${order.id}/reject`)
      ).send({ rejectionReason: 'Falta validar condiciones comerciales' })
      expect(rejected.status).toBe(200)
      expect(rejected.body.data.status).toBe('REJECTED')
      expect(rejected.body.data.rejectedBy).toBe(userId)
      expect(rejected.body.data.rejectionReason).toBe(
        'Falta validar condiciones comerciales'
      )

      const updatedRejected = await auth(
        request(app).put(`/api/inventory/purchase-orders/${order.id}`)
      ).send({ notes: 'Notas corregidas tras rechazo' })
      expect(updatedRejected.status).toBe(200)
      expect(updatedRejected.body.data.status).toBe('REJECTED')
    })
  })

  describe('cancelación, items y eliminación', () => {
    test('no permite enviar para aprobación sin items', async () => {
      const createRes = await auth(
        request(app).post('/api/inventory/purchase-orders')
      ).send({
        supplierId,
        warehouseId,
        notes: 'Sin items todavía',
      })
      expect(createRes.status).toBe(201)

      const submitRes = await auth(
        request(app).patch(
          `/api/inventory/purchase-orders/${createRes.body.data.id}/submit`
        )
      )
      expect(submitRes.status).toBe(400)

      const itemRes = await auth(
        request(app).post(
          `/api/inventory/purchase-orders/${createRes.body.data.id}/items`
        )
      ).send({
        itemId,
        quantityOrdered: 2,
        unitCost: 45,
        taxType: 'IVA',
      })
      expect(itemRes.status).toBe(201)
    })

    test('cancela una orden no completada', async () => {
      const order = await createOrderWithItems(2)

      const res = await auth(
        request(app).patch(`/api/inventory/purchase-orders/${order.id}/cancel`)
      )
      expect(res.status).toBe(200)
      expect(res.body.data.status).toBe('CANCELLED')
    })

    test('elimina una orden editable', async () => {
      const createRes = await auth(
        request(app).post('/api/inventory/purchase-orders')
      ).send({
        supplierId,
        warehouseId,
        notes: 'Para eliminar',
      })
      expect(createRes.status).toBe(201)

      const res = await auth(
        request(app).delete(
          `/api/inventory/purchase-orders/${createRes.body.data.id}`
        )
      )
      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
    })
  })
})
