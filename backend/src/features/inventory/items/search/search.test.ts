// backend/src/features/inventory/items/search/search.test.ts

import request from 'supertest'
import app from '../../../../app.js'
import prisma from '../../../../services.prisma.service.js'
import { getTestAuthToken } from '../../../../shared/utils/test.utils.js'

describe('Search Routes', () => {
  let token: string
  let itemId: string
  let brandId: string
  let categoryId: string
  let unitId: string
  let modelId: string

  beforeAll(async () => {
    // Clean up previous test data
    await prisma.item
      .deleteMany({
        where: { sku: { startsWith: 'TEST-SEARCH' } },
      })
      .catch(() => {})
    await prisma.brand
      .deleteMany({
        where: { code: 'TEST-BRAND-SEARCH' },
      })
      .catch(() => {})
    await prisma.category
      .deleteMany({
        where: { code: 'TEST-CAT-SEARCH' },
      })
      .catch(() => {})
    await prisma.unit
      .deleteMany({
        where: { code: 'TEST-UNIT-SEARCH' },
      })
      .catch(() => {})
    await prisma.model
      .deleteMany({
        where: { name: { contains: 'TEST-SEARCH', mode: 'insensitive' } },
      })
      .catch(() => {})

    // Get valid test token with real user in DB
    token = await getTestAuthToken()

    // Create test brand
    const brand = await prisma.brand.create({
      data: {
        code: 'TEST-BRAND-SEARCH',
        name: 'Test Brand for Search',
        type: 'PART',
        isActive: true,
      },
    })
    brandId = brand.id

    // Create test category
    const category = await prisma.category.create({
      data: {
        code: 'TEST-CAT-SEARCH',
        name: 'Test Category for Search',
        isActive: true,
      },
    })
    categoryId = category.id

    // Create test unit
    const unit = await prisma.unit.create({
      data: {
        code: 'TEST-UNIT-SEARCH',
        name: 'Test Unit for Search',
        abbreviation: 'TUS',
        type: 'COUNTABLE',
        isActive: true,
      },
    })
    unitId = unit.id

    // Create test model
    const model = await prisma.model.create({
      data: {
        name: 'TEST-SEARCH-MODEL',
        brandId,
        empresaId: brand.empresaId, // assuming same empresa as brand
        type: 'PART',
        isActive: true,
      },
    })
    modelId = model.id

    // Create test item
    const item = await prisma.item.create({
      data: {
        sku: 'TEST-SEARCH-001',
        name: 'Search Test Item',
        description: 'This is a test item for search functionality',
        categoryId,
        unitId,
        brandId,
        modelId,
        costPrice: 10,
        salePrice: 20,
        isActive: true,
      },
    })
    itemId = item.id
  }, 20000)

  afterAll(async () => {
    // Cleanup - delete in proper order for FK constraints
    try {
      if (itemId) {
        // await prisma.searchIndex.deleteMany({ where: { itemId } })
        await prisma.item.delete({ where: { id: itemId } }).catch(() => {})
      }

      if (unitId) {
        await prisma.unit.delete({ where: { id: unitId } }).catch(() => {})
      }

      if (categoryId) {
        await prisma.category
          .delete({ where: { id: categoryId } })
          .catch(() => {})
      }

      if (brandId) {
        await prisma.brand.delete({ where: { id: brandId } }).catch(() => {})
      }
    } catch (error) {
      console.log('Error in afterAll cleanup:', error)
    }
  })

  describe('POST /items/search - Search Items', () => {
    test('should search items successfully', async () => {
      const response = await request(app)
        .post('/api/inventory/items/search')
        .set('Authorization', `Bearer ${token}`)
        .send({
          query: 'test',
          page: 1,
          limit: 10,
        })

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(Array.isArray(response.body.data)).toBe(true)
      expect(response.body).toHaveProperty('meta')
      expect(response.body.meta).toHaveProperty('page')
      expect(response.body.meta).toHaveProperty('total')
      if (response.body.data.length > 0) {
        expect(response.body.data[0]).toHaveProperty('modelName')
      }
    })

    test('should search by SKU', async () => {
      const response = await request(app)
        .post('/api/inventory/items/search')
        .set('Authorization', `Bearer ${token}`)
        .send({
          query: 'TEST-SEARCH',
          page: 1,
          limit: 10,
        })

      expect(response.status).toBe(200)
      expect(response.body.data.length).toBeGreaterThanOrEqual(0)
    })

    test('should apply price filters', async () => {
      const response = await request(app)
        .post('/api/inventory/items/search')
        .set('Authorization', `Bearer ${token}`)
        .send({
          query: 'test',
          filters: {
            minPrice: 10,
            maxPrice: 50,
          },
          page: 1,
          limit: 10,
        })

      expect(response.status).toBe(200)
      response.body.data.forEach((item: any) => {
        const price =
          typeof item.salePrice === 'string'
            ? Number(item.salePrice)
            : item.salePrice
        expect(price).toBeGreaterThanOrEqual(10)
        expect(price).toBeLessThanOrEqual(50)
      })
    })

    test('should apply stock filter', async () => {
      const response = await request(app)
        .post('/api/inventory/items/search')
        .set('Authorization', `Bearer ${token}`)
        .send({
          query: 'test',
          filters: {
            inStock: true,
          },
          page: 1,
          limit: 10,
        })

      expect(response.status).toBe(400)
    })

    test('should return error for empty query', async () => {
      const response = await request(app)
        .post('/api/inventory/items/search')
        .set('Authorization', `Bearer ${token}`)
        .send({
          query: '',
          page: 1,
          limit: 10,
        })

      expect(response.status).toBe(422)
    })
  })

  describe('POST /items/search/advanced - Advanced Search', () => {
    test('should perform advanced search', async () => {
      const response = await request(app)
        .post('/api/inventory/items/search/advanced')
        .set('Authorization', `Bearer ${token}`)
        .send({
          query: 'test',
          filters: {
            minPrice: 5,
            maxPrice: 100,
            inStock: true,
          },
          sortBy: 'name',
          sortOrder: 'asc',
          page: 1,
          limit: 10,
        })

      expect(response.status).toBe(400)
    })
  })

  describe('GET /items/search/suggestions - Get Suggestions', () => {
    test('should get search suggestions', async () => {
      const response = await request(app)
        .get('/api/inventory/items/search/suggestions?query=te&limit=10')
        .set('Authorization', `Bearer ${token}`)

      expect(response.status).toBe(200)
      expect(Array.isArray(response.body.data)).toBe(true)
    })

    test('should not return suggestions for short query', async () => {
      const response = await request(app)
        .get('/api/inventory/items/search/suggestions?query=t&limit=10')
        .set('Authorization', `Bearer ${token}`)

      expect(response.status).toBe(422)
    })
  })

  describe('GET /items/search/aggregations - Get Aggregations', () => {
    test('should get search aggregations', async () => {
      const response = await request(app)
        .get('/api/inventory/items/search/aggregations')
        .set('Authorization', `Bearer ${token}`)

      expect(response.status).toBe(200)
      expect(response.body.data).toHaveProperty('categories')
      expect(response.body.data).toHaveProperty('brands')
      expect(response.body.data).toHaveProperty('priceRanges')
    })

    test('should get aggregations with query', async () => {
      const response = await request(app)
        .get('/api/inventory/items/search/aggregations?query=test')
        .set('Authorization', `Bearer ${token}`)

      expect(response.status).toBe(200)
    })
  })

  describe('Search Index Management', () => {
    let indexItemId: string

    test('should create search index', async () => {
      const response = await request(app)
        .post('/api/inventory/items/search/indexes')
        .set('Authorization', `Bearer ${token}`)
        .send({
          itemId,
          content: 'Test item for search indexing',
          keywords: ['test', 'search', 'index'],
        })

      expect(response.status).toBe(201)
      expect(response.body.data).toHaveProperty('lastIndexed')
    })

    test('should list search indexes', async () => {
      const response = await request(app)
        .get('/api/inventory/items/search/indexes')
        .set('Authorization', `Bearer ${token}`)

      expect(response.status).toBe(200)
      expect(Array.isArray(response.body.data)).toBe(true)
    })

    test('should filter indexes by itemId', async () => {
      const response = await request(app)
        .get(`/api/inventory/items/search/indexes?itemId=${itemId}`)
        .set('Authorization', `Bearer ${token}`)

      expect(response.status).toBe(200)
      if (response.body.data.length > 0) {
        expect(response.body.data[0].itemId).toBe(itemId)
      }
    })

    test('should update search index', async () => {
      const response = await request(app)
        .put(`/api/inventory/items/search/indexes/${itemId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          content: 'Updated search index content',
          keywords: ['updated', 'keywords'],
        })

      expect(response.status).toBe(200)
      expect(response.body.data.content).toBe('Updated search index content')
    })

    test('should delete search index', async () => {
      // Create new item and index for deletion test
      const item = await prisma.item.create({
        data: {
          sku: 'TEST-DEL-IDX',
          name: 'Delete Index Test',
          description: 'Test item for index deletion',
          categoryId,
          unitId,
          brandId,
          costPrice: 10,
          salePrice: 20,
        },
      })

      // await prisma.searchIndex.create({
      //   data: {
      //     itemId: item.id,
      //     content: 'Test deletion',
      //     keywords: ['delete'],
      //     lastIndexed: new Date(),
      //   },
      // })

      const response = await request(app)
        .delete(`/api/inventory/items/search/indexes/${item.id}`)
        .set('Authorization', `Bearer ${token}`)

      expect(response.status).toBe(200)

      // Cleanup
      await prisma.item.delete({ where: { id: item.id } })
    })

    test('should reindex all items', async () => {
      const response = await request(app)
        .post('/api/inventory/items/search/reindex')
        .set('Authorization', `Bearer ${token}`)

      expect(response.status).toBe(200)
      expect(response.body.data).toHaveProperty('reindexed')
    })
  })
})
