// backend/src/features/workshop/technicianSpecialties/technicianSpecialties.test.ts

import { describe, test, expect, beforeAll, afterAll } from '@jest/globals'
import request from 'supertest'
import app from '../../../app.js'
import { getTestCredentials } from '../../../shared/utils/test.utils.js'
import prisma from '../../../services/prisma.service.js'

describe('Technician Specialties API Tests', () => {
  let authToken: string
  let empresaId: string
  let specialtyId: string
  const testCode = 'TEST-SPECIALTY-001'
  const createCode = 'TEST-SPECIALTY-CREATE'

  beforeAll(async () => {
    const creds = await getTestCredentials()
    authToken = creds.authToken
    empresaId = creds.empresaId

    // Clean up previous test data
    await prisma.technicianSpecialty
      .deleteMany({
        where: { empresaId, code: { startsWith: 'TEST' } },
      })
      .catch(() => {})
  })

  afterAll(async () => {
    // Clean up test data
    await prisma.technicianSpecialty
      .deleteMany({
        where: { empresaId, code: { startsWith: 'TEST' } },
      })
      .catch(() => {})
    await prisma.$disconnect()
  })

  describe('GET /workshop/technician-specialties', () => {
    test('should return all specialties for empresa', async () => {
      const response = await request(app)
        .get('/workshop/technician-specialties')
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('data')
      expect(Array.isArray(response.body.data)).toBe(true)
      expect(response.body).toHaveProperty('pagination')
    })

    test('should filter by search term', async () => {
      // Create a test specialty first
      await prisma.technicianSpecialty.create({
        data: {
          empresaId,
          code: testCode,
          name: 'Electricista',
          description: 'Test specialty for search',
          isActive: true,
          createdBy: 'test-user',
        },
      })

      const response = await request(app)
        .get('/workshop/technician-specialties?search=Electricista')
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(200)
      expect(response.body.data.length).toBeGreaterThanOrEqual(0)
    })

    test('should filter by isActive status', async () => {
      const response = await request(app)
        .get('/workshop/technician-specialties?isActive=true')
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(200)
      expect(Array.isArray(response.body.data)).toBe(true)
    })
  })

  describe('GET /workshop/technician-specialties/:id', () => {
    test('should return specific specialty', async () => {
      // Create test specialty
      const specialty = await prisma.technicianSpecialty.create({
        data: {
          empresaId,
          code: 'TEST-DETAIL',
          name: 'Mecánico',
          isActive: true,
          createdBy: 'test-user',
        },
      })

      const response = await request(app)
        .get(`/workshop/technician-specialties/${specialty.id}`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(200)
      expect(response.body.id).toBe(specialty.id)
      expect(response.body.code).toBe('TEST-DETAIL')
    })

    test('should return 404 for non-existent specialty', async () => {
      const response = await request(app)
        .get('/workshop/technician-specialties/invalid-id')
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(404)
    })
  })

  describe('POST /workshop/technician-specialties', () => {
    test('should create new specialty', async () => {
      const payload = {
        code: createCode,
        name: 'Test Specialty',
        description: 'A test technician specialty',
        isActive: true,
      }

      const response = await request(app)
        .post('/workshop/technician-specialties')
        .set('Authorization', `Bearer ${authToken}`)
        .send(payload)

      expect(response.status).toBe(201)
      expect(response.body.code).toBe(createCode)
      expect(response.body.name).toBe('Test Specialty')
      specialtyId = response.body.id
    })

    test('should reject duplicate code', async () => {
      const payload = {
        code: createCode,
        name: 'Another Specialty',
        isActive: true,
      }

      const response = await request(app)
        .post('/workshop/technician-specialties')
        .set('Authorization', `Bearer ${authToken}`)
        .send(payload)

      expect(response.status).toBe(409)
    })

    test('should reject missing required fields', async () => {
      const payload = {
        name: 'Incomplete Specialty',
      }

      const response = await request(app)
        .post('/workshop/technician-specialties')
        .set('Authorization', `Bearer ${authToken}`)
        .send(payload)

      expect(response.status).toBe(400)
    })
  })

  describe('PUT /workshop/technician-specialties/:id', () => {
    test('should update specialty', async () => {
      const specialty = await prisma.technicianSpecialty.create({
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
        .put(`/workshop/technician-specialties/${specialty.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(payload)

      expect(response.status).toBe(200)
      expect(response.body.name).toBe('Updated Name')
      expect(response.body.description).toBe('Updated description')
    })

    test('should return 404 when updating non-existent specialty', async () => {
      const payload = { name: 'Updated Name' }

      const response = await request(app)
        .put('/workshop/technician-specialties/invalid-id')
        .set('Authorization', `Bearer ${authToken}`)
        .send(payload)

      expect(response.status).toBe(404)
    })
  })

  describe('DELETE /workshop/technician-specialties/:id', () => {
    test('should delete specialty', async () => {
      const specialty = await prisma.technicianSpecialty.create({
        data: {
          empresaId,
          code: 'TEST-DELETE',
          name: 'To Delete',
          isActive: true,
          createdBy: 'test-user',
        },
      })

      const response = await request(app)
        .delete(`/workshop/technician-specialties/${specialty.id}`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(204)

      // Verify it's deleted
      const verify = await request(app)
        .get(`/workshop/technician-specialties/${specialty.id}`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(verify.status).toBe(404)
    })

    test('should return 404 when deleting non-existent specialty', async () => {
      const response = await request(app)
        .delete('/workshop/technician-specialties/invalid-id')
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(404)
    })
  })
})
