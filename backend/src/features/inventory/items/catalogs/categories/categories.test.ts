// backend/src/features/inventory/items/catalogs/categories/categories.test.ts

import { describe, test, expect, beforeAll, afterAll } from '@jest/globals'
import request from 'supertest'
import app from '../../../../../app'
import prisma from '../../../../../services/prisma.service'
import { getTestAuthToken } from '../../../../../shared/utils/test.utils'

describe('Category API Tests', () => {
  let authToken: string
  let parentCategoryId: string
  let childCategoryId: string

  beforeAll(async () => {
    // Obtener token de autenticación
    authToken = await getTestAuthToken()

    // Limpiar datos de prueba anteriores si existen
    await prisma.category
      .deleteMany({
        where: {
          code: { in: ['TEST-CAT', 'TEST-SUBCAT'] },
        },
      })
      .catch(() => {})
  })

  afterAll(async () => {
    // Limpiar datos de prueba
    if (childCategoryId) {
      await prisma.category
        .delete({ where: { id: childCategoryId } })
        .catch(() => {})
    }
    if (parentCategoryId) {
      await prisma.category
        .delete({ where: { id: parentCategoryId } })
        .catch(() => {})
    }
  })

  describe('POST /api/inventory/catalogs/categories', () => {
    test('Debe crear una categoría padre exitosamente', async () => {
      const categoryData = {
        code: 'TEST-CAT',
        name: 'Test Category',
        description: 'Test category description',
        defaultMargin: 25.5,
        isActive: true,
      }

      const response = await request(app)
        .post('/api/inventory/catalogs/categories')
        .set('Authorization', `Bearer ${authToken}`)
        .send(categoryData)
        .expect(201)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toHaveProperty('id')
      expect(response.body.data.code).toBe(categoryData.code)
      expect(response.body.data.name).toBe(categoryData.name)
      expect(response.body.data.defaultMargin).toBe(categoryData.defaultMargin)

      parentCategoryId = response.body.data.id
    })

    test('Debe crear una subcategoría exitosamente', async () => {
      const categoryData = {
        code: 'TEST-SUBCAT',
        name: 'Test Subcategory',
        parentId: parentCategoryId,
        isActive: true,
      }

      const response = await request(app)
        .post('/api/inventory/catalogs/categories')
        .set('Authorization', `Bearer ${authToken}`)
        .send(categoryData)
        .expect(201)

      expect(response.body.success).toBe(true)
      expect(response.body.data.parentId).toBe(parentCategoryId)

      childCategoryId = response.body.data.id
    })

    test('Debe fallar al crear categoría con código duplicado', async () => {
      const categoryData = {
        code: 'TEST-CAT',
        name: 'Another Test Category',
      }

      const response = await request(app)
        .post('/api/inventory/catalogs/categories')
        .set('Authorization', `Bearer ${authToken}`)
        .send(categoryData)
        .expect(409)

      expect(response.body.success).toBe(false)
    })

    test('Debe fallar al crear categoría con padre inexistente', async () => {
      const categoryData = {
        code: 'TEST-CAT-INVALID',
        name: 'Invalid Parent Category',
        parentId: '550e8400-e29b-41d4-a716-446655440000',
      }

      const response = await request(app)
        .post('/api/inventory/catalogs/categories')
        .set('Authorization', `Bearer ${authToken}`)
        .send(categoryData)
        .expect(404)

      expect(response.body.success).toBe(false)
    })
  })

  describe('GET /api/inventory/catalogs/categories/tree', () => {
    test('Debe obtener el árbol completo de categorías', async () => {
      const response = await request(app)
        .get('/api/inventory/catalogs/categories/tree')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toBeInstanceOf(Array)

      // Verificar estructura de árbol
      if (response.body.data.length > 0) {
        const firstCategory = response.body.data[0]
        expect(firstCategory).toHaveProperty('children')
        expect(firstCategory).toHaveProperty('level')
      }
    })
  })

  describe('GET /api/inventory/catalogs/categories/:id/children', () => {
    test('Debe obtener los hijos directos de una categoría', async () => {
      const response = await request(app)
        .get(`/api/inventory/catalogs/categories/${parentCategoryId}/children`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toBeInstanceOf(Array)
      expect(response.body.data.length).toBeGreaterThan(0)
      expect(response.body.data[0].parentId).toBe(parentCategoryId)
    })
  })

  describe('GET /api/inventory/catalogs/categories/:id/path', () => {
    test('Debe obtener el path completo de una subcategoría', async () => {
      const response = await request(app)
        .get(`/api/inventory/catalogs/categories/${childCategoryId}/path`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toBeInstanceOf(Array)
      expect(response.body.data.length).toBe(2) // Padre + Hijo
      expect(response.body.data[0].id).toBe(parentCategoryId)
      expect(response.body.data[1].id).toBe(childCategoryId)
    })
  })

  describe('PATCH /api/inventory/catalogs/categories/:id/move', () => {
    test('Debe fallar al crear referencia circular', async () => {
      // Intentar mover el padre como hijo del hijo (esto debe fallar)
      const response = await request(app)
        .patch(`/api/inventory/catalogs/categories/${parentCategoryId}/move`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ parentId: childCategoryId })
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toContain('circular')
    })

    test('Debe mover una categoría', async () => {
      const response = await request(app)
        .patch(`/api/inventory/catalogs/categories/${childCategoryId}/move`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ parentId: null })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.parentId).toBeNull()
    })
  })

  describe('GET /api/inventory/catalogs/categories/:id/stats', () => {
    test('Debe obtener estadísticas de una categoría', async () => {
      const response = await request(app)
        .get(`/api/inventory/catalogs/categories/${parentCategoryId}/stats`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toHaveProperty('stats')
      expect(response.body.data.stats).toHaveProperty('level')
      expect(response.body.data.stats).toHaveProperty('directChildren')
      expect(response.body.data.stats).toHaveProperty('totalDescendants')
    })
  })

  describe('DELETE /api/inventory/catalogs/categories/:id', () => {
    test('Debe fallar al eliminar categoría con hijos', async () => {
      // Primero mover el hijo de vuelta al padre
      await request(app)
        .patch(`/api/inventory/catalogs/categories/${childCategoryId}/move`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ parentId: parentCategoryId })

      // Intentar eliminar el padre
      const response = await request(app)
        .delete(`/api/inventory/catalogs/categories/${parentCategoryId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toContain('subcategorías')
    })

    test('Debe eliminar una categoría sin hijos', async () => {
      const response = await request(app)
        .delete(`/api/inventory/catalogs/categories/${childCategoryId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
    })
  })
})
