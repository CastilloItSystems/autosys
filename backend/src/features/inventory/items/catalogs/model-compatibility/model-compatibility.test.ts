// backend/src/features/inventory/items/catalogs/model-compatibility/model-compatibility.test.ts

import { describe, test, expect, beforeAll, afterAll } from '@jest/globals'
import request from 'supertest'
import app from '../../../../../index'
import { getTestAuthToken } from '../../../../../shared/utils/test.utils'
import prisma from '../../../../../services/prisma.service'

describe('Model Compatibility API Tests', () => {
  let partModelId: string
  let vehicleModelId: string
  let compatibilityId: string
  let brandId: string
  let authToken: string

  beforeAll(async () => {
    // Obtener token de autenticación
    authToken = await getTestAuthToken()

    // Crear marca
    const brandRes = await request(app)
      .post('/api/inventory/catalogs/brands')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        code: `BR${Date.now()}`,
        name: `Test Brand ${Date.now()}`,
        type: 'BOTH',
      })
    brandId = brandRes.body.data?.id

    // Crear modelos de prueba
    const partModelRes = await request(app)
      .post('/api/inventory/catalogs/models')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        brandId,
        name: `Part Model ${Date.now()}`,
        type: 'PART',
        year: 2020,
      })
    partModelId = partModelRes.body.data?.id

    const vehicleModelRes = await request(app)
      .post('/api/inventory/catalogs/models')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        brandId,
        name: `Vehicle Model ${Date.now()}`,
        type: 'VEHICLE',
        year: 2022,
      })
    vehicleModelId = vehicleModelRes.body.data?.id
  })

  afterAll(async () => {
    // Limpiar datos de prueba - eliminar en el orden correcto para respetar FKs
    try {
      // Primero eliminar items que usen los modelos/marcas
      await prisma.item.deleteMany({}).catch(() => {})

      // Luego eliminar las compatibilidades
      await prisma.modelCompatibility.deleteMany({})

      // Luego eliminar los modelos
      await prisma.model.deleteMany({})

      // Finalmente los brands
      await prisma.brand.deleteMany({})
    } catch (error) {
      // Ignorar errores de limpieza
      console.log('Error en limpieza afterAll:', error)
    }
  })

  describe('POST /api/inventory/catalogs/model-compatibility', () => {
    test('Debe crear una compatibilidad exitosamente', async () => {
      const res = await request(app)
        .post('/api/inventory/catalogs/model-compatibility')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          partModelId,
          vehicleModelId,
          notes: 'Compatible con este vehículo',
        })

      expect(res.status).toBe(201)
      expect(res.body.data).toHaveProperty('id')
      expect(res.body.data.partModelId).toBe(partModelId)
      expect(res.body.data.vehicleModelId).toBe(vehicleModelId)
      expect(res.body.data.isVerified).toBe(false)

      compatibilityId = res.body.data.id
    })

    test('Debe fallar al crear compatibilidad duplicada', async () => {
      const res = await request(app)
        .post('/api/inventory/catalogs/model-compatibility')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          partModelId,
          vehicleModelId,
          notes: 'Intento duplicado',
        })

      expect(res.status).toBe(409)
      expect(res.body.message).toContain('ya existe')
    })

    test('Debe fallar con modelo de parte inexistente', async () => {
      const res = await request(app)
        .post('/api/inventory/catalogs/model-compatibility')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          partModelId: '550e8400-e29b-41d4-a716-446655440000',
          vehicleModelId,
          notes: 'Test',
        })

      expect(res.status).toBe(404)
      expect(res.body.message).toContain('no encontrado')
    })

    test('Debe fallar con modelo de vehículo inexistente', async () => {
      const res = await request(app)
        .post('/api/inventory/catalogs/model-compatibility')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          partModelId,
          vehicleModelId: '550e8400-e29b-41d4-a716-446655440000',
          notes: 'Test',
        })

      expect(res.status).toBe(404)
      expect(res.body.message).toContain('no encontrado')
    })

    test('Debe fallar al crear compatibilidad con el mismo modelo', async () => {
      const res = await request(app)
        .post('/api/inventory/catalogs/model-compatibility')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          partModelId,
          vehicleModelId: partModelId,
          notes: 'Mismo modelo',
        })

      expect(res.status).toBe(400)
      expect(res.body.message).toContain('mismo modelo')
    })
  })

  describe('GET /api/inventory/catalogs/model-compatibility', () => {
    test('Debe obtener lista de compatibilidades', async () => {
      const res = await request(app)
        .get('/api/inventory/catalogs/model-compatibility')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ page: 1, limit: 10 })

      expect(res.status).toBe(200)
      expect(Array.isArray(res.body.data)).toBe(true)
      expect(res.body.meta).toBeDefined()
      expect(res.body.meta.pagination || res.body.meta.page).toBeDefined()
    })

    test('Debe filtrar compatibilidades por partModelId', async () => {
      const res = await request(app)
        .get('/api/inventory/catalogs/model-compatibility')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ partModelId, page: 1, limit: 10 })

      expect(res.status).toBe(200)
      expect(Array.isArray(res.body.data)).toBe(true)
    })

    test('Debe filtrar compatibilidades por vehicleModelId', async () => {
      const res = await request(app)
        .get('/api/inventory/catalogs/model-compatibility')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ vehicleModelId, page: 1, limit: 10 })

      expect(res.status).toBe(200)
      expect(Array.isArray(res.body.data)).toBe(true)
    })

    test('Debe filtrar compatibilidades por isVerified', async () => {
      const res = await request(app)
        .get('/api/inventory/catalogs/model-compatibility')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ isVerified: false, page: 1, limit: 10 })

      expect(res.status).toBe(200)
      expect(Array.isArray(res.body.data)).toBe(true)
    })
  })

  describe('GET /api/inventory/catalogs/model-compatibility/:id', () => {
    test('Debe obtener una compatibilidad por ID', async () => {
      const res = await request(app)
        .get(`/api/inventory/catalogs/model-compatibility/${compatibilityId}`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(res.status).toBe(200)
      expect(res.body.data.id).toBe(compatibilityId)
      expect(res.body.data.partModelId).toBe(partModelId)
    })

    test('Debe fallar con ID inválido', async () => {
      const res = await request(app)
        .get('/api/inventory/catalogs/model-compatibility/invalid-id')
        .set('Authorization', `Bearer ${authToken}`)

      expect(res.status).toBe(422)
    })

    test('Debe fallar con ID inexistente', async () => {
      const res = await request(app)
        .get(
          '/api/inventory/catalogs/model-compatibility/550e8400-e29b-41d4-a716-446655440000'
        )
        .set('Authorization', `Bearer ${authToken}`)

      expect(res.status).toBe(404)
    })
  })

  describe('GET /api/inventory/catalogs/model-compatibility/part/:partModelId', () => {
    test('Debe obtener compatibilidades de un modelo de parte', async () => {
      const res = await request(app)
        .get(`/api/inventory/catalogs/model-compatibility/part/${partModelId}`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(res.status).toBe(200)
      expect(Array.isArray(res.body.data)).toBe(true)
    })

    test('Debe fallar con partModelId inexistente', async () => {
      const res = await request(app)
        .get(
          '/api/inventory/catalogs/model-compatibility/part/550e8400-e29b-41d4-a716-446655440000'
        )
        .set('Authorization', `Bearer ${authToken}`)

      expect(res.status).toBe(404)
    })
  })

  describe('GET /api/inventory/catalogs/model-compatibility/vehicle/:vehicleModelId', () => {
    test('Debe obtener compatibilidades de un modelo de vehículo', async () => {
      const res = await request(app)
        .get(
          `/api/inventory/catalogs/model-compatibility/vehicle/${vehicleModelId}`
        )
        .set('Authorization', `Bearer ${authToken}`)

      expect(res.status).toBe(200)
      expect(Array.isArray(res.body.data)).toBe(true)
    })

    test('Debe fallar con vehicleModelId inexistente', async () => {
      const res = await request(app)
        .get(
          '/api/inventory/catalogs/model-compatibility/vehicle/550e8400-e29b-41d4-a716-446655440000'
        )
        .set('Authorization', `Bearer ${authToken}`)

      expect(res.status).toBe(404)
    })
  })

  describe('PUT /api/inventory/catalogs/model-compatibility/:id', () => {
    test('Debe actualizar notas de compatibilidad', async () => {
      const res = await request(app)
        .put(`/api/inventory/catalogs/model-compatibility/${compatibilityId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          notes: 'Notas actualizadas',
        })

      expect(res.status).toBe(200)
      expect(res.body.data.notes).toBe('Notas actualizadas')
    })

    test('Debe actualizar estado isVerified', async () => {
      const res = await request(app)
        .put(`/api/inventory/catalogs/model-compatibility/${compatibilityId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          isVerified: true,
        })

      expect(res.status).toBe(200)
      expect(res.body.data.isVerified).toBe(true)
    })
  })

  describe('PATCH /api/inventory/catalogs/model-compatibility/:id/verify', () => {
    test('Debe marcar compatibilidad como verificada', async () => {
      // Crear nueva compatibilidad sin verificar
      const newPartRes = await request(app)
        .post('/api/inventory/catalogs/models')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          brandId,
          name: `Another Part ${Date.now()}`,
          type: 'PART',
        })
      const newPartId = newPartRes.body.data?.id

      const createRes = await request(app)
        .post('/api/inventory/catalogs/model-compatibility')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          partModelId: newPartId,
          vehicleModelId,
        })
      const newCompatId = createRes.body.data?.id

      const res = await request(app)
        .patch(
          `/api/inventory/catalogs/model-compatibility/${newCompatId}/verify`
        )
        .set('Authorization', `Bearer ${authToken}`)

      expect(res.status).toBe(200)
      expect(res.body.data.isVerified).toBe(true)
    })

    test('Debe fallar al verificar una ya verificada', async () => {
      const res = await request(app)
        .patch(
          `/api/inventory/catalogs/model-compatibility/${compatibilityId}/verify`
        )
        .set('Authorization', `Bearer ${authToken}`)

      expect(res.status).toBe(400)
      expect(res.body.message).toContain('ya está verificada')
    })
  })

  describe('DELETE /api/inventory/catalogs/model-compatibility/:id', () => {
    test('Debe eliminar una compatibilidad', async () => {
      // Crear una nueva para eliminar
      const newPartRes = await request(app)
        .post('/api/inventory/catalogs/models')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          brandId,
          name: `Part for Delete ${Date.now()}`,
          type: 'PART',
        })
      const newPartId = newPartRes.body.data?.id

      const createRes = await request(app)
        .post('/api/inventory/catalogs/model-compatibility')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          partModelId: newPartId,
          vehicleModelId,
        })
      const deleteCompatId = createRes.body.data?.id

      const res = await request(app)
        .delete(`/api/inventory/catalogs/model-compatibility/${deleteCompatId}`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(res.status).toBe(200)

      // Verificar que fue eliminada
      const getRes = await request(app)
        .get(`/api/inventory/catalogs/model-compatibility/${deleteCompatId}`)
        .set('Authorization', `Bearer ${authToken}`)
      expect(getRes.status).toBe(404)
    })

    test('Debe fallar al eliminar compatibilidad inexistente', async () => {
      const res = await request(app)
        .delete(
          '/api/inventory/catalogs/model-compatibility/550e8400-e29b-41d4-a716-446655440000'
        )
        .set('Authorization', `Bearer ${authToken}`)

      expect(res.status).toBe(404)
    })
  })
})
