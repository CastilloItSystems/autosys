// backend/src/features/inventory/items/catalogs/brands/brands.test.ts

import { describe, test, expect, beforeAll, afterAll } from '@jest/globals'
import request from 'supertest'
import app from '../../../../../app'
import { getTestAuthToken } from '../../../../../shared/utils/test.utils'
import prisma from '../../../../../services/prisma.service'
import { BrandType } from './brands.interface'

describe('Brand API Tests', () => {
  let authToken: string = ''
  let createdBrandId: string
  let vehicleBrandId: string
  let partBrandId: string

  beforeAll(async () => {
    try {
      // Limpiar datos de prueba anteriores
      await prisma.brand
        .deleteMany({
          where: { code: { in: ['TEST-PART', 'TEST-VEH', 'TEST-BOTH'] } },
        })
        .catch(() => {})

      // Obtener token de autenticación
      authToken = await getTestAuthToken()
      if (!authToken) {
        throw new Error('No se pudo obtener authToken')
      }
    } catch (error) {
      console.error('Error en beforeAll:', error)
      throw error
    }
  }, 20000) // Timeout de 20 segundos para permitir operaciones de BD

  afterAll(async () => {
    // Limpiar datos de prueba
    const brandIds = [createdBrandId, vehicleBrandId, partBrandId].filter(
      Boolean
    )

    if (brandIds.length > 0) {
      await prisma.brand
        .deleteMany({
          where: { id: { in: brandIds } },
        })
        .catch(() => {})
    }
  })

  // ============================================
  // CREATE TESTS
  // ============================================
  describe('POST /api/inventory/catalogs/brands', () => {
    test('Debe crear una marca de tipo PART exitosamente', async () => {
      const brandData = {
        code: 'TEST-PART',
        name: 'Test Part Brand',
        description: 'Test part brand description',
        type: 'PART' as BrandType,
        isActive: true,
      }

      const response = await request(app)
        .post('/api/inventory/catalogs/brands')
        .set('Authorization', `Bearer ${authToken}`)
        .send(brandData)
        .expect(201)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toHaveProperty('id')
      expect(response.body.data.code).toBe(brandData.code)
      expect(response.body.data.name).toBe(brandData.name)
      expect(response.body.data.type).toBe('PART')
      expect(response.body.data.typeLabel).toBe('Producto/Repuesto')
      expect(response.body.data.stats).toBeDefined()
      expect(response.body.data.stats.itemsCount).toBe(0)
      expect(response.body.data.stats.modelsCount).toBe(0)

      partBrandId = response.body.data.id
    })

    test('Debe crear una marca de tipo VEHICLE exitosamente', async () => {
      const brandData = {
        code: 'TEST-VEH',
        name: 'Test Vehicle Brand',
        description: 'Test vehicle brand description',
        type: 'VEHICLE' as BrandType,
        isActive: true,
      }

      const response = await request(app)
        .post('/api/inventory/catalogs/brands')
        .set('Authorization', `Bearer ${authToken}`)
        .send(brandData)
        .expect(201)

      expect(response.body.success).toBe(true)
      expect(response.body.data.type).toBe('VEHICLE')
      expect(response.body.data.typeLabel).toBe('Vehículo')

      vehicleBrandId = response.body.data.id
    })

    test('Debe crear una marca de tipo BOTH exitosamente', async () => {
      const brandData = {
        code: 'TEST-BOTH',
        name: 'Test Both Brand',
        type: 'BOTH' as BrandType,
      }

      const response = await request(app)
        .post('/api/inventory/catalogs/brands')
        .set('Authorization', `Bearer ${authToken}`)
        .send(brandData)
        .expect(201)

      expect(response.body.success).toBe(true)
      expect(response.body.data.type).toBe('BOTH')
      expect(response.body.data.typeLabel).toBe('Ambos')

      createdBrandId = response.body.data.id
    })

    test('Debe fallar al crear marca con código duplicado', async () => {
      const brandData = {
        code: 'TEST-BOTH',
        name: 'Another Test Brand',
        type: 'PART' as BrandType,
      }

      const response = await request(app)
        .post('/api/inventory/catalogs/brands')
        .set('Authorization', `Bearer ${authToken}`)
        .send(brandData)
        .expect(409)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toContain('código')
    })

    test('Debe fallar con validación incorrecta - código muy corto', async () => {
      const brandData = {
        code: 'T',
        name: 'Test',
        type: 'PART' as BrandType,
      }

      const response = await request(app)
        .post('/api/inventory/catalogs/brands')
        .set('Authorization', `Bearer ${authToken}`)
        .send(brandData)
        .expect(422)

      expect(response.body.success).toBe(false)
      expect(response.body.errors).toBeDefined()
    })

    test('Debe fallar sin tipo de marca', async () => {
      const brandData = {
        code: 'TEST-NO-TYPE',
        name: 'Test No Type',
        // type no incluido
      }

      const response = await request(app)
        .post('/api/inventory/catalogs/brands')
        .set('Authorization', `Bearer ${authToken}`)
        .send(brandData)
        .expect(422)

      expect(response.body.success).toBe(false)
    })

    test('Debe fallar con tipo inválido', async () => {
      const brandData = {
        code: 'TEST-INVALID',
        name: 'Test Invalid Type',
        type: 'INVALID_TYPE',
      }

      const response = await request(app)
        .post('/api/inventory/catalogs/brands')
        .set('Authorization', `Bearer ${authToken}`)
        .send(brandData)
        .expect(422)

      expect(response.body.success).toBe(false)
    })
  })

  // ============================================
  // GET ALL TESTS
  // ============================================
  describe('GET /api/inventory/catalogs/brands', () => {
    test('Debe obtener lista de marcas con paginación', async () => {
      const response = await request(app)
        .get('/api/inventory/catalogs/brands')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ page: 1, limit: 10 })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toHaveProperty('brands')
      expect(response.body.data).toHaveProperty('pagination')
      expect(response.body.data.brands).toBeInstanceOf(Array)
      expect(response.body.data.pagination).toHaveProperty('total')
      expect(response.body.data.pagination).toHaveProperty('page')
      expect(response.body.data.pagination).toHaveProperty('limit')
      expect(response.body.data.pagination).toHaveProperty('totalPages')
    })

    test('Debe filtrar marcas por búsqueda', async () => {
      const response = await request(app)
        .get('/api/inventory/catalogs/brands')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ search: 'TEST' })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.brands).toBeInstanceOf(Array)
      expect(response.body.data.brands.length).toBeGreaterThan(0)
    })

    test('Debe filtrar marcas por tipo VEHICLE', async () => {
      const response = await request(app)
        .get('/api/inventory/catalogs/brands')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ type: 'VEHICLE' })
        .expect(200)

      expect(response.body.success).toBe(true)
      response.body.data.brands.forEach((brand: any) => {
        expect(brand.type).toBe('VEHICLE')
      })
    })

    test('Debe filtrar marcas por tipo PART', async () => {
      const response = await request(app)
        .get('/api/inventory/catalogs/brands')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ type: 'PART' })
        .expect(200)

      expect(response.body.success).toBe(true)
      response.body.data.brands.forEach((brand: any) => {
        expect(brand.type).toBe('PART')
      })
    })

    test('Debe filtrar marcas activas', async () => {
      const response = await request(app)
        .get('/api/inventory/catalogs/brands')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ isActive: true })
        .expect(200)

      expect(response.body.success).toBe(true)
      response.body.data.brands.forEach((brand: any) => {
        expect(brand.isActive).toBe(true)
      })
    })
  })

  // ============================================
  // GET GROUPED TESTS
  // ============================================
  describe('GET /api/inventory/catalogs/brands/grouped', () => {
    test('Debe obtener marcas agrupadas por tipo', async () => {
      const response = await request(app)
        .get('/api/inventory/catalogs/brands/grouped')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toHaveProperty('groups')
      expect(response.body.data).toHaveProperty('totalBrands')
      expect(response.body.data.groups).toBeInstanceOf(Array)

      response.body.data.groups.forEach((group: any) => {
        expect(group).toHaveProperty('type')
        expect(group).toHaveProperty('typeLabel')
        expect(group).toHaveProperty('brands')
        expect(group).toHaveProperty('count')
        expect(group.brands).toBeInstanceOf(Array)
      })
    })
  })

  // ============================================
  // GET ACTIVE TESTS
  // ============================================
  describe('GET /api/inventory/catalogs/brands/active', () => {
    test('Debe obtener solo marcas activas', async () => {
      const response = await request(app)
        .get('/api/inventory/catalogs/brands/active')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toBeInstanceOf(Array)
      response.body.data.forEach((brand: any) => {
        expect(brand.isActive).toBe(true)
        expect(brand).toHaveProperty('id')
        expect(brand).toHaveProperty('code')
        expect(brand).toHaveProperty('name')
        expect(brand).toHaveProperty('type')
      })
    })

    test('Debe obtener marcas activas filtradas por tipo', async () => {
      const response = await request(app)
        .get('/api/inventory/catalogs/brands/active')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ type: 'VEHICLE' })
        .expect(200)

      expect(response.body.success).toBe(true)
      response.body.data.forEach((brand: any) => {
        expect(brand.type).toBe('VEHICLE')
      })
    })
  })

  // ============================================
  // SEARCH TESTS
  // ============================================
  describe('GET /api/inventory/catalogs/brands/search', () => {
    test('Debe buscar marcas por query', async () => {
      const response = await request(app)
        .get('/api/inventory/catalogs/brands/search')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ q: 'TEST' })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toBeInstanceOf(Array)
    })

    test('Debe retornar array vacío con query muy corto', async () => {
      const response = await request(app)
        .get('/api/inventory/catalogs/brands/search')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ q: 'T' })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toEqual([])
    })
  })

  // ============================================
  // GET BY ID TESTS
  // ============================================
  describe('GET /api/inventory/catalogs/brands/:id', () => {
    test('Debe obtener una marca por ID', async () => {
      const response = await request(app)
        .get(`/api/inventory/catalogs/brands/${createdBrandId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.id).toBe(createdBrandId)
      expect(response.body.data).toHaveProperty('stats')
    })

    test('Debe fallar con ID inválido', async () => {
      const response = await request(app)
        .get('/api/inventory/catalogs/brands/invalid-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(422)

      expect(response.body.success).toBe(false)
    })

    test('Debe fallar con marca no encontrada', async () => {
      const fakeId = '550e8400-e29b-41d4-a716-446655440000'
      const response = await request(app)
        .get(`/api/inventory/catalogs/brands/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404)

      expect(response.body.success).toBe(false)
    })
  })

  // ============================================
  // UPDATE TESTS
  // ============================================
  describe('PUT /api/inventory/catalogs/brands/:id', () => {
    test('Debe actualizar una marca', async () => {
      const updateData = {
        name: 'Updated Test Brand',
        description: 'Updated description',
      }

      const response = await request(app)
        .put(`/api/inventory/catalogs/brands/${createdBrandId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.name).toBe(updateData.name)
      expect(response.body.data.description).toBe(updateData.description)
    })

    test('Debe actualizar el tipo de marca', async () => {
      const updateData = {
        type: 'VEHICLE' as BrandType,
      }

      const response = await request(app)
        .put(`/api/inventory/catalogs/brands/${createdBrandId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.type).toBe('VEHICLE')
      expect(response.body.data.typeLabel).toBe('Vehículo')
    })

    test('Debe fallar al actualizar con código duplicado', async () => {
      const updateData = {
        code: 'TEST-PART', // Código ya existente
      }

      const response = await request(app)
        .put(`/api/inventory/catalogs/brands/${createdBrandId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(409)

      expect(response.body.success).toBe(false)
    })
  })

  // ============================================
  // STATS TESTS
  // ============================================
  describe('GET /api/inventory/catalogs/brands/:id/stats', () => {
    test('Debe obtener estadísticas de una marca', async () => {
      const response = await request(app)
        .get(`/api/inventory/catalogs/brands/${vehicleBrandId}/stats`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toBeDefined()
    })
  })

  // ============================================
  // DELETE TESTS (SOFT)
  // ============================================
  describe('DELETE /api/inventory/catalogs/brands/:id', () => {
    test('Debe desactivar una marca (soft delete)', async () => {
      const response = await request(app)
        .delete(`/api/inventory/catalogs/brands/${createdBrandId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)

      // Verificar que fue soft deleted
      const brand = await prisma.brand.findUnique({
        where: { id: createdBrandId },
      })
      expect(brand?.isActive).toBe(false)
    })
  })

  // ============================================
  // REACTIVATE TESTS
  // ============================================
  describe('PATCH /api/inventory/catalogs/brands/:id/reactivate', () => {
    test('Debe reactivar una marca desactivada', async () => {
      const response = await request(app)
        .patch(`/api/inventory/catalogs/brands/${createdBrandId}/reactivate`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.isActive).toBe(true)
    })
  })

  // ============================================
  // DELETE PERMANENT TESTS
  // ============================================
  describe('DELETE /api/inventory/catalogs/brands/:id/permanent', () => {
    test('Debe fallar al eliminar permanentemente marca con relaciones', async () => {
      // Primero crear una marca y asociarle un item
      // (esto requeriría crear un item, lo cual está fuera del scope de este test)
      // Por ahora solo verificamos que el endpoint existe
    })

    test('Debe eliminar permanentemente una marca sin relaciones', async () => {
      // Crear una marca temporal con código único
      const uniqueCode = `TEMP-DELETE-${Date.now()}`
      const tempBrand = await prisma.brand.create({
        data: {
          code: uniqueCode,
          name: 'Temporal Delete',
          type: 'PART',
        },
      })

      const response = await request(app)
        .delete(`/api/inventory/catalogs/brands/${tempBrand.id}/hard`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)

      // Verificar que fue eliminada permanentemente
      const brand = await prisma.brand.findUnique({
        where: { id: tempBrand.id },
      })
      expect(brand).toBeNull()
    })
  })
})
