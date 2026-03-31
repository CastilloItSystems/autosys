// backend/src/features/workshop/serviceOrderAdditionals/serviceOrderAdditionals.test.ts

import { describe, test, expect, beforeAll, afterAll } from '@jest/globals'
import request from 'supertest'
import app from '../../../app.js'
import { getTestCredentials } from '../../../shared/utils/test.utils.js'
import prisma from '../../../services/prisma.service.js'

describe('Service Order Additionals API Tests', () => {
  let authToken: string
  let empresaId: string
  let serviceOrderId: string

  beforeAll(async () => {
    const creds = await getTestCredentials()
    authToken = creds.authToken
    empresaId = creds.empresaId

    // Create a test service order
    const reception = await prisma.vehicleReception.create({
      data: {
        empresaId,
        licensePlate: 'TEST-ADD-001',
        vin: 'TEST-VIN-ADD-001',
        createdBy: 'test-user',
      },
    })

    const serviceOrder = await prisma.serviceOrder.create({
      data: {
        empresaId,
        vehicleReceptionId: reception.id,
        number: 'TEST-SO-ADD-001',
        status: 'PENDING',
        createdBy: 'test-user',
      },
    })

    serviceOrderId = serviceOrder.id
  })

  afterAll(async () => {
    await prisma.$disconnect()
  })

  describe('GET /workshop/additionals', () => {
    test('should return all additionals for a service order', async () => {
      const response = await request(app)
        .get(`/workshop/additionals?serviceOrderId=${serviceOrderId}`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('data')
      expect(Array.isArray(response.body.data)).toBe(true)
    })

    test('should filter by status', async () => {
      const response = await request(app)
        .get(
          `/workshop/additionals?serviceOrderId=${serviceOrderId}&status=proposed`
        )
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(200)
      expect(Array.isArray(response.body.data)).toBe(true)
    })
  })

  describe('GET /workshop/additionals/:id', () => {
    test('should return specific additional', async () => {
      const additional = await prisma.serviceOrderAdditional.create({
        data: {
          serviceOrderId,
          description: 'Additional diagnostics',
          estimatedPrice: 500,
          status: 'proposed',
        },
      })

      const response = await request(app)
        .get(`/workshop/additionals/${additional.id}`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(200)
      expect(response.body.id).toBe(additional.id)
      expect(response.body.description).toBe('Additional diagnostics')
    })
  })

  describe('POST /workshop/additionals', () => {
    test('should create new additional work', async () => {
      const payload = {
        description: 'Paint job',
        estimatedPrice: 1000,
        serviceOrderId,
      }

      const response = await request(app)
        .post('/workshop/additionals')
        .set('Authorization', `Bearer ${authToken}`)
        .send(payload)

      expect(response.status).toBe(201)
      expect(response.body.description).toBe('Paint job')
      expect(response.body.status).toBe('proposed')
      expect(response.body.estimatedPrice).toBe(1000)
    })

    test('should reject missing required fields', async () => {
      const payload = {
        description: 'Incomplete',
      }

      const response = await request(app)
        .post('/workshop/additionals')
        .set('Authorization', `Bearer ${authToken}`)
        .send(payload)

      expect(response.status).toBe(400)
    })
  })

  describe('PUT /workshop/additionals/:id', () => {
    test('should update additional', async () => {
      const additional = await prisma.serviceOrderAdditional.create({
        data: {
          serviceOrderId,
          description: 'Original description',
          estimatedPrice: 500,
        },
      })

      const payload = {
        description: 'Updated description',
        estimatedPrice: 750,
      }

      const response = await request(app)
        .put(`/workshop/additionals/${additional.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(payload)

      expect(response.status).toBe(200)
      expect(response.body.description).toBe('Updated description')
      expect(response.body.estimatedPrice).toBe(750)
    })
  })

  describe('DELETE /workshop/additionals/:id', () => {
    test('should delete additional', async () => {
      const additional = await prisma.serviceOrderAdditional.create({
        data: {
          serviceOrderId,
          description: 'To delete',
          estimatedPrice: 200,
        },
      })

      const response = await request(app)
        .delete(`/workshop/additionals/${additional.id}`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(204)
    })
  })

  describe('PATCH /workshop/additionals/:id/status', () => {
    test('should update additional status', async () => {
      const additional = await prisma.serviceOrderAdditional.create({
        data: {
          serviceOrderId,
          description: 'For status test',
          estimatedPrice: 300,
          status: 'proposed',
        },
      })

      const payload = { status: 'quoted' }

      const response = await request(app)
        .patch(`/workshop/additionals/${additional.id}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(payload)

      expect(response.status).toBe(200)
      expect(response.body.status).toBe('quoted')
    })

    test('should validate status transitions', async () => {
      const additional = await prisma.serviceOrderAdditional.create({
        data: {
          serviceOrderId,
          description: 'For transition test',
          estimatedPrice: 400,
          status: 'proposed',
        },
      })

      const payload = { status: 'executed' }

      const response = await request(app)
        .patch(`/workshop/additionals/${additional.id}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(payload)

      expect(response.status).toBe(400)
    })
  })
})
