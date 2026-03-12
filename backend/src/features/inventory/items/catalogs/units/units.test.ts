// backend/src/features/inventory/items/catalogs/units/units.test.ts

import { describe, test, expect, beforeAll, afterAll } from '@jest/globals'
import request from 'supertest'
import app from '../../../../../app.js'
import prisma from '../../../../../services/prisma.service.js'
import { getTestCredentials } from '../../../../../shared/utils/test.utils.js'

describe('Units API Tests', () => {
  let authToken: string
  let empresaId: string
  let createdUnitId: string

  beforeAll(async () => {
    const creds = await getTestCredentials()
    authToken = creds.authToken
    empresaId = creds.empresaId

    // Limpiar datos de prueba anteriores scoped por empresa
    await prisma.unit
      .deleteMany({
        where: {
          empresaId,
          code: { in: ['TESTUN', 'BULK1', 'BULK2', 'ANOTHER'] },
        },
      })
      .catch(() => {})
  })

  afterAll(async () => {
    await prisma.unit
      .deleteMany({
        where: {
          empresaId,
          code: { in: ['TESTUN', 'BULK1', 'BULK2', 'ANOTHER'] },
        },
      })
      .catch(() => {})
  })

  // ---------------------------------------------------------------------------
  // POST /
  // ---------------------------------------------------------------------------

  describe('POST /api/inventory/catalogs/units', () => {
    test('Debe crear una unidad exitosamente', async () => {
      const res = await request(app)
        .post('/api/inventory/catalogs/units')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Empresa-Id', empresaId)
        .send({
          code: 'TESTUN',
          name: 'Test Unit',
          abbreviation: 'tu',
          type: 'COUNTABLE',
          isActive: true,
        })
        .expect(201)

      expect(res.body.success).toBe(true)
      expect(res.body.data).toHaveProperty('id')
      expect(res.body.data.code).toBe('TESTUN')
      expect(res.body.data.name).toBe('Test Unit')
      expect(res.body.data.abbreviation).toBe('tu')
      expect(res.body.data.type).toBe('COUNTABLE')
      expect(res.body.data.typeLabel).toBe('Contable')

      createdUnitId = res.body.data.id
    })

    test('Debe fallar con código duplicado en la misma empresa', async () => {
      const res = await request(app)
        .post('/api/inventory/catalogs/units')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Empresa-Id', empresaId)
        .send({
          code: 'TESTUN',
          name: 'Another Test Unit',
          abbreviation: 'tu2',
          type: 'COUNTABLE',
        })
        .expect(409)

      expect(res.body.success).toBe(false)
    })

    test('Debe fallar con tipo inválido', async () => {
      const res = await request(app)
        .post('/api/inventory/catalogs/units')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Empresa-Id', empresaId)
        .send({
          code: 'TESTUN2',
          name: 'Invalid Type Unit',
          abbreviation: 'itu',
          type: 'INVALID_TYPE',
        })
        .expect(422)

      expect(res.body.success).toBe(false)
    })

    test('Debe fallar con código que contiene caracteres inválidos', async () => {
      const res = await request(app)
        .post('/api/inventory/catalogs/units')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Empresa-Id', empresaId)
        .send({
          code: 'TEST-UNIT',
          name: 'Invalid Code Unit',
          abbreviation: 'icu',
          type: 'WEIGHT',
        })
        .expect(422)

      expect(res.body.success).toBe(false)
    })
  })

  // ---------------------------------------------------------------------------
  // GET /
  // ---------------------------------------------------------------------------

  describe('GET /api/inventory/catalogs/units', () => {
    test('Debe obtener lista de unidades con paginación', async () => {
      const res = await request(app)
        .get('/api/inventory/catalogs/units')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Empresa-Id', empresaId)
        .query({ page: 1, limit: 10 })
        .expect(200)

      expect(res.body.success).toBe(true)
      expect(Array.isArray(res.body.data)).toBe(true)
      expect(res.body.meta).toHaveProperty('total')
      expect(res.body.meta).toHaveProperty('page')
    })

    test('Debe filtrar unidades por tipo', async () => {
      const res = await request(app)
        .get('/api/inventory/catalogs/units')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Empresa-Id', empresaId)
        .query({ type: 'COUNTABLE' })
        .expect(200)

      expect(res.body.success).toBe(true)
      expect(Array.isArray(res.body.data)).toBe(true)
      res.body.data.forEach((unit: Record<string, unknown>) => {
        expect(unit.type).toBe('COUNTABLE')
      })
    })

    test('Debe buscar unidades por término', async () => {
      const res = await request(app)
        .get('/api/inventory/catalogs/units')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Empresa-Id', empresaId)
        .query({ search: 'Test' })
        .expect(200)

      expect(res.body.success).toBe(true)
      expect(Array.isArray(res.body.data)).toBe(true)
    })
  })

  // ---------------------------------------------------------------------------
  // GET /active
  // ---------------------------------------------------------------------------

  describe('GET /api/inventory/catalogs/units/active', () => {
    test('Debe obtener solo unidades activas', async () => {
      const res = await request(app)
        .get('/api/inventory/catalogs/units/active')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Empresa-Id', empresaId)
        .expect(200)

      expect(res.body.success).toBe(true)
      expect(Array.isArray(res.body.data)).toBe(true)
    })
  })

  // ---------------------------------------------------------------------------
  // GET /grouped
  // ---------------------------------------------------------------------------

  describe('GET /api/inventory/catalogs/units/grouped', () => {
    test('Debe obtener unidades agrupadas por tipo', async () => {
      const res = await request(app)
        .get('/api/inventory/catalogs/units/grouped')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Empresa-Id', empresaId)
        .expect(200)

      expect(res.body.success).toBe(true)
      expect(Array.isArray(res.body.data)).toBe(true)

      if (res.body.data.length > 0) {
        const group = res.body.data[0]
        expect(group).toHaveProperty('type')
        expect(group).toHaveProperty('typeLabel')
        expect(group).toHaveProperty('units')
        expect(group).toHaveProperty('count')
        expect(Array.isArray(group.units)).toBe(true)
      }
    })
  })

  // ---------------------------------------------------------------------------
  // GET /type/:type
  // ---------------------------------------------------------------------------

  describe('GET /api/inventory/catalogs/units/type/:type', () => {
    test('Debe obtener unidades de un tipo específico', async () => {
      const res = await request(app)
        .get('/api/inventory/catalogs/units/type/COUNTABLE')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Empresa-Id', empresaId)
        .expect(200)

      expect(res.body.success).toBe(true)
      expect(Array.isArray(res.body.data)).toBe(true)
      res.body.data.forEach((unit: Record<string, unknown>) => {
        expect(unit.type).toBe('COUNTABLE')
      })
    })

    test('Debe fallar con tipo inválido', async () => {
      const res = await request(app)
        .get('/api/inventory/catalogs/units/type/INVALID')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Empresa-Id', empresaId)
        .expect(400)

      expect(res.body.success).toBe(false)
    })
  })

  // ---------------------------------------------------------------------------
  // GET /:id
  // ---------------------------------------------------------------------------

  describe('GET /api/inventory/catalogs/units/:id', () => {
    test('Debe obtener una unidad por ID', async () => {
      const res = await request(app)
        .get(`/api/inventory/catalogs/units/${createdUnitId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Empresa-Id', empresaId)
        .expect(200)

      expect(res.body.success).toBe(true)
      expect(res.body.data.id).toBe(createdUnitId)
      expect(res.body.data.typeLabel).toBeDefined()
    })

    test('Debe retornar 422 con ID inválido', async () => {
      const res = await request(app)
        .get('/api/inventory/catalogs/units/invalid-id')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Empresa-Id', empresaId)
        .expect(422)

      expect(res.body.success).toBe(false)
    })

    test('Debe retornar 404 con unidad inexistente', async () => {
      const res = await request(app)
        .get(
          '/api/inventory/catalogs/units/00000000-0000-0000-0000-000000000000'
        )
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Empresa-Id', empresaId)
        .expect(404)

      expect(res.body.success).toBe(false)
    })
  })

  // ---------------------------------------------------------------------------
  // PUT /:id
  // ---------------------------------------------------------------------------

  describe('PUT /api/inventory/catalogs/units/:id', () => {
    test('Debe actualizar una unidad', async () => {
      const res = await request(app)
        .put(`/api/inventory/catalogs/units/${createdUnitId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Empresa-Id', empresaId)
        .send({ name: 'Updated Test Unit', abbreviation: 'utu' })
        .expect(200)

      expect(res.body.success).toBe(true)
      expect(res.body.data.name).toBe('Updated Test Unit')
      expect(res.body.data.abbreviation).toBe('utu')
    })

    test('Debe fallar al cambiar a código existente en la misma empresa', async () => {
      // Crear otra unidad en la misma empresa
      await prisma.unit.create({
        data: {
          empresaId,
          code: 'ANOTHER',
          name: 'Another Unit',
          abbreviation: 'au',
          type: 'WEIGHT',
        },
      })

      const res = await request(app)
        .put(`/api/inventory/catalogs/units/${createdUnitId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Empresa-Id', empresaId)
        .send({ code: 'ANOTHER' })
        .expect(409)

      expect(res.body.success).toBe(false)
    })
  })

  // ---------------------------------------------------------------------------
  // PATCH /:id/toggle
  // ---------------------------------------------------------------------------

  describe('PATCH /api/inventory/catalogs/units/:id/toggle', () => {
    test('Debe cambiar el estado activo de una unidad', async () => {
      const res = await request(app)
        .patch(`/api/inventory/catalogs/units/${createdUnitId}/toggle`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Empresa-Id', empresaId)
        .expect(200)

      expect(res.body.success).toBe(true)
      expect(res.body.data).toHaveProperty('isActive')
    })
  })

  // ---------------------------------------------------------------------------
  // POST /bulk
  // ---------------------------------------------------------------------------

  describe('POST /api/inventory/catalogs/units/bulk', () => {
    test('Debe importar unidades masivamente', async () => {
      const res = await request(app)
        .post('/api/inventory/catalogs/units/bulk')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Empresa-Id', empresaId)
        .send({
          units: [
            {
              code: 'BULK1',
              name: 'Bulk Unit 1',
              abbreviation: 'bu1',
              type: 'VOLUME',
            },
            {
              code: 'BULK2',
              name: 'Bulk Unit 2',
              abbreviation: 'bu2',
              type: 'LENGTH',
            },
          ],
        })
        .expect(200)

      expect(res.body.success).toBe(true)
      expect(res.body.data.success.length).toBeGreaterThan(0)
    })

    test('Debe fallar sin array de unidades', async () => {
      const res = await request(app)
        .post('/api/inventory/catalogs/units/bulk')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Empresa-Id', empresaId)
        .send({ units: [] })
        .expect(400)

      expect(res.body.success).toBe(false)
    })
  })

  // ---------------------------------------------------------------------------
  // DELETE /:id (soft)
  // ---------------------------------------------------------------------------

  describe('DELETE /api/inventory/catalogs/units/:id', () => {
    test('Debe eliminar una unidad (soft delete)', async () => {
      const res = await request(app)
        .delete(`/api/inventory/catalogs/units/${createdUnitId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Empresa-Id', empresaId)
        .expect(200)

      expect(res.body.success).toBe(true)

      const unit = await prisma.unit.findUnique({
        where: { id: createdUnitId },
      })
      expect(unit?.isActive).toBe(false)
    })

    test('Debe retornar 404 con unidad inexistente', async () => {
      const res = await request(app)
        .delete(
          '/api/inventory/catalogs/units/00000000-0000-0000-0000-000000000000'
        )
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Empresa-Id', empresaId)
        .expect(404)

      expect(res.body.success).toBe(false)
    })
  })

  // ---------------------------------------------------------------------------
  // GET /search
  // ---------------------------------------------------------------------------

  describe('GET /api/inventory/catalogs/units/search', () => {
    test('Debe buscar unidades por término', async () => {
      const res = await request(app)
        .get('/api/inventory/catalogs/units/search')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Empresa-Id', empresaId)
        .query({ term: 'Test' })
        .expect(200)

      expect(res.body.success).toBe(true)
      expect(Array.isArray(res.body.data)).toBe(true)
    })

    test('Debe fallar sin término de búsqueda', async () => {
      const res = await request(app)
        .get('/api/inventory/catalogs/units/search')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Empresa-Id', empresaId)
        .expect(400)

      expect(res.body.success).toBe(false)
    })
  })
})
