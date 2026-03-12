// backend/src/features/inventory/items/catalogs/categories/categories.test.ts

import { describe, test, expect, beforeAll, afterAll } from '@jest/globals'
import request from 'supertest'
import app from '../../../../../app.js'
import prisma from '../../../../../services/prisma.service.js'
import { getTestCredentials } from '../../../../../shared/utils/test.utils.js'

describe('Category API Tests', () => {
  let authToken: string
  let empresaId: string
  let parentCategoryId: string
  let childCategoryId: string

  beforeAll(async () => {
    const creds = await getTestCredentials()
    authToken = creds.authToken
    empresaId = creds.empresaId

    await prisma.category
      .deleteMany({
        where: {
          empresaId,
          code: { in: ['TEST-CAT', 'TEST-SUBCAT', 'TEST-CAT-INVALID'] },
        },
      })
      .catch(() => {})
  }, 20000)

  afterAll(async () => {
    const ids = [childCategoryId, parentCategoryId].filter(Boolean)
    if (ids.length > 0) {
      await prisma.category
        .deleteMany({ where: { empresaId, id: { in: ids } } })
        .catch(() => {})
    }
  })

  // ---------------------------------------------------------------------------
  // POST /
  // ---------------------------------------------------------------------------

  describe('POST /api/inventory/catalogs/categories', () => {
    test('Debe crear una categoría padre exitosamente', async () => {
      const res = await request(app)
        .post('/api/inventory/catalogs/categories')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Empresa-Id', empresaId)
        .send({
          code: 'TEST-CAT',
          name: 'Test Category',
          description: 'Test category description',
          defaultMargin: 25.5,
          isActive: true,
        })
        .expect(201)

      expect(res.body.success).toBe(true)
      expect(res.body.data).toHaveProperty('id')
      expect(res.body.data.code).toBe('TEST-CAT')
      expect(res.body.data.name).toBe('Test Category')
      expect(res.body.data.defaultMargin).toBe(25.5)

      parentCategoryId = res.body.data.id
    })

    test('Debe crear una subcategoría exitosamente', async () => {
      const res = await request(app)
        .post('/api/inventory/catalogs/categories')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Empresa-Id', empresaId)
        .send({
          code: 'TEST-SUBCAT',
          name: 'Test Subcategory',
          parentId: parentCategoryId,
          isActive: true,
        })
        .expect(201)

      expect(res.body.success).toBe(true)
      expect(res.body.data.parentId).toBe(parentCategoryId)

      childCategoryId = res.body.data.id
    })

    test('Debe fallar con código duplicado en la misma empresa', async () => {
      const res = await request(app)
        .post('/api/inventory/catalogs/categories')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Empresa-Id', empresaId)
        .send({ code: 'TEST-CAT', name: 'Another Category' })
        .expect(409)

      expect(res.body.success).toBe(false)
    })

    test('Debe fallar con categoría padre inexistente', async () => {
      const res = await request(app)
        .post('/api/inventory/catalogs/categories')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Empresa-Id', empresaId)
        .send({
          code: 'TEST-CAT-INVALID',
          name: 'Invalid Parent',
          parentId: '550e8400-e29b-41d4-a716-446655440000',
        })
        .expect(404)

      expect(res.body.success).toBe(false)
    })
  })

  // ---------------------------------------------------------------------------
  // GET /tree
  // ---------------------------------------------------------------------------

  describe('GET /api/inventory/catalogs/categories/tree', () => {
    test('Debe obtener el árbol completo de categorías', async () => {
      const res = await request(app)
        .get('/api/inventory/catalogs/categories/tree')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Empresa-Id', empresaId)
        .expect(200)

      expect(res.body.success).toBe(true)
      expect(Array.isArray(res.body.data)).toBe(true)

      if (res.body.data.length > 0) {
        expect(res.body.data[0]).toHaveProperty('children')
        expect(res.body.data[0]).toHaveProperty('level')
      }
    })
  })

  // ---------------------------------------------------------------------------
  // GET /:id/children
  // ---------------------------------------------------------------------------

  describe('GET /api/inventory/catalogs/categories/:id/children', () => {
    test('Debe obtener los hijos directos de una categoría', async () => {
      const res = await request(app)
        .get(`/api/inventory/catalogs/categories/${parentCategoryId}/children`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Empresa-Id', empresaId)
        .expect(200)

      expect(res.body.success).toBe(true)
      expect(Array.isArray(res.body.data)).toBe(true)
      expect(res.body.data.length).toBeGreaterThan(0)
      expect(res.body.data[0].parentId).toBe(parentCategoryId)
    })
  })

  // ---------------------------------------------------------------------------
  // GET /:id/path
  // ---------------------------------------------------------------------------

  describe('GET /api/inventory/catalogs/categories/:id/path', () => {
    test('Debe obtener el path completo de una subcategoría', async () => {
      const res = await request(app)
        .get(`/api/inventory/catalogs/categories/${childCategoryId}/path`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Empresa-Id', empresaId)
        .expect(200)

      expect(res.body.success).toBe(true)
      expect(Array.isArray(res.body.data)).toBe(true)
      expect(res.body.data.length).toBe(2)
      expect(res.body.data[0].id).toBe(parentCategoryId)
      expect(res.body.data[1].id).toBe(childCategoryId)
    })
  })

  // ---------------------------------------------------------------------------
  // PATCH /:id/move
  // ---------------------------------------------------------------------------

  describe('PATCH /api/inventory/catalogs/categories/:id/move', () => {
    test('Debe fallar al crear referencia circular', async () => {
      const res = await request(app)
        .patch(`/api/inventory/catalogs/categories/${parentCategoryId}/move`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Empresa-Id', empresaId)
        .send({ parentId: childCategoryId })
        .expect(400)

      expect(res.body.success).toBe(false)
      expect(res.body.message).toContain('circular')
    })

    test('Debe mover una categoría a raíz', async () => {
      const res = await request(app)
        .patch(`/api/inventory/catalogs/categories/${childCategoryId}/move`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Empresa-Id', empresaId)
        .send({ parentId: null })
        .expect(200)

      expect(res.body.success).toBe(true)
      expect(res.body.data.parentId).toBeNull()
    })
  })

  // ---------------------------------------------------------------------------
  // GET /:id/stats
  // ---------------------------------------------------------------------------

  describe('GET /api/inventory/catalogs/categories/:id/stats', () => {
    test('Debe obtener estadísticas de una categoría', async () => {
      const res = await request(app)
        .get(`/api/inventory/catalogs/categories/${parentCategoryId}/stats`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Empresa-Id', empresaId)
        .expect(200)

      expect(res.body.success).toBe(true)
      expect(res.body.data).toHaveProperty('stats')
      expect(res.body.data.stats).toHaveProperty('level')
      expect(res.body.data.stats).toHaveProperty('directChildren')
      expect(res.body.data.stats).toHaveProperty('totalDescendants')
    })
  })

  // ---------------------------------------------------------------------------
  // DELETE
  // ---------------------------------------------------------------------------

  describe('DELETE /api/inventory/catalogs/categories/:id', () => {
    test('Debe fallar al eliminar categoría con hijos', async () => {
      // Mover el hijo de vuelta al padre
      await request(app)
        .patch(`/api/inventory/catalogs/categories/${childCategoryId}/move`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Empresa-Id', empresaId)
        .send({ parentId: parentCategoryId })

      const res = await request(app)
        .delete(`/api/inventory/catalogs/categories/${parentCategoryId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Empresa-Id', empresaId)
        .expect(400)

      expect(res.body.success).toBe(false)
      expect(res.body.message).toContain('subcategorías')
    })

    test('Debe eliminar una categoría hoja', async () => {
      const res = await request(app)
        .delete(`/api/inventory/catalogs/categories/${childCategoryId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Empresa-Id', empresaId)
        .expect(200)

      expect(res.body.success).toBe(true)
      childCategoryId = '' // ya eliminado
    })
  })
})
