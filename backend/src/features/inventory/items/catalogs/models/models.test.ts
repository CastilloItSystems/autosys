// backend/src/features/inventory/items/catalogs/models/models.test.ts

import { describe, test, expect, beforeAll, afterAll } from '@jest/globals'
import request from 'supertest'
import app from '../../../../../app.js'
import prisma from '../../../../../services/prisma.service.js'
import { getTestCredentials } from '../../../../../shared/utils/test.utils.js'

describe('Model API Tests', () => {
  let authToken: string
  let empresaId: string
  let brandId: string
  let createdModelId: string

  beforeAll(async () => {
    const creds = await getTestCredentials()
    authToken = creds.authToken
    empresaId = creds.empresaId

    // Limpiar datos de prueba anteriores
    await prisma.model
      .deleteMany({
        where: {
          empresaId,
          name: { in: ['Hilux', 'Hilux SR', 'Future Model'] },
        },
      })
      .catch(() => {})
    await prisma.brand
      .deleteMany({
        where: { empresaId, code: 'TEST-BRAND-MODEL' },
      })
      .catch(() => {})

    // Crear marca de prueba scoped a la empresa
    const brand = await prisma.brand.create({
      data: {
        empresaId,
        code: 'TEST-BRAND-MODEL',
        name: 'Test Brand for Models',
        type: 'BOTH',
        isActive: true,
      },
    })
    brandId = brand.id
  }, 20000)

  afterAll(async () => {
    if (createdModelId) {
      await prisma.model
        .delete({ where: { id: createdModelId } })
        .catch(() => {})
    }
    if (brandId) {
      await prisma.brand.delete({ where: { id: brandId } }).catch(() => {})
    }
  })

  // ---------------------------------------------------------------------------
  // POST /
  // ---------------------------------------------------------------------------

  describe('POST /api/inventory/catalogs/models', () => {
    test('Debe crear un modelo exitosamente', async () => {
      const res = await request(app)
        .post('/api/inventory/catalogs/models')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Empresa-Id', empresaId)
        .send({ brandId, name: 'Hilux', year: 2020, isActive: true })
        .expect(201)

      expect(res.body.success).toBe(true)
      expect(res.body.data).toHaveProperty('id')
      expect(res.body.data.name).toBe('Hilux')
      expect(res.body.data.year).toBe(2020)
      expect(res.body.data.brandId).toBe(brandId)
      expect(res.body.data.brand).toBeDefined()

      createdModelId = res.body.data.id
    })

    test('Debe fallar al crear modelo duplicado', async () => {
      const res = await request(app)
        .post('/api/inventory/catalogs/models')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Empresa-Id', empresaId)
        .send({ brandId, name: 'Hilux', year: 2020 })
        .expect(409)

      expect(res.body.success).toBe(false)
    })

    test('Debe fallar con marca inexistente en la empresa', async () => {
      const res = await request(app)
        .post('/api/inventory/catalogs/models')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Empresa-Id', empresaId)
        .send({
          brandId: '550e8400-e29b-41d4-a716-446655440000',
          name: 'Test Model',
          year: 2021,
        })
        .expect(404)

      expect(res.body.success).toBe(false)
    })

    test('Debe fallar con año fuera de rango', async () => {
      const res = await request(app)
        .post('/api/inventory/catalogs/models')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Empresa-Id', empresaId)
        .send({ brandId, name: 'Future Model', year: 2100 })
        .expect(422)

      expect(res.body.success).toBe(false)
    })
  })

  // ---------------------------------------------------------------------------
  // GET /
  // ---------------------------------------------------------------------------

  describe('GET /api/inventory/catalogs/models', () => {
    test('Debe obtener lista de modelos con paginación', async () => {
      const res = await request(app)
        .get('/api/inventory/catalogs/models')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Empresa-Id', empresaId)
        .query({ page: 1, limit: 10 })
        .expect(200)

      expect(res.body.success).toBe(true)
      expect(Array.isArray(res.body.data)).toBe(true)
      expect(res.body.meta).toHaveProperty('total')
      expect(res.body.meta).toHaveProperty('page')
    })

    test('Debe filtrar modelos por marca', async () => {
      const res = await request(app)
        .get('/api/inventory/catalogs/models')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Empresa-Id', empresaId)
        .query({ brandId })
        .expect(200)

      expect(res.body.success).toBe(true)
      if (res.body.data.length > 0) {
        expect(res.body.data[0].brandId).toBe(brandId)
      }
    })

    test('Debe filtrar modelos por año', async () => {
      const res = await request(app)
        .get('/api/inventory/catalogs/models')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Empresa-Id', empresaId)
        .query({ year: 2020 })
        .expect(200)

      expect(res.body.success).toBe(true)
      if (res.body.data.length > 0) {
        expect(res.body.data[0].year).toBe(2020)
      }
    })
  })

  // ---------------------------------------------------------------------------
  // GET /brand/:brandId
  // ---------------------------------------------------------------------------

  describe('GET /api/inventory/catalogs/models/brand/:brandId', () => {
    test('Debe obtener modelos de una marca específica', async () => {
      const res = await request(app)
        .get(`/api/inventory/catalogs/models/brand/${brandId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Empresa-Id', empresaId)
        .expect(200)

      expect(res.body.success).toBe(true)
      expect(Array.isArray(res.body.data)).toBe(true)
      res.body.data.forEach((model: Record<string, unknown>) => {
        expect(model.brandId).toBe(brandId)
      })
    })
  })

  // ---------------------------------------------------------------------------
  // GET /grouped
  // ---------------------------------------------------------------------------

  describe('GET /api/inventory/catalogs/models/grouped', () => {
    test('Debe obtener modelos agrupados por marca', async () => {
      const res = await request(app)
        .get('/api/inventory/catalogs/models/grouped')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Empresa-Id', empresaId)
        .expect(200)

      expect(res.body.success).toBe(true)
      expect(Array.isArray(res.body.data)).toBe(true)
      if (res.body.data.length > 0) {
        expect(res.body.data[0]).toHaveProperty('brand')
        expect(res.body.data[0]).toHaveProperty('models')
        expect(res.body.data[0]).toHaveProperty('count')
      }
    })
  })

  // ---------------------------------------------------------------------------
  // GET /years
  // ---------------------------------------------------------------------------

  describe('GET /api/inventory/catalogs/models/years', () => {
    test('Debe obtener años disponibles de la empresa', async () => {
      const res = await request(app)
        .get('/api/inventory/catalogs/models/years')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Empresa-Id', empresaId)
        .expect(200)

      expect(res.body.success).toBe(true)
      expect(Array.isArray(res.body.data)).toBe(true)
      res.body.data.forEach((year: number) => {
        expect(typeof year).toBe('number')
        expect(year).toBeGreaterThan(1900)
      })
    })
  })

  // ---------------------------------------------------------------------------
  // GET /:id
  // ---------------------------------------------------------------------------

  describe('GET /api/inventory/catalogs/models/:id', () => {
    test('Debe obtener un modelo por ID', async () => {
      const res = await request(app)
        .get(`/api/inventory/catalogs/models/${createdModelId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Empresa-Id', empresaId)
        .expect(200)

      expect(res.body.success).toBe(true)
      expect(res.body.data.id).toBe(createdModelId)
      expect(res.body.data.brand).toBeDefined()
      expect(res.body.data.fullName).toBeDefined()
    })

    test('Debe retornar 422 con ID inválido', async () => {
      const res = await request(app)
        .get('/api/inventory/catalogs/models/invalid-id')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Empresa-Id', empresaId)
        .expect(422)

      expect(res.body.success).toBe(false)
    })

    test('Debe retornar 404 con modelo inexistente', async () => {
      const res = await request(app)
        .get(
          '/api/inventory/catalogs/models/550e8400-e29b-41d4-a716-446655440000'
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

  describe('PUT /api/inventory/catalogs/models/:id', () => {
    test('Debe actualizar un modelo', async () => {
      const res = await request(app)
        .put(`/api/inventory/catalogs/models/${createdModelId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Empresa-Id', empresaId)
        .send({ name: 'Hilux SR', year: 2021 })
        .expect(200)

      expect(res.body.success).toBe(true)
      expect(res.body.data.name).toBe('Hilux SR')
      expect(res.body.data.year).toBe(2021)
    })
  })

  // ---------------------------------------------------------------------------
  // PATCH /:id/toggle
  // ---------------------------------------------------------------------------

  describe('PATCH /api/inventory/catalogs/models/:id/toggle', () => {
    test('Debe cambiar el estado activo de un modelo', async () => {
      const res = await request(app)
        .patch(`/api/inventory/catalogs/models/${createdModelId}/toggle`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Empresa-Id', empresaId)
        .expect(200)

      expect(res.body.success).toBe(true)
      expect(res.body.data).toHaveProperty('isActive')
    })
  })

  // ---------------------------------------------------------------------------
  // DELETE /:id
  // ---------------------------------------------------------------------------

  describe('DELETE /api/inventory/catalogs/models/:id', () => {
    test('Debe eliminar un modelo (soft delete)', async () => {
      const res = await request(app)
        .delete(`/api/inventory/catalogs/models/${createdModelId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Empresa-Id', empresaId)
        .expect(200)

      expect(res.body.success).toBe(true)

      const model = await prisma.model.findUnique({
        where: { id: createdModelId },
      })
      expect(model?.isActive).toBe(false)
    })
  })
})
