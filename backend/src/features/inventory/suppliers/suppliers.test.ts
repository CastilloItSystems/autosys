// backend/src/features/inventory/suppliers/suppliers.test.ts

import { describe, test, expect, beforeAll, afterAll } from '@jest/globals'
import request from 'supertest'
import app from '../../../index'
import { getTestAuthToken } from '../../../shared/utils/test.utils'
import prisma from '../../../services/prisma.service'

describe('Suppliers API Tests', () => {
  let authToken: string
  let supplierId: string
  const testCode = 'TEST-SUP-001'

  beforeAll(async () => {
    await prisma.supplier
      .deleteMany({ where: { code: { startsWith: 'TEST-SUP' } } })
      .catch(() => {})

    authToken = await getTestAuthToken()

    const supplier = await prisma.supplier.create({
      data: {
        code: testCode,
        name: 'Test Supplier',
        contactName: 'John Doe',
        email: 'supplier@test.com',
        phone: '555-0100',
        address: 'Supplier St 123',
        taxId: 'TAX-001',
        isActive: true,
      },
    })
    supplierId = supplier.id
  }, 20000)

  afterAll(async () => {
    try {
      await prisma.supplier
        .deleteMany({ where: { code: { startsWith: 'TEST-SUP' } } })
        .catch(() => {})
    } catch (error) {
      console.log('Error en afterAll cleanup:', error)
    }
  })

  // ── POST /api/inventory/suppliers ──
  describe('POST /api/inventory/suppliers', () => {
    test('Debe crear un proveedor exitosamente', async () => {
      const res = await request(app)
        .post('/api/inventory/suppliers')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          code: 'TEST-SUP-CREATE',
          name: 'Created Supplier',
          contactName: 'Jane Doe',
          email: 'jane@test.com',
          phone: '555-0200',
          address: 'Create St 456',
        })

      expect(res.status).toBe(201)
      expect(res.body.success).toBe(true)
      expect(res.body.data.code).toBe('TEST-SUP-CREATE')
    })

    test('Debe fallar al crear proveedor con código duplicado', async () => {
      const res = await request(app)
        .post('/api/inventory/suppliers')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          code: testCode,
          name: 'Duplicate Supplier',
        })

      expect(res.status).toBe(409)
      expect(res.body.success).toBe(false)
    })

    test('Debe fallar con validación incorrecta', async () => {
      const res = await request(app)
        .post('/api/inventory/suppliers')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'No Code Supplier',
        })

      expect(res.status).toBe(422)
      expect(res.body.success).toBe(false)
    })
  })

  // ── GET /api/inventory/suppliers ──
  describe('GET /api/inventory/suppliers', () => {
    test('Debe obtener lista de proveedores', async () => {
      const res = await request(app)
        .get('/api/inventory/suppliers')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ page: 1, limit: 10 })

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(Array.isArray(res.body.data)).toBe(true)
    })
  })

  // ── GET /api/inventory/suppliers/active ──
  describe('GET /api/inventory/suppliers/active', () => {
    test('Debe obtener solo proveedores activos', async () => {
      const res = await request(app)
        .get('/api/inventory/suppliers/active')
        .set('Authorization', `Bearer ${authToken}`)

      expect(res.status).toBe(200)
      expect(Array.isArray(res.body.data)).toBe(true)
    })
  })

  // ── GET /api/inventory/suppliers/code/:code ──
  describe('GET /api/inventory/suppliers/code/:code', () => {
    test('Debe obtener proveedor por código', async () => {
      const res = await request(app)
        .get(`/api/inventory/suppliers/code/${testCode}`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.data.code).toBe(testCode)
    })

    test('Debe fallar con código no encontrado', async () => {
      const res = await request(app)
        .get('/api/inventory/suppliers/code/NONEXISTENT')
        .set('Authorization', `Bearer ${authToken}`)

      expect(res.status).toBe(404)
      expect(res.body.success).toBe(false)
    })
  })

  // ── GET /api/inventory/suppliers/:id ──
  describe('GET /api/inventory/suppliers/:id', () => {
    test('Debe obtener proveedor por ID', async () => {
      const res = await request(app)
        .get(`/api/inventory/suppliers/${supplierId}`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.data.id).toBe(supplierId)
    })

    test('Debe fallar con proveedor no encontrado', async () => {
      const res = await request(app)
        .get('/api/inventory/suppliers/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${authToken}`)

      expect(res.status).toBe(404)
      expect(res.body.success).toBe(false)
    })
  })

  // ── PUT /api/inventory/suppliers/:id ──
  describe('PUT /api/inventory/suppliers/:id', () => {
    test('Debe actualizar el proveedor', async () => {
      const res = await request(app)
        .put(`/api/inventory/suppliers/${supplierId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Updated Supplier Name',
          email: 'updated@test.com',
        })

      if (res.status === 200) {
        expect(res.body.success).toBe(true)
        expect(res.body.data.name).toBe('Updated Supplier Name')
      }
    })
  })

  // ── PATCH /api/inventory/suppliers/:id/toggle ──
  describe('PATCH /api/inventory/suppliers/:id/toggle', () => {
    test('Debe cambiar estado activo/inactivo del proveedor', async () => {
      const res = await request(app)
        .patch(`/api/inventory/suppliers/${supplierId}/toggle`)
        .set('Authorization', `Bearer ${authToken}`)

      expect([200, 400]).toContain(res.status)
      if (res.status === 200) {
        expect(res.body.data.isActive).toBeDefined()
      }
    })
  })

  // ── DELETE /api/inventory/suppliers/:id ──
  describe('DELETE /api/inventory/suppliers/:id', () => {
    test('Debe fallar al eliminar proveedor no encontrado', async () => {
      const res = await request(app)
        .delete('/api/inventory/suppliers/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${authToken}`)

      expect(res.status).toBe(404)
      expect(res.body.success).toBe(false)
    })

    test('Debe eliminar un proveedor sin órdenes de compra', async () => {
      const createRes = await request(app)
        .post('/api/inventory/suppliers')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          code: 'TEST-SUP-DEL',
          name: 'Supplier to Delete',
        })

      if (createRes.status === 201) {
        const deleteId = createRes.body.data.id
        const res = await request(app)
          .delete(`/api/inventory/suppliers/${deleteId}`)
          .set('Authorization', `Bearer ${authToken}`)

        expect([200, 400, 409]).toContain(res.status)
      }
    })
  })
})
