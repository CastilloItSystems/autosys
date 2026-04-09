// backend/src/features/workshop/serviceOrderMaterials/serviceOrderMaterials.test.ts

import { describe, test, expect, beforeAll, afterAll } from '@jest/globals'
import request from 'supertest'
import app from '../../../app.js'
import { getTestCredentials } from '../../../shared/utils/test.utils.js'
import prisma from '../../../services/prisma.service.js'

describe('Service Order Materials API Tests', () => {
  let authToken: string
  let empresaId: string
  let serviceOrderId: string
  let materialId: string

  beforeAll(async () => {
    const creds = await getTestCredentials()
    authToken = creds.authToken
    empresaId = creds.empresaId

    // Create a test service order
    const reception = await prisma.vehicleReception.create({
      data: {
        empresaId,
        licensePlate: 'TEST-001',
        vin: 'TEST-VIN-001',
        createdBy: 'test-user',
      },
    })

    const serviceOrder = await prisma.serviceOrder.create({
      data: {
        empresaId,
        vehicleReceptionId: reception.id,
        number: 'TEST-SO-001',
        status: 'PENDING',
        createdBy: 'test-user',
      },
    })

    serviceOrderId = serviceOrder.id
  })

  afterAll(async () => {
    await prisma.$disconnect()
  })

  describe('GET /workshop/materials', () => {
    test('should return all materials for a service order', async () => {
      const response = await request(app)
        .get(`/workshop/materials?serviceOrderId=${serviceOrderId}`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('data')
      expect(Array.isArray(response.body.data)).toBe(true)
    })

    test('should filter by status', async () => {
      const response = await request(app)
        .get(
          `/workshop/materials?serviceOrderId=${serviceOrderId}&status=requested`
        )
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(200)
      expect(Array.isArray(response.body.data)).toBe(true)
    })
  })

  describe('GET /workshop/materials/:id', () => {
    test('should return specific material', async () => {
      const material = await prisma.serviceOrderMaterial.create({
        data: {
          serviceOrderId,
          code: 'MAT-001',
          description: 'Test Material',
          quantity: 2,
          unitPrice: 100,
          totalPrice: 200,
          status: 'requested',
        },
      })

      const response = await request(app)
        .get(`/workshop/materials/${material.id}`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(200)
      expect(response.body.id).toBe(material.id)
      expect(response.body.code).toBe('MAT-001')
    })
  })

  describe('POST /workshop/materials', () => {
    test('should create new material', async () => {
      const payload = {
        code: 'MAT-CREATE-001',
        description: 'New Test Material',
        quantity: 5,
        unitPrice: 50,
        serviceOrderId,
      }

      const response = await request(app)
        .post('/workshop/materials')
        .set('Authorization', `Bearer ${authToken}`)
        .send(payload)

      expect(response.status).toBe(201)
      expect(response.body.code).toBe('MAT-CREATE-001')
      expect(response.body.status).toBe('requested')
      materialId = response.body.id
    })

    test('should calculate totalPrice from quantity and unitPrice', async () => {
      const payload = {
        code: 'MAT-CALC-001',
        description: 'Material for price calc',
        quantity: 3,
        unitPrice: 25,
        serviceOrderId,
      }

      const response = await request(app)
        .post('/workshop/materials')
        .set('Authorization', `Bearer ${authToken}`)
        .send(payload)

      expect(response.status).toBe(201)
      expect(response.body.totalPrice).toBe(75)
    })
  })

  describe('PUT /workshop/materials/:id', () => {
    test('should update material', async () => {
      const material = await prisma.serviceOrderMaterial.create({
        data: {
          serviceOrderId,
          code: 'MAT-UPDATE-001',
          description: 'Original Description',
          quantity: 2,
          unitPrice: 100,
          totalPrice: 200,
        },
      })

      const payload = {
        description: 'Updated Description',
        quantity: 3,
      }

      const response = await request(app)
        .put(`/workshop/materials/${material.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(payload)

      expect(response.status).toBe(200)
      expect(response.body.description).toBe('Updated Description')
      expect(response.body.totalPrice).toBe(300)
    })
  })

  describe('DELETE /workshop/materials/:id', () => {
    test('should delete material', async () => {
      const material = await prisma.serviceOrderMaterial.create({
        data: {
          serviceOrderId,
          code: 'MAT-DELETE-001',
          description: 'To Delete',
          quantity: 1,
          unitPrice: 50,
          totalPrice: 50,
        },
      })

      const response = await request(app)
        .delete(`/workshop/materials/${material.id}`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(204)
    })
  })

  describe('PATCH /workshop/materials/:id/status', () => {
    test('should update material status', async () => {
      const material = await prisma.serviceOrderMaterial.create({
        data: {
          serviceOrderId,
          code: 'MAT-STATUS-001',
          description: 'For status update',
          quantity: 1,
          unitPrice: 50,
          totalPrice: 50,
          status: 'requested',
        },
      })

      const payload = { status: 'reserved' }

      const response = await request(app)
        .patch(`/workshop/materials/${material.id}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(payload)

      expect(response.status).toBe(200)
      expect(response.body.status).toBe('reserved')
    })
  })
})
