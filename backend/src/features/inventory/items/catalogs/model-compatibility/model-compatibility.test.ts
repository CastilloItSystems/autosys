// backend/src/features/inventory/items/catalogs/model-compatibility/model-compatibility.test.ts

import { describe, test, expect, beforeAll, afterAll } from '@jest/globals'
import request from 'supertest'
import app from '../../../../../app.js'
import prisma from '../../../../../services/prisma.service.js'
import { getTestCredentials } from '../../../../../shared/utils/test.utils.js'

describe('Model Compatibility API Tests', () => {
  let authToken: string
  let empresaId: string
  let partModelId: string
  let vehicleModelId: string
  let compatibilityId: string
  let brandId: string

  beforeAll(async () => {
    const creds = await getTestCredentials()
    authToken = creds.authToken
    empresaId = creds.empresaId

    // Crear marca scoped a la empresa
    const brandRes = await request(app)
      .post('/api/inventory/catalogs/brands')
      .set('Authorization', `Bearer ${authToken}`)
      .set('X-Empresa-Id', empresaId)
      .send({
        code: `BRCM${Date.now()}`,
        name: `Test Brand Compat ${Date.now()}`,
        type: 'BOTH',
      })
    brandId = brandRes.body.data?.id

    // Crear modelos de prueba
    const partRes = await request(app)
      .post('/api/inventory/catalogs/models')
      .set('Authorization', `Bearer ${authToken}`)
      .set('X-Empresa-Id', empresaId)
      .send({
        brandId,
        name: `Part Model ${Date.now()}`,
        type: 'PART',
        year: 2020,
      })
    partModelId = partRes.body.data?.id

    const vehicleRes = await request(app)
      .post('/api/inventory/catalogs/models')
      .set('Authorization', `Bearer ${authToken}`)
      .set('X-Empresa-Id', empresaId)
      .send({
        brandId,
        name: `Vehicle Model ${Date.now()}`,
        type: 'VEHICLE',
        year: 2022,
      })
    vehicleModelId = vehicleRes.body.data?.id
  }, 20000)

  afterAll(async () => {
    await prisma.modelCompatibility
      .deleteMany({ where: { partModel: { empresaId } } })
      .catch(() => {})
    await prisma.model.deleteMany({ where: { empresaId } }).catch(() => {})
    await prisma.brand
      .deleteMany({ where: { empresaId, code: { startsWith: 'BRCM' } } })
      .catch(() => {})
  })

  // ---------------------------------------------------------------------------
  // POST /
  // ---------------------------------------------------------------------------

  describe('POST /api/inventory/catalogs/model-compatibility', () => {
    test('Debe crear una compatibilidad exitosamente', async () => {
      const res = await request(app)
        .post('/api/inventory/catalogs/model-compatibility')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Empresa-Id', empresaId)
        .send({
          partModelId,
          vehicleModelId,
          notes: 'Compatible con este vehículo',
        })
        .expect(201)

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
        .set('X-Empresa-Id', empresaId)
        .send({ partModelId, vehicleModelId })
        .expect(409)

      expect(res.body.message).toContain('ya existe')
    })

    test('Debe fallar con modelo de parte inexistente', async () => {
      const res = await request(app)
        .post('/api/inventory/catalogs/model-compatibility')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Empresa-Id', empresaId)
        .send({
          partModelId: '550e8400-e29b-41d4-a716-446655440000',
          vehicleModelId,
        })
        .expect(404)

      expect(res.body.message).toContain('no encontrado')
    })

    test('Debe fallar con modelo de vehículo inexistente', async () => {
      const res = await request(app)
        .post('/api/inventory/catalogs/model-compatibility')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Empresa-Id', empresaId)
        .send({
          partModelId,
          vehicleModelId: '550e8400-e29b-41d4-a716-446655440000',
        })
        .expect(404)

      expect(res.body.message).toContain('no encontrado')
    })

    test('Debe fallar con el mismo modelo en ambos campos', async () => {
      const res = await request(app)
        .post('/api/inventory/catalogs/model-compatibility')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Empresa-Id', empresaId)
        .send({ partModelId, vehicleModelId: partModelId })
        .expect(400)

      expect(res.body.message).toContain('mismo modelo')
    })
  })

  // ---------------------------------------------------------------------------
  // GET /
  // ---------------------------------------------------------------------------

  describe('GET /api/inventory/catalogs/model-compatibility', () => {
    test('Debe obtener lista de compatibilidades', async () => {
      const res = await request(app)
        .get('/api/inventory/catalogs/model-compatibility')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Empresa-Id', empresaId)
        .query({ page: 1, limit: 10 })
        .expect(200)

      expect(res.body.success).toBe(true)
      expect(Array.isArray(res.body.data)).toBe(true)
    })

    test('Debe filtrar por partModelId', async () => {
      const res = await request(app)
        .get('/api/inventory/catalogs/model-compatibility')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Empresa-Id', empresaId)
        .query({ partModelId })
        .expect(200)

      expect(res.body.success).toBe(true)
      if (res.body.data.length > 0) {
        expect(res.body.data[0].partModelId).toBe(partModelId)
      }
    })

    test('Debe filtrar por isVerified=false', async () => {
      const res = await request(app)
        .get('/api/inventory/catalogs/model-compatibility')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Empresa-Id', empresaId)
        .query({ isVerified: false })
        .expect(200)

      expect(res.body.success).toBe(true)
    })
  })

  // ---------------------------------------------------------------------------
  // GET /:id
  // ---------------------------------------------------------------------------

  describe('GET /api/inventory/catalogs/model-compatibility/:id', () => {
    test('Debe obtener una compatibilidad por ID', async () => {
      const res = await request(app)
        .get(`/api/inventory/catalogs/model-compatibility/${compatibilityId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Empresa-Id', empresaId)
        .expect(200)

      expect(res.body.data.id).toBe(compatibilityId)
      expect(res.body.data.partModelId).toBe(partModelId)
    })

    test('Debe retornar 422 con ID inválido', async () => {
      const res = await request(app)
        .get('/api/inventory/catalogs/model-compatibility/invalid-id')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Empresa-Id', empresaId)
        .expect(422)

      expect(res.body.success).toBe(false)
    })

    test('Debe retornar 404 con ID inexistente', async () => {
      const res = await request(app)
        .get(
          '/api/inventory/catalogs/model-compatibility/550e8400-e29b-41d4-a716-446655440000'
        )
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Empresa-Id', empresaId)
        .expect(404)

      expect(res.body.success).toBe(false)
    })
  })

  // ---------------------------------------------------------------------------
  // GET /part/:partModelId y /vehicle/:vehicleModelId
  // ---------------------------------------------------------------------------

  describe('GET /api/inventory/catalogs/model-compatibility/part/:partModelId', () => {
    test('Debe obtener compatibilidades de un modelo de parte', async () => {
      const res = await request(app)
        .get(`/api/inventory/catalogs/model-compatibility/part/${partModelId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Empresa-Id', empresaId)
        .expect(200)

      expect(Array.isArray(res.body.data)).toBe(true)
    })

    test('Debe retornar 404 con partModelId inexistente', async () => {
      const res = await request(app)
        .get(
          '/api/inventory/catalogs/model-compatibility/part/550e8400-e29b-41d4-a716-446655440000'
        )
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Empresa-Id', empresaId)
        .expect(404)

      expect(res.body.success).toBe(false)
    })
  })

  describe('GET /api/inventory/catalogs/model-compatibility/vehicle/:vehicleModelId', () => {
    test('Debe obtener compatibilidades de un modelo de vehículo', async () => {
      const res = await request(app)
        .get(
          `/api/inventory/catalogs/model-compatibility/vehicle/${vehicleModelId}`
        )
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Empresa-Id', empresaId)
        .expect(200)

      expect(Array.isArray(res.body.data)).toBe(true)
    })
  })

  // ---------------------------------------------------------------------------
  // PUT /:id
  // ---------------------------------------------------------------------------

  describe('PUT /api/inventory/catalogs/model-compatibility/:id', () => {
    test('Debe actualizar notas de compatibilidad', async () => {
      const res = await request(app)
        .put(`/api/inventory/catalogs/model-compatibility/${compatibilityId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Empresa-Id', empresaId)
        .send({ notes: 'Notas actualizadas' })
        .expect(200)

      expect(res.body.data.notes).toBe('Notas actualizadas')
    })
  })

  // ---------------------------------------------------------------------------
  // PATCH /:id/verify
  // ---------------------------------------------------------------------------

  describe('PATCH /api/inventory/catalogs/model-compatibility/:id/verify', () => {
    test('Debe marcar compatibilidad como verificada', async () => {
      // Crear otra para verificar sin afectar el principal
      const newPartRes = await request(app)
        .post('/api/inventory/catalogs/models')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Empresa-Id', empresaId)
        .send({ brandId, name: `Verify Part ${Date.now()}`, type: 'PART' })
      const newPartId = newPartRes.body.data?.id

      const createRes = await request(app)
        .post('/api/inventory/catalogs/model-compatibility')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Empresa-Id', empresaId)
        .send({ partModelId: newPartId, vehicleModelId })
      const newCompatId = createRes.body.data?.id

      const res = await request(app)
        .patch(
          `/api/inventory/catalogs/model-compatibility/${newCompatId}/verify`
        )
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Empresa-Id', empresaId)
        .expect(200)

      expect(res.body.data.isVerified).toBe(true)
    })

    test('Debe fallar al verificar una compatibilidad ya verificada', async () => {
      // Primero verificar el principal
      await request(app)
        .put(`/api/inventory/catalogs/model-compatibility/${compatibilityId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Empresa-Id', empresaId)
        .send({ isVerified: true })

      const res = await request(app)
        .patch(
          `/api/inventory/catalogs/model-compatibility/${compatibilityId}/verify`
        )
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Empresa-Id', empresaId)
        .expect(400)

      expect(res.body.message).toContain('ya está verificada')
    })
  })

  // ---------------------------------------------------------------------------
  // DELETE /:id
  // ---------------------------------------------------------------------------

  describe('DELETE /api/inventory/catalogs/model-compatibility/:id', () => {
    test('Debe eliminar una compatibilidad', async () => {
      const newPartRes = await request(app)
        .post('/api/inventory/catalogs/models')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Empresa-Id', empresaId)
        .send({ brandId, name: `Delete Part ${Date.now()}`, type: 'PART' })
      const newPartId = newPartRes.body.data?.id

      const createRes = await request(app)
        .post('/api/inventory/catalogs/model-compatibility')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Empresa-Id', empresaId)
        .send({ partModelId: newPartId, vehicleModelId })
      const deleteCompatId = createRes.body.data?.id

      const res = await request(app)
        .delete(`/api/inventory/catalogs/model-compatibility/${deleteCompatId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Empresa-Id', empresaId)
        .expect(200)

      expect(res.body.success).toBe(true)

      const getRes = await request(app)
        .get(`/api/inventory/catalogs/model-compatibility/${deleteCompatId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Empresa-Id', empresaId)
      expect(getRes.status).toBe(404)
    })

    test('Debe retornar 404 al eliminar compatibilidad inexistente', async () => {
      const res = await request(app)
        .delete(
          '/api/inventory/catalogs/model-compatibility/550e8400-e29b-41d4-a716-446655440000'
        )
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Empresa-Id', empresaId)
        .expect(404)

      expect(res.body.success).toBe(false)
    })
  })
})
