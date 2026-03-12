// backend/src/features/inventory/items/bulk/bulk.test.ts

import request from 'supertest'
import app from '../../../../app.js'
import prisma from '../../../../services.prisma.service.js'
import { getTestAuthToken } from '../../../../shared/utils/test.utils.js'

describe('Bulk Operations Routes', () => {
  let token: string
  let userId: string
  let brandId: string
  let categoryId: string
  let unitId: string
  let empresaId: string

  beforeAll(async () => {
    // Clean up previous test data
    await prisma.item
      .deleteMany({
        where: {
          sku: { startsWith: 'BULK-' },
        },
      })
      .catch(() => {})
    await prisma.bulkOperation.deleteMany({}).catch(() => {})
    await prisma.brand
      .deleteMany({ where: { code: 'TEST-BRAND-BULK' } })
      .catch(() => {})
    await prisma.category
      .deleteMany({ where: { code: 'TEST-CAT-BULK' } })
      .catch(() => {})
    await prisma.unit
      .deleteMany({ where: { code: 'TEST-UNIT-BULK' } })
      .catch(() => {})

    // Get valid test token with real user in DB
    token = await getTestAuthToken()

    // Get the test user ID for use in tests
    const user = await prisma.user.findUnique({
      where: { correo: 'admin@test.com' },
    })
    userId = user?.id || '550e8400-e29b-41d4-a716-446655440000'

    // Ensure there is an Empresa and the test user has access to it
    let empresa = await prisma.empresa.findFirst({
      where: { nombre: 'Test Empresa Bulk' },
    })
    if (!empresa) {
      empresa = await prisma.empresa.create({
        data: { nombre: 'Test Empresa Bulk' },
      })
    }
    empresaId = empresa.id_empresa

    // Connect empresa to user if not already connected
    const userWithEmpresas = await prisma.user.findUnique({
      where: { id: userId },
      include: { empresas: true },
    })
    const hasEmpresa = userWithEmpresas?.empresas?.some(
      (e: any) => e.id_empresa === empresaId
    )
    if (!hasEmpresa) {
      await prisma.user.update({
        where: { id: userId },
        data: { empresas: { connect: { id_empresa: empresaId } } },
      })
    }

    // Create test catalogs for FK constraints
    const brand = await prisma.brand.create({
      data: {
        code: 'TEST-BRAND-BULK',
        name: 'Test Brand for Bulk',
        type: 'PART',
        isActive: true,
        empresaId: empresaId,
      },
    })
    brandId = brand.id

    const category = await prisma.category.create({
      data: {
        code: 'TEST-CAT-BULK',
        name: 'Test Category for Bulk',
        isActive: true,
        empresaId: empresaId,
      },
    })
    categoryId = category.id

    const unit = await prisma.unit.create({
      data: {
        code: 'TEST-UNIT-BULK',
        name: 'Test Unit for Bulk',
        abbreviation: 'TUB',
        type: 'COUNTABLE',
        isActive: true,
        empresaId: empresaId,
      },
    })
    unitId = unit.id
  }, 20000)

  afterAll(async () => {
    // Cleanup
    try {
      await prisma.item
        .deleteMany({
          where: {
            sku: { startsWith: 'BULK-' },
          },
        })
        .catch(() => {})
      await prisma.bulkOperation.deleteMany({}).catch(() => {})
      if (unitId)
        await prisma.unit.delete({ where: { id: unitId } }).catch(() => {})
      if (categoryId)
        await prisma.category
          .delete({ where: { id: categoryId } })
          .catch(() => {})
      if (brandId)
        await prisma.brand.delete({ where: { id: brandId } }).catch(() => {})
    } catch (error) {
      console.log('Error in afterAll cleanup:', error)
    }
  })

  describe('POST /items/bulk/import - Import Items', () => {
    test('should import items from CSV successfully', async () => {
      const csvContent = `sku,name,description,costPrice,salePrice,stock
BULK-TEST-001,Test Item 1,Test Description 1,10,20,100
BULK-TEST-002,Test Item 2,Test Description 2,15,30,50
BULK-TEST-003,Test Item 3,Test Description 3,20,40,75`

      const response = await request(app)
        .post('/api/inventory/items/bulk/import')
        .set('Authorization', `Bearer ${token}`)
        .set('X-Empresa-Id', empresaId)
        .send({
          fileName: 'test_import.csv',
          fileContent: csvContent,
          options: {
            skipHeaderRow: true,
            updateExisting: false,
          },
        })

      expect(response.status).toBe(201)
      expect(response.body.success).toBe(true)
      expect(response.body.data).toHaveProperty('operationId')
      expect(response.body.data.imported).toBeGreaterThanOrEqual(0)
    })

    test('should handle import with updateExisting flag', async () => {
      const csvContent = `sku,name,description,costPrice,salePrice,stock
BULK-TEST-001,Updated Item,Updated Description,12,25,120`

      const response = await request(app)
        .post('/api/inventory/items/bulk/import')
        .set('Authorization', `Bearer ${token}`)
        .set('X-Empresa-Id', empresaId)
        .send({
          fileName: 'test_update_import.csv',
          fileContent: csvContent,
          options: {
            updateExisting: true,
          },
        })

      expect(response.status).toBe(201)
      expect(response.body.success).toBe(true)
    })

    test('should not import empty file', async () => {
      const response = await request(app)
        .post('/api/inventory/items/bulk/import')
        .set('Authorization', `Bearer ${token}`)
        .set('X-Empresa-Id', empresaId)
        .send({
          fileName: 'empty.csv',
          fileContent: 'sku,name',
        })

      expect(response.status).toBe(422)
    })
  })

  describe('POST /items/bulk/export - Export Items', () => {
    test('should export items as CSV', async () => {
      // Create test item for export
      await prisma.item
        .create({
          data: {
            sku: 'BULK-EXPORT-001',
            name: 'Export Test CSV',
            categoryId,
            brandId,
            unitId,
            empresaId: empresaId,
            costPrice: 10,
            salePrice: 20,
            isActive: true,
          },
        })
        .catch(() => {})

      const response = await request(app)
        .post('/api/inventory/items/bulk/export')
        .set('Authorization', `Bearer ${token}`)
        .set('X-Empresa-Id', empresaId)
        .send({
          format: 'csv',
          filters: {
            isActive: true,
          },
        })

      expect(response.status).toBe(200)
      expect(response.header['content-disposition']).toBeDefined()
    })

    test('should export items as JSON', async () => {
      // Ensure test item exists
      await prisma.item
        .create({
          data: {
            sku: 'BULK-EXPORT-002',
            name: 'Export Test JSON',
            categoryId,
            brandId,
            unitId,
            empresaId: empresaId,
            costPrice: 15,
            salePrice: 30,
            isActive: true,
          },
        })
        .catch(() => {})

      const response = await request(app)
        .post('/api/inventory/items/bulk/export')
        .set('Authorization', `Bearer ${token}`)
        .set('X-Empresa-Id', empresaId)
        .send({
          format: 'json',
        })

      expect(response.status).toBe(200)
      expect(response.header['content-type']).toContain('application/json')
    })

    test('should apply price range filters on export', async () => {
      // Ensure test item exists
      await prisma.item
        .create({
          data: {
            sku: 'BULK-EXPORT-003',
            name: 'Export Test Filter',
            categoryId,
            brandId,
            unitId,
            empresaId: empresaId,
            costPrice: 50,
            salePrice: 80,
            isActive: true,
          },
        })
        .catch(() => {})

      const response = await request(app)
        .post('/api/inventory/items/bulk/export')
        .set('Authorization', `Bearer ${token}`)
        .set('X-Empresa-Id', empresaId)
        .send({
          format: 'csv',
          filters: {
            minPrice: 10,
            maxPrice: 100,
          },
        })

      expect(response.status).toBe(200)
      expect(response.header['content-disposition']).toBeDefined()
    })
  })

  describe('PATCH /items/bulk/update - Bulk Update', () => {
    test('should update items in bulk', async () => {
      // Create test item for update
      await prisma.item
        .create({
          data: {
            sku: 'BULK-TEST-UPDATE-001',
            name: 'Update Test Item',
            categoryId,
            brandId,
            unitId,
            empresaId: empresaId,
            costPrice: 10,
            salePrice: 20,
          },
        })
        .catch(() => {})

      const response = await request(app)
        .patch('/api/inventory/items/bulk/update')
        .set('Authorization', `Bearer ${token}`)
        .set('X-Empresa-Id', empresaId)
        .send({
          filter: {
            sku: { contains: 'BULK-TEST-UPDATE' },
          },
          update: {
            minStock: 50,
          },
        })

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data).toHaveProperty('modifiedCount')
    })

    test('should return error when no items match filter', async () => {
      const response = await request(app)
        .patch('/api/inventory/items/bulk/update')
        .set('Authorization', `Bearer ${token}`)
        .set('X-Empresa-Id', empresaId)
        .send({
          filter: {
            sku: 'NONEXISTENT-SKU',
          },
          update: {
            stock: 100,
          },
        })

      expect(response.status).toBe(404)
    })
  })

  describe('DELETE /items/bulk/delete - Bulk Delete', () => {
    test('should soft delete items in bulk', async () => {
      // Create items to delete
      await prisma.item.create({
        data: {
          sku: 'BULK-DELETE-001',
          name: 'Delete Test',
          categoryId,
          brandId,
          unitId,
          empresaId: empresaId,
          costPrice: 10,
          salePrice: 20,
        },
      })

      const response = await request(app)
        .delete('/api/inventory/items/bulk/delete')
        .set('Authorization', `Bearer ${token}`)
        .set('X-Empresa-Id', empresaId)
        .send({
          filter: {
            sku: 'BULK-DELETE-001',
          },
          permanent: false,
        })

      expect(response.status).toBe(200)
      expect(response.body.data).toHaveProperty('deletedCount')
    })

    test('should hard delete items in bulk', async () => {
      // Create items to delete
      const item = await prisma.item.create({
        data: {
          sku: 'BULK-HARD-DELETE-001',
          name: 'Hard Delete Test',
          categoryId,
          brandId,
          unitId,
          empresaId: empresaId,
          costPrice: 10,
          salePrice: 20,
        },
      })

      const response = await request(app)
        .delete('/api/inventory/items/bulk/delete')
        .set('Authorization', `Bearer ${token}`)
        .set('X-Empresa-Id', empresaId)
        .send({
          filter: {
            id: item.id,
          },
          permanent: true,
        })

      expect(response.status).toBe(200)
    })
  })

  describe('GET /items/bulk/operations - List Operations', () => {
    test('should list bulk operations', async () => {
      const response = await request(app)
        .get('/api/inventory/items/bulk/operations')
        .set('Authorization', `Bearer ${token}`)
        .set('X-Empresa-Id', empresaId)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(Array.isArray(response.body.data)).toBe(true)
      expect(response.body.meta).toHaveProperty('page')
      expect(response.body.meta).toHaveProperty('total')
    })

    test('should support pagination', async () => {
      const response = await request(app)
        .get('/api/inventory/items/bulk/operations?page=1&limit=5')
        .set('Authorization', `Bearer ${token}`)
        .set('X-Empresa-Id', empresaId)

      expect(response.status).toBe(200)
      expect(response.body.meta.page).toBe(1)
      expect(response.body.meta.limit).toBe(5)
    })
  })

  describe('GET /items/bulk/operations/{operationId} - Get Operation', () => {
    let operationId: string

    beforeAll(async () => {
      // Create an operation
      const operation = await prisma.bulkOperation.create({
        data: {
          operationType: 'IMPORT',
          status: 'COMPLETED',
          totalRecords: 5,
          processedRecords: 5,
          errorRecords: 0,
          createdBy: userId,
        },
      })
      operationId = operation.id
    })

    test('should get operation details', async () => {
      const response = await request(app)
        .get(`/api/inventory/items/bulk/operations/${operationId}`)
        .set('Authorization', `Bearer ${token}`)
        .set('X-Empresa-Id', empresaId)

      expect(response.status).toBe(200)
      expect(response.body.data.id).toBe(operationId)
    })

    test('should return 404 for non-existent operation', async () => {
      const response = await request(app)
        .get(
          '/api/inventory/items/bulk/operations/00000000-0000-0000-0000-000000000000'
        )
        .set('Authorization', `Bearer ${token}`)
        .set('X-Empresa-Id', empresaId)

      expect(response.status).toBe(404)
    })
  })

  describe('DELETE /items/bulk/operations/{operationId} - Delete Operation', () => {
    test('should delete operation record', async () => {
      const operation = await prisma.bulkOperation.create({
        data: {
          operationType: 'EXPORT',
          status: 'COMPLETED',
          totalRecords: 10,
          processedRecords: 10,
          errorRecords: 0,
          createdBy: userId,
        },
      })

      const response = await request(app)
        .delete(`/api/inventory/items/bulk/operations/${operation.id}`)
        .set('Authorization', `Bearer ${token}`)
        .set('X-Empresa-Id', empresaId)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
    })
  })
})
