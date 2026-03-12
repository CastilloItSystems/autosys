// backend/src/features/inventory/warehouses/warehouses.test.ts

import { describe, test, expect, beforeAll, afterAll } from '@jest/globals'
import request from 'supertest'
import app from '../../../app.js'
import {
  getTestAuthToken,
  getTestEmpresaId,
} from '../../../shared/utils/test.utils.js'
import prisma from '../../../services/prisma.service.js'

describe('Warehouses API Tests', () => {
  let authToken: string
  let empresaId: string
  let warehouseId: string
  const testCode = 'TEST-WH-001'

  beforeAll(async () => {
    authToken = await getTestAuthToken()
    empresaId = await getTestEmpresaId()

    // Limpiar datos de prueba anteriores
    await prisma.warehouse
      .deleteMany({ where: { code: { startsWith: 'TEST-WH' }, empresaId } })
      .catch(() => {})

    // Crear warehouse de prueba
    const wh = await prisma.warehouse.create({
      data: {
        code: testCode,
        name: 'Test Warehouse',
        type: 'PRINCIPAL',
        address: 'Test Address 123',
        isActive: true,
        empresaId,
      },
    })
    warehouseId = wh.id
  }, 20000)

  afterAll(async () => {
    await prisma.warehouse
      .deleteMany({ where: { code: { startsWith: 'TEST-WH' }, empresaId } })
      .catch(() => {})
  })

  // ── POST /api/inventory/warehouses ──
  describe('POST /api/inventory/warehouses', () => {
    test('Debe crear un almacén exitosamente', async () => {
      const res = await request(app)
        .post('/api/inventory/warehouses')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Empresa-Id', empresaId)
        .send({
          code: 'TEST-WH-CREATE',
          name: 'Warehouse Created',
          type: 'SUCURSAL',
          address: 'Av. Test 456',
        })

      expect(res.status).toBe(201)
      expect(res.body.success).toBe(true)
      expect(res.body.data.code).toBe('TEST-WH-CREATE')
      expect(res.body.data.type).toBe('SUCURSAL')
    })

    test('Debe fallar al crear almacén con código duplicado', async () => {
      const res = await request(app)
        .post('/api/inventory/warehouses')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Empresa-Id', empresaId)
        .send({
          code: testCode,
          name: 'Duplicate Warehouse',
          type: 'PRINCIPAL',
        })

      expect(res.status).toBe(409)
      expect(res.body.success).toBe(false)
    })

    test('Debe fallar con validación incorrecta (sin name)', async () => {
      const res = await request(app)
        .post('/api/inventory/warehouses')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Empresa-Id', empresaId)
        .send({ code: 'TEST-WH-INVALID' })

      expect(res.status).toBe(422)
      expect(res.body.success).toBe(false)
    })
  })

  // ── GET /api/inventory/warehouses ──
  describe('GET /api/inventory/warehouses', () => {
    test('Debe obtener lista de almacenes', async () => {
      const res = await request(app)
        .get('/api/inventory/warehouses')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Empresa-Id', empresaId)
        .query({ page: 1, limit: 10 })

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(Array.isArray(res.body.data)).toBe(true)
    })
  })

  // ── GET /api/inventory/warehouses/active ──
  describe('GET /api/inventory/warehouses/active', () => {
    test('Debe obtener solo almacenes activos', async () => {
      const res = await request(app)
        .get('/api/inventory/warehouses/active')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Empresa-Id', empresaId)

      expect(res.status).toBe(200)
      expect(Array.isArray(res.body.data)).toBe(true)
    })
  })

  // ── GET /api/inventory/warehouses/search ──
  describe('GET /api/inventory/warehouses/search', () => {
    test('Debe buscar almacenes por término', async () => {
      const res = await request(app)
        .get('/api/inventory/warehouses/search')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Empresa-Id', empresaId)
        .query({ term: 'Test' })

      expect(res.status).toBe(200)
      expect(Array.isArray(res.body.data)).toBe(true)
    })
  })

  // ── GET /api/inventory/warehouses/:id ──
  describe('GET /api/inventory/warehouses/:id', () => {
    test('Debe obtener un almacén por ID', async () => {
      const res = await request(app)
        .get(`/api/inventory/warehouses/${warehouseId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Empresa-Id', empresaId)

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.data.id).toBe(warehouseId)
      expect(res.body.data.code).toBe(testCode)
    })

    test('Debe fallar con almacén no encontrado', async () => {
      const res = await request(app)
        .get('/api/inventory/warehouses/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Empresa-Id', empresaId)

      expect(res.status).toBe(404)
      expect(res.body.success).toBe(false)
    })
  })

  // ── PUT /api/inventory/warehouses/:id ──
  describe('PUT /api/inventory/warehouses/:id', () => {
    test('Debe actualizar el almacén', async () => {
      const res = await request(app)
        .put(`/api/inventory/warehouses/${warehouseId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Empresa-Id', empresaId)
        .send({
          name: 'Updated Warehouse Name',
          address: 'Updated Address 789',
        })

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.data.name).toBe('Updated Warehouse Name')
    })
  })

  // ── PATCH /api/inventory/warehouses/:id/deactivate ──
  describe('PATCH /api/inventory/warehouses/:id/deactivate', () => {
    test('Debe desactivar el almacén', async () => {
      const res = await request(app)
        .patch(`/api/inventory/warehouses/${warehouseId}/deactivate`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Empresa-Id', empresaId)

      expect(res.status).toBe(200)
      expect(res.body.data.isActive).toBe(false)
    })
  })

  // ── PATCH /api/inventory/warehouses/:id/activate ──
  describe('PATCH /api/inventory/warehouses/:id/activate', () => {
    test('Debe activar el almacén', async () => {
      const res = await request(app)
        .patch(`/api/inventory/warehouses/${warehouseId}/activate`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Empresa-Id', empresaId)

      expect(res.status).toBe(200)
      expect(res.body.data.isActive).toBe(true)
    })
  })

  // ── DELETE /api/inventory/warehouses/:id ──
  describe('DELETE /api/inventory/warehouses/:id', () => {
    test('Debe fallar con almacén no encontrado', async () => {
      const res = await request(app)
        .delete(
          '/api/inventory/warehouses/00000000-0000-0000-0000-000000000000'
        )
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Empresa-Id', empresaId)

      expect(res.status).toBe(404)
      expect(res.body.success).toBe(false)
    })

    test('Debe eliminar un almacén sin registros asociados', async () => {
      const createRes = await request(app)
        .post('/api/inventory/warehouses')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Empresa-Id', empresaId)
        .send({
          code: 'TEST-WH-DEL',
          name: 'Warehouse to Delete',
          type: 'TRANSITO',
        })

      expect(createRes.status).toBe(201)
      const deleteId = createRes.body.data.id

      const res = await request(app)
        .delete(`/api/inventory/warehouses/${deleteId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Empresa-Id', empresaId)

      expect(res.status).toBe(200)
    })
  })
})
