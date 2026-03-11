// backend/src/features/inventory/items/catalogs/models/models.test.ts

import { describe, test, expect, beforeAll, afterAll } from '@jest/globals'
import request from 'supertest'
import app from '../../../../../app'
import prisma from '../../../../../services/prisma.service'

import { getTestAuthToken } from '../../../../../shared/utils/test.utils'

describe('Model API Tests', () => {
  let authToken: string
  let brandId: string
  let createdModelId: string

  beforeAll(async () => {
    // Obtener token de autenticación
    authToken = await getTestAuthToken()

    // Limpiar datos de prueba anteriores si existen
    await prisma.model
      .deleteMany({
        where: {
          name: { in: ['Hilux', 'Hilux SR', 'Future Model'] },
        },
      })
      .catch(() => {})

    // Limpiar marcas de prueba anteriores
    await prisma.brand
      .deleteMany({
        where: {
          code: 'TEST-BRAND-MODEL',
        },
      })
      .catch(() => {})

    // Crear una marca de prueba
    const brand = await prisma.brand.create({
      data: {
        code: 'TEST-BRAND-MODEL',
        name: 'Test Brand for Models',
        isActive: true,
      },
    })
    brandId = brand.id
  })

  afterAll(async () => {
    // Limpiar datos de prueba
    if (createdModelId) {
      await prisma.model
        .delete({ where: { id: createdModelId } })
        .catch(() => {})
    }
    if (brandId) {
      await prisma.brand.delete({ where: { id: brandId } }).catch(() => {})
    }
  })

  describe('POST /api/inventory/catalogs/models', () => {
    test('Debe crear un modelo exitosamente', async () => {
      const modelData = {
        brandId,
        name: 'Hilux',
        year: 2020,
        isActive: true,
      }

      const response = await request(app)
        .post('/api/inventory/catalogs/models')
        .set('Authorization', `Bearer ${authToken}`)
        .send(modelData)
        .expect(201)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toHaveProperty('id')
      expect(response.body.data.name).toBe(modelData.name)
      expect(response.body.data.year).toBe(modelData.year)
      expect(response.body.data.brandId).toBe(brandId)
      expect(response.body.data.brand).toBeDefined()

      createdModelId = response.body.data.id
    })

    test('Debe fallar al crear modelo duplicado', async () => {
      const modelData = {
        brandId,
        name: 'Hilux',
        year: 2020,
      }

      const response = await request(app)
        .post('/api/inventory/catalogs/models')
        .set('Authorization', `Bearer ${authToken}`)
        .send(modelData)
        .expect(409)

      expect(response.body.success).toBe(false)
    })

    test('Debe fallar al crear modelo con marca inexistente', async () => {
      const modelData = {
        brandId: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Test Model',
        year: 2021,
      }

      const response = await request(app)
        .post('/api/inventory/catalogs/models')
        .set('Authorization', `Bearer ${authToken}`)
        .send(modelData)
        .expect(404)

      expect(response.body.success).toBe(false)
    })

    test('Debe fallar con año inválido', async () => {
      const modelData = {
        brandId,
        name: 'Future Model',
        year: 2100, // Año muy futuro
      }

      const response = await request(app)
        .post('/api/inventory/catalogs/models')
        .set('Authorization', `Bearer ${authToken}`)
        .send(modelData)
        .expect(422)

      expect(response.body.success).toBe(false)
    })
  })

  describe('GET /api/inventory/catalogs/models', () => {
    test('Debe obtener lista de modelos con paginación', async () => {
      const response = await request(app)
        .get('/api/inventory/catalogs/models')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ page: 1, limit: 10 })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toBeInstanceOf(Array)
      expect(response.body.meta).toHaveProperty('total')
      expect(response.body.meta).toHaveProperty('page')
    })

    test('Debe filtrar modelos por marca', async () => {
      const response = await request(app)
        .get('/api/inventory/catalogs/models')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ brandId })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toBeInstanceOf(Array)
      if (response.body.data.length > 0) {
        expect(response.body.data[0].brandId).toBe(brandId)
      }
    })

    test('Debe filtrar modelos por año', async () => {
      const response = await request(app)
        .get('/api/inventory/catalogs/models')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ year: 2020 })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toBeInstanceOf(Array)
      if (response.body.data.length > 0) {
        expect(response.body.data[0].year).toBe(2020)
      }
    })
  })

  describe('GET /api/inventory/catalogs/models/brand/:brandId', () => {
    test('Debe obtener modelos de una marca específica', async () => {
      const response = await request(app)
        .get(`/api/inventory/catalogs/models/brand/${brandId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toBeInstanceOf(Array)
      response.body.data.forEach((model: any) => {
        expect(model.brandId).toBe(brandId)
      })
    })
  })

  describe('GET /api/inventory/catalogs/models/grouped', () => {
    test('Debe obtener modelos agrupados por marca', async () => {
      const response = await request(app)
        .get('/api/inventory/catalogs/models/grouped')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toBeInstanceOf(Array)
      if (response.body.data.length > 0) {
        expect(response.body.data[0]).toHaveProperty('brand')
        expect(response.body.data[0]).toHaveProperty('models')
        expect(response.body.data[0]).toHaveProperty('count')
      }
    })
  })

  describe('GET /api/inventory/catalogs/models/years', () => {
    test('Debe obtener años disponibles', async () => {
      const response = await request(app)
        .get('/api/inventory/catalogs/models/years')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toBeInstanceOf(Array)
      response.body.data.forEach((year: number) => {
        expect(typeof year).toBe('number')
        expect(year).toBeGreaterThan(1900)
      })
    })
  })

  describe('GET /api/inventory/catalogs/models/:id', () => {
    test('Debe obtener un modelo por ID', async () => {
      const response = await request(app)
        .get(`/api/inventory/catalogs/models/${createdModelId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.id).toBe(createdModelId)
      expect(response.body.data.brand).toBeDefined()
      expect(response.body.data.fullName).toBeDefined()
    })

    test('Debe fallar con ID inválido', async () => {
      const response = await request(app)
        .get('/api/inventory/catalogs/models/invalid-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(422)

      expect(response.body.success).toBe(false)
    })
  })

  describe('PUT /api/inventory/catalogs/models/:id', () => {
    test('Debe actualizar un modelo', async () => {
      const updateData = {
        name: 'Hilux SR',
        year: 2021,
      }

      const response = await request(app)
        .put(`/api/inventory/catalogs/models/${createdModelId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.name).toBe(updateData.name)
      expect(response.body.data.year).toBe(updateData.year)
    })
  })

  describe('PATCH /api/inventory/catalogs/models/:id/toggle', () => {
    test('Debe cambiar el estado activo de un modelo', async () => {
      const response = await request(app)
        .patch(`/api/inventory/catalogs/models/${createdModelId}/toggle`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toHaveProperty('isActive')
    })
  })

  describe('DELETE /api/inventory/catalogs/models/:id', () => {
    test('Debe eliminar un modelo (soft delete)', async () => {
      const response = await request(app)
        .delete(`/api/inventory/catalogs/models/${createdModelId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)

      // Verificar que fue soft deleted
      const model = await prisma.model.findUnique({
        where: { id: createdModelId },
      })
      expect(model?.isActive).toBe(false)
    })
  })
})
