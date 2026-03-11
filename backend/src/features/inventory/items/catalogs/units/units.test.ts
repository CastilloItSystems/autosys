// backend/src/features/inventory/items/catalogs/units/units.test.ts

import { describe, test, expect, beforeAll, afterAll } from '@jest/globals'
import request from 'supertest'
import app from '../../../../../app'
import prisma from '../../../../../services/prisma.service'
import { getTestAuthToken } from '../../../../../shared/utils/test.utils'

describe('Unit API Tests', () => {
  let authToken: string = 'test-token'
  let createdUnitId: string

  beforeAll(async () => {
    // Limpiar datos de prueba anteriores
    await prisma.unit
      .deleteMany({
        where: { code: { in: ['TESTUN', 'KG', 'L'] } },
      })
      .catch(() => {})

    // Obtener token de autenticación
    // authToken = await getTestAuthToken();
    authToken = await getTestAuthToken()
  })

  afterAll(async () => {
    // Limpiar datos de prueba
    if (createdUnitId) {
      await prisma.unit.delete({ where: { id: createdUnitId } }).catch(() => {})
    }
  })

  describe('POST /api/inventory/catalogs/units', () => {
    test('Debe crear una unidad exitosamente', async () => {
      const unitData = {
        code: 'TESTUN',
        name: 'Test Unit',
        abbreviation: 'tu',
        type: 'COUNTABLE',
        isActive: true,
      }

      const response = await request(app)
        .post('/api/inventory/catalogs/units')
        .set('Authorization', `Bearer ${authToken}`)
        .send(unitData)
        .expect(201)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toHaveProperty('id')
      expect(response.body.data.code).toBe(unitData.code)
      expect(response.body.data.name).toBe(unitData.name)
      expect(response.body.data.abbreviation).toBe(unitData.abbreviation)
      expect(response.body.data.type).toBe(unitData.type)
      expect(response.body.data.typeLabel).toBe('Contable')

      createdUnitId = response.body.data.id
    })

    test('Debe fallar al crear unidad con código duplicado', async () => {
      const unitData = {
        code: 'TESTUN',
        name: 'Another Test Unit',
        abbreviation: 'tu2',
        type: 'COUNTABLE',
      }

      const response = await request(app)
        .post('/api/inventory/catalogs/units')
        .set('Authorization', `Bearer ${authToken}`)
        .send(unitData)
        .expect(409)

      expect(response.body.success).toBe(false)
    })

    test('Debe fallar con tipo inválido', async () => {
      const unitData = {
        code: 'TESTUN2',
        name: 'Invalid Type Unit',
        abbreviation: 'itu',
        type: 'INVALID_TYPE',
      }

      const response = await request(app)
        .post('/api/inventory/catalogs/units')
        .set('Authorization', `Bearer ${authToken}`)
        .send(unitData)
        .expect(422)

      expect(response.body.success).toBe(false)
    })

    test('Debe fallar con código que contiene caracteres inválidos', async () => {
      const unitData = {
        code: 'TEST-UNIT',
        name: 'Invalid Code Unit',
        abbreviation: 'icu',
        type: 'WEIGHT',
      }

      const response = await request(app)
        .post('/api/inventory/catalogs/units')
        .set('Authorization', `Bearer ${authToken}`)
        .send(unitData)
        .expect(422)

      expect(response.body.success).toBe(false)
    })
  })

  describe('GET /api/inventory/catalogs/units', () => {
    test('Debe obtener lista de unidades con paginación', async () => {
      const response = await request(app)
        .get('/api/inventory/catalogs/units')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ page: 1, limit: 10 })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toBeInstanceOf(Array)
      expect(response.body.meta).toHaveProperty('total')
      expect(response.body.meta).toHaveProperty('page')
    })

    test('Debe filtrar unidades por tipo', async () => {
      const response = await request(app)
        .get('/api/inventory/catalogs/units')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ type: 'COUNTABLE' })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toBeInstanceOf(Array)
      response.body.data.forEach((unit: any) => {
        expect(unit.type).toBe('COUNTABLE')
      })
    })

    test('Debe buscar unidades por término', async () => {
      const response = await request(app)
        .get('/api/inventory/catalogs/units')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ search: 'TEST' })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toBeInstanceOf(Array)
    })
  })

  describe('GET /api/inventory/catalogs/units/grouped', () => {
    test('Debe obtener unidades agrupadas por tipo', async () => {
      const response = await request(app)
        .get('/api/inventory/catalogs/units/grouped')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toBeInstanceOf(Array)

      if (response.body.data.length > 0) {
        const group = response.body.data[0]
        expect(group).toHaveProperty('type')
        expect(group).toHaveProperty('typeLabel')
        expect(group).toHaveProperty('units')
        expect(group).toHaveProperty('count')
        expect(group.units).toBeInstanceOf(Array)
      }
    })
  })

  describe('GET /api/inventory/catalogs/units/type/:type', () => {
    test('Debe obtener unidades de un tipo específico', async () => {
      const response = await request(app)
        .get('/api/inventory/catalogs/units/type/COUNTABLE')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toBeInstanceOf(Array)
      response.body.data.forEach((unit: any) => {
        expect(unit.type).toBe('COUNTABLE')
      })
    })

    test('Debe fallar con tipo inválido', async () => {
      const response = await request(app)
        .get('/api/inventory/catalogs/units/type/INVALID')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400)

      expect(response.body.success).toBe(false)
    })
  })

  describe('GET /api/inventory/catalogs/units/:id', () => {
    test('Debe obtener una unidad por ID', async () => {
      const response = await request(app)
        .get(`/api/inventory/catalogs/units/${createdUnitId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.id).toBe(createdUnitId)
      expect(response.body.data.typeLabel).toBeDefined()
    })

    test('Debe fallar con ID inválido', async () => {
      const response = await request(app)
        .get('/api/inventory/catalogs/units/invalid-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(422)

      expect(response.body.success).toBe(false)
    })
  })

  describe('PUT /api/inventory/catalogs/units/:id', () => {
    test('Debe actualizar una unidad', async () => {
      const updateData = {
        name: 'Updated Test Unit',
        abbreviation: 'utu',
      }

      const response = await request(app)
        .put(`/api/inventory/catalogs/units/${createdUnitId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.name).toBe(updateData.name)
      expect(response.body.data.abbreviation).toBe(updateData.abbreviation)
    })

    test('Debe fallar al cambiar a código existente', async () => {
      // Primero crear otra unidad
      const anotherUnit = await prisma.unit.create({
        data: {
          code: 'ANOTHER',
          name: 'Another Unit',
          abbreviation: 'au',
          type: 'WEIGHT',
        },
      })

      // Intentar actualizar con código existente
      const response = await request(app)
        .put(`/api/inventory/catalogs/units/${createdUnitId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ code: 'ANOTHER' })
        .expect(409)

      expect(response.body.success).toBe(false)

      // Limpiar
      await prisma.unit.delete({ where: { id: anotherUnit.id } })
    })
  })

  describe('PATCH /api/inventory/catalogs/units/:id/toggle', () => {
    test('Debe cambiar el estado activo de una unidad', async () => {
      const response = await request(app)
        .patch(`/api/inventory/catalogs/units/${createdUnitId}/toggle`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toHaveProperty('isActive')
    })
  })

  describe('POST /api/inventory/catalogs/units/bulk', () => {
    test('Debe importar unidades masivamente', async () => {
      const units = [
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
      ]

      const response = await request(app)
        .post('/api/inventory/catalogs/units/bulk')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ units })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.success.length).toBeGreaterThan(0)

      // Limpiar
      for (const unit of units) {
        await prisma.unit.delete({ where: { code: unit.code } }).catch(() => {})
      }
    })
  })

  describe('DELETE /api/inventory/catalogs/units/:id', () => {
    test('Debe eliminar una unidad (soft delete)', async () => {
      const response = await request(app)
        .delete(`/api/inventory/catalogs/units/${createdUnitId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)

      // Verificar que fue soft deleted
      const unit = await prisma.unit.findUnique({
        where: { id: createdUnitId },
      })
      expect(unit?.isActive).toBe(false)
    })
  })
})
