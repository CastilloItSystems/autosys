// backend/src/features/inventory/items/catalogs/brands/brands.test.ts

import { describe, test, expect, beforeAll, afterAll } from '@jest/globals'
import request from 'supertest'
import app from '../../../../../app.js'
import prisma from '../../../../../services/prisma.service.js'
import { getTestCredentials } from '../../../../../shared/utils/test.utils.js'
import { BrandType } from './brands.interface.js'

describe('Brand API Tests', () => {
  let authToken: string
  let empresaId: string
  let createdBrandId: string
  let vehicleBrandId: string
  let partBrandId: string

  beforeAll(async () => {
    const creds = await getTestCredentials()
    authToken = creds.authToken
    empresaId = creds.empresaId

    // Limpiar datos de prueba anteriores scoped por empresa
    await prisma.brand
      .deleteMany({
        where: {
          empresaId,
          code: { in: ['TEST-PART', 'TEST-VEH', 'TEST-BOTH'] },
        },
      })
      .catch(() => {})
  }, 20000)

  afterAll(async () => {
    const ids = [createdBrandId, vehicleBrandId, partBrandId].filter(Boolean)
    if (ids.length > 0) {
      await prisma.brand
        .deleteMany({ where: { empresaId, id: { in: ids } } })
        .catch(() => {})
    }
  })

  // ---------------------------------------------------------------------------
  // POST /
  // ---------------------------------------------------------------------------

  describe('POST /api/inventory/catalogs/brands', () => {
    test('Debe crear una marca de tipo PART exitosamente', async () => {
      const res = await request(app)
        .post('/api/inventory/catalogs/brands')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Empresa-Id', empresaId)
        .send({
          code: 'TEST-PART',
          name: 'Test Part Brand',
          description: 'Test part brand',
          type: 'PART' as BrandType,
          isActive: true,
        })
        .expect(201)

      expect(res.body.success).toBe(true)
      expect(res.body.data).toHaveProperty('id')
      expect(res.body.data.code).toBe('TEST-PART')
      expect(res.body.data.type).toBe('PART')
      expect(res.body.data.typeLabel).toBe('Producto/Repuesto')
      expect(res.body.data.stats).toBeDefined()
      expect(res.body.data.stats.itemsCount).toBe(0)
      expect(res.body.data.stats.modelsCount).toBe(0)

      partBrandId = res.body.data.id
    })

    test('Debe crear una marca de tipo VEHICLE exitosamente', async () => {
      const res = await request(app)
        .post('/api/inventory/catalogs/brands')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Empresa-Id', empresaId)
        .send({
          code: 'TEST-VEH',
          name: 'Test Vehicle Brand',
          type: 'VEHICLE' as BrandType,
          isActive: true,
        })
        .expect(201)

      expect(res.body.success).toBe(true)
      expect(res.body.data.type).toBe('VEHICLE')
      expect(res.body.data.typeLabel).toBe('Vehículo')

      vehicleBrandId = res.body.data.id
    })

    test('Debe crear una marca de tipo BOTH exitosamente', async () => {
      const res = await request(app)
        .post('/api/inventory/catalogs/brands')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Empresa-Id', empresaId)
        .send({
          code: 'TEST-BOTH',
          name: 'Test Both Brand',
          type: 'BOTH' as BrandType,
        })
        .expect(201)

      expect(res.body.success).toBe(true)
      expect(res.body.data.type).toBe('BOTH')
      expect(res.body.data.typeLabel).toBe('Ambos')

      createdBrandId = res.body.data.id
    })

    test('Debe fallar con código duplicado en la misma empresa', async () => {
      const res = await request(app)
        .post('/api/inventory/catalogs/brands')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Empresa-Id', empresaId)
        .send({
          code: 'TEST-BOTH',
          name: 'Another Brand',
          type: 'PART' as BrandType,
        })
        .expect(409)

      expect(res.body.success).toBe(false)
      expect(res.body.message).toContain('código')
    })

    test('Debe fallar con código muy corto', async () => {
      const res = await request(app)
        .post('/api/inventory/catalogs/brands')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Empresa-Id', empresaId)
        .send({ code: 'T', name: 'Test', type: 'PART' as BrandType })
        .expect(422)

      expect(res.body.success).toBe(false)
    })

    test('Debe fallar sin tipo de marca', async () => {
      const res = await request(app)
        .post('/api/inventory/catalogs/brands')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Empresa-Id', empresaId)
        .send({ code: 'TEST-NOTYPE', name: 'Test No Type' })
        .expect(422)

      expect(res.body.success).toBe(false)
    })

    test('Debe fallar con tipo inválido', async () => {
      const res = await request(app)
        .post('/api/inventory/catalogs/brands')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Empresa-Id', empresaId)
        .send({
          code: 'TEST-INVALID',
          name: 'Test Invalid',
          type: 'INVALID_TYPE',
        })
        .expect(422)

      expect(res.body.success).toBe(false)
    })
  })

  // ---------------------------------------------------------------------------
  // GET /
  // ---------------------------------------------------------------------------

  describe('GET /api/inventory/catalogs/brands', () => {
    test('Debe obtener lista de marcas con paginación', async () => {
      const res = await request(app)
        .get('/api/inventory/catalogs/brands')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Empresa-Id', empresaId)
        .query({ page: 1, limit: 10 })
        .expect(200)

      expect(res.body.success).toBe(true)
      expect(Array.isArray(res.body.data)).toBe(true)
      expect(res.body.meta).toHaveProperty('total')
      expect(res.body.meta).toHaveProperty('page')
    })

    test('Debe filtrar marcas por búsqueda', async () => {
      const res = await request(app)
        .get('/api/inventory/catalogs/brands')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Empresa-Id', empresaId)
        .query({ search: 'TEST' })
        .expect(200)

      expect(res.body.success).toBe(true)
      expect(res.body.data.length).toBeGreaterThan(0)
    })

    test('Debe filtrar marcas por tipo VEHICLE', async () => {
      const res = await request(app)
        .get('/api/inventory/catalogs/brands')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Empresa-Id', empresaId)
        .query({ type: 'VEHICLE' })
        .expect(200)

      expect(res.body.success).toBe(true)
      res.body.data.forEach((brand: Record<string, unknown>) => {
        expect(brand.type).toBe('VEHICLE')
      })
    })

    test('Debe filtrar marcas activas', async () => {
      const res = await request(app)
        .get('/api/inventory/catalogs/brands')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Empresa-Id', empresaId)
        .query({ isActive: true })
        .expect(200)

      expect(res.body.success).toBe(true)
      res.body.data.forEach((brand: Record<string, unknown>) => {
        expect(brand.isActive).toBe(true)
      })
    })
  })

  // ---------------------------------------------------------------------------
  // GET /grouped
  // ---------------------------------------------------------------------------

  describe('GET /api/inventory/catalogs/brands/grouped', () => {
    test('Debe obtener marcas agrupadas por tipo', async () => {
      const res = await request(app)
        .get('/api/inventory/catalogs/brands/grouped')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Empresa-Id', empresaId)
        .expect(200)

      expect(res.body.success).toBe(true)
      expect(res.body.data).toHaveProperty('groups')
      expect(res.body.data).toHaveProperty('totalBrands')
      expect(Array.isArray(res.body.data.groups)).toBe(true)

      res.body.data.groups.forEach((group: Record<string, unknown>) => {
        expect(group).toHaveProperty('type')
        expect(group).toHaveProperty('typeLabel')
        expect(group).toHaveProperty('brands')
        expect(group).toHaveProperty('count')
        expect(Array.isArray(group.brands)).toBe(true)
      })
    })
  })

  // ---------------------------------------------------------------------------
  // GET /active
  // ---------------------------------------------------------------------------

  describe('GET /api/inventory/catalogs/brands/active', () => {
    test('Debe obtener solo marcas activas', async () => {
      const res = await request(app)
        .get('/api/inventory/catalogs/brands/active')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Empresa-Id', empresaId)
        .expect(200)

      expect(res.body.success).toBe(true)
      expect(Array.isArray(res.body.data)).toBe(true)
      res.body.data.forEach((brand: Record<string, unknown>) => {
        expect(brand.isActive).toBe(true)
      })
    })

    test('Debe filtrar marcas activas por tipo', async () => {
      const res = await request(app)
        .get('/api/inventory/catalogs/brands/active')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Empresa-Id', empresaId)
        .query({ type: 'VEHICLE' })
        .expect(200)

      expect(res.body.success).toBe(true)
      res.body.data.forEach((brand: Record<string, unknown>) => {
        expect(brand.type).toBe('VEHICLE')
      })
    })
  })

  // ---------------------------------------------------------------------------
  // GET /search
  // ---------------------------------------------------------------------------

  describe('GET /api/inventory/catalogs/brands/search', () => {
    test('Debe buscar marcas por query', async () => {
      const res = await request(app)
        .get('/api/inventory/catalogs/brands/search')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Empresa-Id', empresaId)
        .query({ q: 'TEST' })
        .expect(200)

      expect(res.body.success).toBe(true)
      expect(Array.isArray(res.body.data)).toBe(true)
    })

    test('Debe retornar array vacío con query muy corto', async () => {
      const res = await request(app)
        .get('/api/inventory/catalogs/brands/search')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Empresa-Id', empresaId)
        .query({ q: 'T' })
        .expect(200)

      expect(res.body.success).toBe(true)
      expect(res.body.data).toEqual([])
    })

    test('Debe fallar sin query', async () => {
      const res = await request(app)
        .get('/api/inventory/catalogs/brands/search')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Empresa-Id', empresaId)
        .expect(400)

      expect(res.body.success).toBe(false)
    })
  })

  // ---------------------------------------------------------------------------
  // GET /:id y /:id/stats
  // ---------------------------------------------------------------------------

  describe('GET /api/inventory/catalogs/brands/:id', () => {
    test('Debe obtener una marca por ID', async () => {
      const res = await request(app)
        .get(`/api/inventory/catalogs/brands/${createdBrandId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Empresa-Id', empresaId)
        .expect(200)

      expect(res.body.success).toBe(true)
      expect(res.body.data.id).toBe(createdBrandId)
      expect(res.body.data).toHaveProperty('stats')
    })

    test('Debe retornar 422 con ID inválido', async () => {
      const res = await request(app)
        .get('/api/inventory/catalogs/brands/invalid-id')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Empresa-Id', empresaId)
        .expect(422)

      expect(res.body.success).toBe(false)
    })

    test('Debe retornar 404 con marca inexistente', async () => {
      const res = await request(app)
        .get(
          '/api/inventory/catalogs/brands/550e8400-e29b-41d4-a716-446655440000'
        )
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Empresa-Id', empresaId)
        .expect(404)

      expect(res.body.success).toBe(false)
    })
  })

  describe('GET /api/inventory/catalogs/brands/:id/stats', () => {
    test('Debe obtener estadísticas de una marca', async () => {
      const res = await request(app)
        .get(`/api/inventory/catalogs/brands/${vehicleBrandId}/stats`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Empresa-Id', empresaId)
        .expect(200)

      expect(res.body.success).toBe(true)
      expect(res.body.data).toHaveProperty('total')
      expect(res.body.data).toHaveProperty('byType')
      expect(res.body.data).toHaveProperty('active')
    })
  })

  // ---------------------------------------------------------------------------
  // PUT /:id
  // ---------------------------------------------------------------------------

  describe('PUT /api/inventory/catalogs/brands/:id', () => {
    test('Debe actualizar una marca', async () => {
      const res = await request(app)
        .put(`/api/inventory/catalogs/brands/${createdBrandId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Empresa-Id', empresaId)
        .send({
          name: 'Updated Test Brand',
          description: 'Updated description',
        })
        .expect(200)

      expect(res.body.success).toBe(true)
      expect(res.body.data.name).toBe('Updated Test Brand')
      expect(res.body.data.description).toBe('Updated description')
    })

    test('Debe actualizar el tipo de marca', async () => {
      const res = await request(app)
        .put(`/api/inventory/catalogs/brands/${createdBrandId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Empresa-Id', empresaId)
        .send({ type: 'VEHICLE' as BrandType })
        .expect(200)

      expect(res.body.success).toBe(true)
      expect(res.body.data.type).toBe('VEHICLE')
      expect(res.body.data.typeLabel).toBe('Vehículo')
    })

    test('Debe fallar al actualizar con código duplicado', async () => {
      const res = await request(app)
        .put(`/api/inventory/catalogs/brands/${createdBrandId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Empresa-Id', empresaId)
        .send({ code: 'TEST-PART' })
        .expect(409)

      expect(res.body.success).toBe(false)
    })
  })

  // ---------------------------------------------------------------------------
  // PATCH /:id/toggle y /:id/reactivate
  // ---------------------------------------------------------------------------

  describe('PATCH /api/inventory/catalogs/brands/:id/toggle', () => {
    test('Debe cambiar el estado activo de una marca', async () => {
      const res = await request(app)
        .patch(`/api/inventory/catalogs/brands/${createdBrandId}/toggle`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Empresa-Id', empresaId)
        .expect(200)

      expect(res.body.success).toBe(true)
      expect(res.body.data).toHaveProperty('isActive')
    })
  })

  describe('PATCH /api/inventory/catalogs/brands/:id/reactivate', () => {
    test('Debe reactivar una marca desactivada', async () => {
      // Primero desactivar
      await prisma.brand.update({
        where: { id: createdBrandId },
        data: { isActive: false },
      })

      const res = await request(app)
        .patch(`/api/inventory/catalogs/brands/${createdBrandId}/reactivate`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Empresa-Id', empresaId)
        .expect(200)

      expect(res.body.success).toBe(true)
      expect(res.body.data.isActive).toBe(true)
    })
  })

  // ---------------------------------------------------------------------------
  // DELETE /:id (soft) y /:id/hard
  // ---------------------------------------------------------------------------

  describe('DELETE /api/inventory/catalogs/brands/:id', () => {
    test('Debe desactivar una marca (soft delete)', async () => {
      const res = await request(app)
        .delete(`/api/inventory/catalogs/brands/${createdBrandId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Empresa-Id', empresaId)
        .expect(200)

      expect(res.body.success).toBe(true)

      const brand = await prisma.brand.findUnique({
        where: { id: createdBrandId },
      })
      expect(brand?.isActive).toBe(false)
    })
  })

  describe('DELETE /api/inventory/catalogs/brands/:id/hard', () => {
    test('Debe eliminar permanentemente una marca sin relaciones', async () => {
      const tempBrand = await prisma.brand.create({
        data: {
          empresaId,
          code: `TEMP-${Date.now()}`,
          name: 'Temporal Delete',
          type: 'PART',
        },
      })

      const res = await request(app)
        .delete(`/api/inventory/catalogs/brands/${tempBrand.id}/hard`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Empresa-Id', empresaId)
        .expect(200)

      expect(res.body.success).toBe(true)

      const brand = await prisma.brand.findUnique({
        where: { id: tempBrand.id },
      })
      expect(brand).toBeNull()
    })

    test('Debe retornar 404 con marca inexistente', async () => {
      const res = await request(app)
        .delete(
          '/api/inventory/catalogs/brands/00000000-0000-0000-0000-000000000000/hard'
        )
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Empresa-Id', empresaId)
        .expect(404)

      expect(res.body.success).toBe(false)
    })
  })
})
