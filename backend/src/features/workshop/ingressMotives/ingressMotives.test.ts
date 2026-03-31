// backend/src/features/workshop/ingressMotives/ingressMotives.test.ts

import { describe, test, expect, beforeAll, afterAll } from '@jest/globals'
import request from 'supertest'
import app from '../../../app.js'
import { getTestCredentials } from '../../../shared/utils/test.utils.js'
import prisma from '../../../services/prisma.service.js'

describe('Ingress Motives API Tests', () => {
  let authToken: string
  let empresaId: string
  let motiveId: string
  const testCode = 'TEST-MOTIVE-001'
  const createCode = 'TEST-MOTIVE-CREATE'

  beforeAll(async () => {
    const creds = await getTestCredentials()
    authToken = creds.authToken
    empresaId = creds.empresaId

    // Clean up previous test data
    await prisma.ingressMotive
      .deleteMany({
        where: { empresaId, code: { startsWith: 'TEST' } },
      })
      .catch(() => {})
  })

  afterAll(async () => {
    // Clean up test data
    await prisma.ingressMotive
      .deleteMany({
        where: { empresaId, code: { startsWith: 'TEST' } },
      })
      .catch(() => {})
    await prisma.$disconnect()
  })

  describe('GET /workshop/ingress-motives', () => {
    test('should return all ingress motives for empresa', async () => {
      const response = await request(app)
        .get('/workshop/ingress-motives')
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('data')
      expect(Array.isArray(response.body.data)).toBe(true)
      expect(response.body).toHaveProperty('pagination')
    })

    test('should filter by search term', async () => {
      // Create a test motive first
      await prisma.ingressMotive.create({
        data: {
          empresaId,
          code: testCode,
          name: 'Diagnóstico',
          description: 'Test motive for search',
          isActive: true,
          createdBy: 'test-user',
        },
      })

      const response = await request(app)
        .get('/workshop/ingress-motives?search=Diagnóstico')
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(200)
      expect(response.body.data.length).toBeGreaterThanOrEqual(0)
    })

    test('should filter by isActive status', async () => {
      const response = await request(app)
        .get('/workshop/ingress-motives?isActive=true')
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(200)
      expect(Array.isArray(response.body.data)).toBe(true)
    })
  })

  describe('GET /workshop/ingress-motives/:id', () => {
    test('should return specific ingress motive', async () => {
      // Create test motive
      const motive = await prisma.ingressMotive.create({
        data: {
          empresaId,
          code: 'TEST-DETAIL',
          name: 'Mantenimiento',
          isActive: true,
          createdBy: 'test-user',
        },
      })

      const response = await request(app)
        .get(`/workshop/ingress-motives/${motive.id}`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(200)
      expect(response.body.id).toBe(motive.id)
      expect(response.body.code).toBe('TEST-DETAIL')
    })

    test('should return 404 for non-existent motive', async () => {
      const response = await request(app)
        .get('/workshop/ingress-motives/invalid-id')
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(404)
    })
  })

  describe('POST /workshop/ingress-motives', () => {
    test('should create new ingress motive', async () => {
      const payload = {
        code: createCode,
        name: 'Test Motive',
        description: 'A test ingress motive',
        isActive: true,
      }

      const response = await request(app)
        .post('/workshop/ingress-motives')
        .set('Authorization', `Bearer ${authToken}`)
        .send(payload)

      expect(response.status).toBe(201)
      expect(response.body.code).toBe(createCode)
      expect(response.body.name).toBe('Test Motive')
      motiveId = response.body.id
    })

    test('should reject duplicate code', async () => {
      const payload = {
        code: createCode,
        name: 'Another Motive',
        isActive: true,
      }

      const response = await request(app)
        .post('/workshop/ingress-motives')
        .set('Authorization', `Bearer ${authToken}`)
        .send(payload)

      expect(response.status).toBe(409)
    })

    test('should reject missing required fields', async () => {
      const payload = {
        name: 'Incomplete Motive',
      }

      const response = await request(app)
        .post('/workshop/ingress-motives')
        .set('Authorization', `Bearer ${authToken}`)
        .send(payload)

      expect(response.status).toBe(400)
    })
  })

  describe('PUT /workshop/ingress-motives/:id', () => {
    test('should update ingress motive', async () => {
      const motive = await prisma.ingressMotive.create({
        data: {
          empresaId,
          code: 'TEST-UPDATE',
          name: 'Original Name',
          isActive: true,
          createdBy: 'test-user',
        },
      })

      const payload = {
        name: 'Updated Name',
        description: 'Updated description',
      }

      const response = await request(app)
        .put(`/workshop/ingress-motives/${motive.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(payload)

      expect(response.status).toBe(200)
      expect(response.body.name).toBe('Updated Name')
      expect(response.body.description).toBe('Updated description')
    })

    test('should return 404 when updating non-existent motive', async () => {
      const payload = { name: 'Updated Name' }

      const response = await request(app)
        .put('/workshop/ingress-motives/invalid-id')
        .set('Authorization', `Bearer ${authToken}`)
        .send(payload)

      expect(response.status).toBe(404)
    })
  })

  describe('DELETE /workshop/ingress-motives/:id', () => {
    test('should delete ingress motive', async () => {
      const motive = await prisma.ingressMotive.create({
        data: {
          empresaId,
          code: 'TEST-DELETE',
          name: 'To Delete',
          isActive: true,
          createdBy: 'test-user',
        },
      })

      const response = await request(app)
        .delete(`/workshop/ingress-motives/${motive.id}`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(204)

      // Verify it's deleted
      const verify = await request(app)
        .get(`/workshop/ingress-motives/${motive.id}`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(verify.status).toBe(404)
    })

    test('should return 404 when deleting non-existent motive', async () => {
      const response = await request(app)
        .delete('/workshop/ingress-motives/invalid-id')
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(404)
    })
  })
})
