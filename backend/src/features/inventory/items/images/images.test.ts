// backend/src/features/inventory/items/images/images.test.ts

import request from 'supertest'
import app from '../../../../index'
import prisma from '../../../../services/prisma.service'
import { getTestAuthToken } from '../../../../shared/utils/test.utils'

describe('Images Routes', () => {
  let token: string
  let itemId: string
  let imageId: string
  let brandId: string
  let categoryId: string
  let unitId: string

  beforeAll(async () => {
    // Clean up previous test data
    await prisma.item
      .deleteMany({
        where: { sku: { startsWith: 'TEST-IMG' } },
      })
      .catch(() => {})
    await prisma.brand
      .deleteMany({
        where: { code: 'TEST-BRAND-IMG' },
      })
      .catch(() => {})
    await prisma.category
      .deleteMany({
        where: { code: 'TEST-CAT-IMG' },
      })
      .catch(() => {})
    await prisma.unit
      .deleteMany({
        where: { code: 'TEST-UNIT-IMG' },
      })
      .catch(() => {})

    // Get valid test token with real user in DB
    token = await getTestAuthToken()

    // Create test brand
    const brand = await prisma.brand.create({
      data: {
        code: 'TEST-BRAND-IMG',
        name: 'Test Brand for Images',
        type: 'PART',
        isActive: true,
      },
    })
    brandId = brand.id

    // Create test category
    const category = await prisma.category.create({
      data: {
        code: 'TEST-CAT-IMG',
        name: 'Test Category for Images',
        isActive: true,
      },
    })
    categoryId = category.id

    // Create test unit
    const unit = await prisma.unit.create({
      data: {
        code: 'TEST-UNIT-IMG',
        name: 'Test Unit for Images',
        abbreviation: 'TUI',
        type: 'COUNTABLE',
        isActive: true,
      },
    })
    unitId = unit.id

    // Create test item
    const item = await prisma.item.create({
      data: {
        sku: 'TEST-IMG-001',
        name: 'Test Item for Images',
        description: 'Test item for image tests',
        brandId,
        categoryId,
        unitId,
        costPrice: 10,
        salePrice: 20,
      },
    })
    itemId = item.id
  }, 20000)

  afterAll(async () => {
    // Cleanup - delete in proper order for FK constraints
    try {
      if (itemId) {
        await prisma.itemImage.deleteMany({ where: { itemId } }).catch(() => {})
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

  describe('POST /items/images - Create Image', () => {
    test('should create a new image successfully', async () => {
      const response = await request(app)
        .post('/api/inventory/items/images')
        .set('Authorization', `Bearer ${token}`)
        .send({
          itemId,
          url: 'https://example.com/image1.jpg',
          fileName: 'image1.jpg',
          mimeType: 'image/jpeg',
          size: 102400,
          width: 800,
          height: 600,
          altText: 'Test image',
          caption: 'Test caption',
          isPrimary: true,
        })

      expect(response.status).toBe(201)
      expect(response.body.success).toBe(true)
      expect(response.body.data).toHaveProperty('id')
      expect(response.body.data.url).toBe('https://example.com/image1.jpg')
      expect(response.body.data.isPrimary).toBe(true)
      imageId = response.body.data.id
    })

    test('should not create image with invalid item ID', async () => {
      const response = await request(app)
        .post('/api/inventory/items/images')
        .set('Authorization', `Bearer ${token}`)
        .send({
          itemId: '00000000-0000-0000-0000-000000000000',
          url: 'https://example.com/image2.jpg',
          fileName: 'image2.jpg',
          mimeType: 'image/jpeg',
          size: 102400,
          isPrimary: false,
        })

      expect(response.status).toBe(404)
      expect(response.body.success).toBe(false)
    })

    test('should not create image without authentication', async () => {
      const response = await request(app)
        .post('/api/inventory/items/images')
        .send({
          itemId,
          url: 'https://example.com/image3.jpg',
          fileName: 'image3.jpg',
          mimeType: 'image/jpeg',
          size: 102400,
          isPrimary: false,
        })

      expect(response.status).toBe(401)
    })

    test('should not create image with missing required fields', async () => {
      const response = await request(app)
        .post('/api/inventory/items/images')
        .set('Authorization', `Bearer ${token}`)
        .send({
          itemId,
          fileName: 'image4.jpg',
          mimeType: 'image/jpeg',
        })

      expect(response.status).toBe(422)
      expect(response.body.success).toBe(false)
    })
  })

  describe('GET /items/images - List Images', () => {
    test('should list all images', async () => {
      const response = await request(app)
        .get('/api/inventory/items/images')
        .set('Authorization', `Bearer ${token}`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(Array.isArray(response.body.data)).toBe(true)
      expect(response.body).toHaveProperty('meta')
      expect(response.body.meta).toHaveProperty('page')
      expect(response.body.meta).toHaveProperty('total')
    })

    test('should list images with pagination', async () => {
      const response = await request(app)
        .get('/api/inventory/items/images?page=1&limit=5')
        .set('Authorization', `Bearer ${token}`)

      expect(response.status).toBe(200)
      expect(response.body.meta.page).toBe(1)
      expect(response.body.meta.limit).toBe(5)
    })

    test('should filter images by itemId', async () => {
      const response = await request(app)
        .get(`/api/inventory/items/images?itemId=${itemId}`)
        .set('Authorization', `Bearer ${token}`)

      expect(response.status).toBe(200)
      expect(response.body.data.length).toBeGreaterThan(0)
      if (response.body.data.length > 0) {
        expect(response.body.data[0].itemId).toBe(itemId)
      }
    })

    test('should filter images by isPrimary', async () => {
      const response = await request(app)
        .get('/api/inventory/items/images?isPrimary=true')
        .set('Authorization', `Bearer ${token}`)

      expect(response.status).toBe(200)
      const allPrimary = response.body.data.every(
        (img: any) => img.isPrimary === true
      )
      expect(allPrimary).toBe(true)
    })
  })

  describe('GET /items/images/{id} - Get Image by ID', () => {
    test('should get image by ID', async () => {
      const response = await request(app)
        .get(`/api/inventory/items/images/${imageId}`)
        .set('Authorization', `Bearer ${token}`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data.id).toBe(imageId)
    })

    test('should not get image with invalid ID', async () => {
      const response = await request(app)
        .get('/api/inventory/items/images/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${token}`)

      expect(response.status).toBe(404)
      expect(response.body.success).toBe(false)
    })
  })

  describe('GET /items/images/item/{itemId} - Get Images by Item', () => {
    test('should get all images for an item', async () => {
      const response = await request(app)
        .get(`/api/inventory/items/images/item/${itemId}`)
        .set('Authorization', `Bearer ${token}`)

      expect(response.status).toBe(200)
      expect(Array.isArray(response.body.data)).toBe(true)
      response.body.data.forEach((img: any) => {
        expect(img.itemId).toBe(itemId)
      })
    })

    test('should not get images for non-existent item', async () => {
      const response = await request(app)
        .get(
          '/api/inventory/items/images/item/00000000-0000-0000-0000-000000000000'
        )
        .set('Authorization', `Bearer ${token}`)

      expect(response.status).toBe(404)
    })
  })

  describe('PUT /items/images/{id} - Update Image', () => {
    test('should update image successfully', async () => {
      const response = await request(app)
        .put(`/api/inventory/items/images/${imageId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          isPrimary: true,
        })

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data.isPrimary).toBe(true)
    })

    test('should not update non-existent image', async () => {
      const response = await request(app)
        .put('/api/inventory/items/images/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${token}`)
        .send({
          altText: 'Updated alt text',
        })

      expect(response.status).toBe(404)
    })

    test('should set image as primary', async () => {
      const response = await request(app)
        .put(`/api/inventory/items/images/${imageId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          isPrimary: true,
        })

      expect(response.status).toBe(200)
      expect(response.body.data.isPrimary).toBe(true)
    })
  })

  describe('PATCH /items/images/{id}/primary - Set as Primary', () => {
    test('should set image as primary', async () => {
      // Create another image first
      const imageRes = await request(app)
        .post('/api/inventory/items/images')
        .set('Authorization', `Bearer ${token}`)
        .send({
          itemId,
          url: 'https://example.com/image_secondary.jpg',
          fileName: 'image_secondary.jpg',
          mimeType: 'image/jpeg',
          size: 102400,
          isPrimary: false,
        })

      const secondaryImageId = imageRes.body.data.id

      const response = await request(app)
        .patch(`/api/inventory/items/images/${secondaryImageId}/primary`)
        .set('Authorization', `Bearer ${token}`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data.isPrimary).toBe(true)
    })

    test('should not set non-existent image as primary', async () => {
      const response = await request(app)
        .patch(
          '/api/inventory/items/images/00000000-0000-0000-0000-000000000000/primary'
        )
        .set('Authorization', `Bearer ${token}`)

      expect(response.status).toBe(404)
    })
  })

  describe('DELETE /items/images/{id} - Delete Image', () => {
    test('should delete image successfully', async () => {
      // Create image to delete
      const createRes = await request(app)
        .post('/api/inventory/items/images')
        .set('Authorization', `Bearer ${token}`)
        .send({
          itemId,
          url: 'https://example.com/image_to_delete.jpg',
          fileName: 'image_to_delete.jpg',
          mimeType: 'image/jpeg',
          size: 102400,
          isPrimary: false,
        })

      const imageIdToDelete = createRes.body.data.id

      const response = await request(app)
        .delete(`/api/inventory/items/images/${imageIdToDelete}`)
        .set('Authorization', `Bearer ${token}`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)

      // Verify image is deleted
      const verifyRes = await request(app)
        .get(`/api/inventory/items/images/${imageIdToDelete}`)
        .set('Authorization', `Bearer ${token}`)

      expect(verifyRes.status).toBe(404)
    })

    test('should not delete non-existent image', async () => {
      const response = await request(app)
        .delete(
          '/api/inventory/items/images/00000000-0000-0000-0000-000000000000'
        )
        .set('Authorization', `Bearer ${token}`)

      expect(response.status).toBe(404)
    })
  })
})
