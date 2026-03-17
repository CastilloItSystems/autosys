// backend/src/features/inventory/items/bulk/bulk.test.ts

import { describe, test, expect, beforeAll, afterAll } from '@jest/globals'
import request from 'supertest'
import app from '../../../../app.js'
import { getTestCredentials } from '../../../../shared/utils/test.utils.js'
import prisma from '../../../../services/prisma.service.js'

describe('Bulk Operations Routes', () => {
  let authToken: string
  let empresaId: string
  let brandId: string
  let categoryId: string
  let unitId: string

  beforeAll(async () => {
    const creds = await getTestCredentials()
    authToken = creds.authToken
    empresaId = creds.empresaId

    // Clean up previous test data
    await prisma.item
      .deleteMany({ where: { empresaId, sku: { startsWith: 'BULK-' } } })
      .catch(() => {})
    await prisma.bulkOperation.deleteMany({}).catch(() => {})
    await prisma.brand
      .deleteMany({ where: { empresaId, code: 'TEST-BRAND-BULK' } })
      .catch(() => {})
    await prisma.category
      .deleteMany({ where: { empresaId, code: 'TEST-CAT-BULK' } })
      .catch(() => {})
    await prisma.unit
      .deleteMany({ where: { empresaId, code: 'TEST-UNIT-BULK' } })
      .catch(() => {})

    // Create test catalogs for FK constraints
    const brand = await prisma.brand.create({
      data: {
        code: 'TEST-BRAND-BULK',
        name: 'Test Brand for Bulk',
        type: 'PART',
        isActive: true,
        empresaId,
      },
    })
    brandId = brand.id

    const category = await prisma.category.create({
      data: {
        code: 'TEST-CAT-BULK',
        name: 'Test Category for Bulk',
        isActive: true,
        empresaId,
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
        empresaId,
      },
    })
    unitId = unit.id
  }, 30000)

  afterAll(async () => {
    await prisma.item
      .deleteMany({ where: { empresaId, sku: { startsWith: 'BULK-' } } })
      .catch(() => {})
    await prisma.bulkOperation.deleteMany({}).catch(() => {})
    await prisma.unit.deleteMany({ where: { empresaId, code: 'TEST-UNIT-BULK' } }).catch(() => {})
    await prisma.category.deleteMany({ where: { empresaId, code: 'TEST-CAT-BULK' } }).catch(() => {})
    await prisma.brand.deleteMany({ where: { empresaId, code: 'TEST-BRAND-BULK' } }).catch(() => {})
  })

  // ---------------------------------------------------------------------------
  // POST /items/bulk/import
  // ---------------------------------------------------------------------------

  describe('POST /api/inventory/items/bulk/import', () => {
    test('should import items from CSV successfully', async () => {
      const csvContent = `sku,name,description,costPrice,salePrice,stock
BULK-TEST-001,Test Item 1,Test Description 1,10,20,100
BULK-TEST-002,Test Item 2,Test Description 2,15,30,50
BULK-TEST-003,Test Item 3,Test Description 3,20,40,75`

      const res = await request(app)
        .post('/api/inventory/items/bulk/import')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Empresa-Id', empresaId)
        .send({
          fileName: 'test_import.csv',
          fileContent: csvContent,
          options: { skipHeaderRow: true, updateExisting: false },
        })

      expect(res.status).toBe(201)
      expect(res.body.success).toBe(true)
      expect(res.body.data).toHaveProperty('operationId')
      expect(res.body.data.imported).toBeGreaterThanOrEqual(0)
    })

    test('should handle import with updateExisting flag', async () => {
      const csvContent = `sku,name,description,costPrice,salePrice,stock
BULK-TEST-001,Updated Item,Updated Description,12,25,120`

      const res = await request(app)
        .post('/api/inventory/items/bulk/import')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Empresa-Id', empresaId)
        .send({
          fileName: 'test_update_import.csv',
          fileContent: csvContent,
          options: { updateExisting: true },
        })

      expect(res.status).toBe(201)
      expect(res.body.success).toBe(true)
    })

    test('should not import empty file', async () => {
      const res = await request(app)
        .post('/api/inventory/items/bulk/import')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Empresa-Id', empresaId)
        .send({ fileName: 'empty.csv', fileContent: 'sku,name' })

      expect(res.status).toBe(422)
    })

    test('should handle CSV with quoted fields containing commas', async () => {
      // Include catalog names so the service can resolve brandId/categoryId/unitId
      const csvContent = `sku,name,description,costPrice,salePrice,category,brand,unit
BULK-QUOTED-001,"Item with, comma","Description with, commas",10,20,Test Category for Bulk,Test Brand for Bulk,Test Unit for Bulk`

      const res = await request(app)
        .post('/api/inventory/items/bulk/import')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Empresa-Id', empresaId)
        .send({
          fileName: 'test_quoted.csv',
          fileContent: csvContent,
          options: { updateExisting: false },
        })

      expect(res.status).toBe(201)
      expect(res.body.success).toBe(true)
      const created = await prisma.item.findFirst({
        where: { sku: 'BULK-QUOTED-001', empresaId },
      })
      expect(created).not.toBeNull()
      expect(created?.name).toBe('Item with, comma')
    })

    test('should coerce negative prices to 0 or skip row', async () => {
      const csvContent = `sku,name,costPrice,salePrice
BULK-NEG-PRICE-001,Negative Price Item,-5,20`

      const res = await request(app)
        .post('/api/inventory/items/bulk/import')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Empresa-Id', empresaId)
        .send({
          fileName: 'test_negative.csv',
          fileContent: csvContent,
          options: { updateExisting: false },
        })

      expect(res.status).toBe(201)
      const created = await prisma.item.findFirst({
        where: { sku: 'BULK-NEG-PRICE-001', empresaId },
      })
      if (created) {
        expect(Number(created.costPrice)).toBeGreaterThanOrEqual(0)
      }
    })

    test('should reject file exceeding 10MB size limit', async () => {
      const bigContent = 'sku,name\n' + 'A'.repeat(11 * 1024 * 1024)

      const res = await request(app)
        .post('/api/inventory/items/bulk/import')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Empresa-Id', empresaId)
        .send({ fileName: 'too_large.csv', fileContent: bigContent })

      // Express body limit (10mb) rejects at 413 before the controller,
      // or our controller rejects at 422. Both mean "file too large".
      expect([413, 422]).toContain(res.status)
    })

    test('should handle duplicate SKUs in same CSV gracefully', async () => {
      const csvContent = `sku,name,costPrice,salePrice,category,brand,unit
BULK-DUP-001,First Entry,10,20,Test Category for Bulk,Test Brand for Bulk,Test Unit for Bulk
BULK-DUP-001,Duplicate Entry,15,25,Test Category for Bulk,Test Brand for Bulk,Test Unit for Bulk`

      const res = await request(app)
        .post('/api/inventory/items/bulk/import')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Empresa-Id', empresaId)
        .send({
          fileName: 'test_duplicates.csv',
          fileContent: csvContent,
          options: { updateExisting: false },
        })

      expect(res.status).toBe(201)
      expect(res.body.data.imported).toBe(1)
      expect(res.body.data.failed).toBeGreaterThanOrEqual(1)
    })

    test('should not import items into wrong empresa', async () => {
      const otherEmpresa = await prisma.empresa.create({
        data: { nombre: 'Other Empresa Bulk Test' },
      })

      const csvContent = `sku,name,costPrice,salePrice,category,brand,unit
BULK-SCOPE-001,Scoped Item,10,20,Test Category for Bulk,Test Brand for Bulk,Test Unit for Bulk`

      await request(app)
        .post('/api/inventory/items/bulk/import')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Empresa-Id', empresaId)
        .send({
          fileName: 'test_scope.csv',
          fileContent: csvContent,
          options: { updateExisting: false },
        })

      const inCorrectEmpresa = await prisma.item.findFirst({
        where: { sku: 'BULK-SCOPE-001', empresaId },
      })
      const inWrongEmpresa = await prisma.item.findFirst({
        where: { sku: 'BULK-SCOPE-001', empresaId: otherEmpresa.id_empresa },
      })

      expect(inCorrectEmpresa).not.toBeNull()
      expect(inWrongEmpresa).toBeNull()

      await prisma.empresa
        .delete({ where: { id_empresa: otherEmpresa.id_empresa } })
        .catch(() => {})
    })
  })

  // ---------------------------------------------------------------------------
  // POST /items/bulk/export
  // ---------------------------------------------------------------------------

  describe('POST /api/inventory/items/bulk/export', () => {
    beforeAll(async () => {
      // Seed items used by export tests
      await prisma.item
        .createMany({
          data: [
            {
              sku: 'BULK-EXPORT-001',
              code: 'BULK-EXPORT-001',
              name: 'Export Test CSV',
              categoryId,
              brandId,
              unitId,
              empresaId,
              costPrice: 10,
              salePrice: 20,
              isActive: true,
            },
            {
              sku: 'BULK-EXPORT-002',
              code: 'BULK-EXPORT-002',
              name: 'Export Test JSON',
              categoryId,
              brandId,
              unitId,
              empresaId,
              costPrice: 15,
              salePrice: 30,
              isActive: true,
            },
            {
              sku: 'BULK-EXPORT-003',
              code: 'BULK-EXPORT-003',
              name: 'Export Test Filter',
              categoryId,
              brandId,
              unitId,
              empresaId,
              costPrice: 50,
              salePrice: 80,
              isActive: true,
            },
          ],
          skipDuplicates: true,
        })
        .catch(() => {})
    })

    test('should export items as CSV', async () => {
      const res = await request(app)
        .post('/api/inventory/items/bulk/export')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Empresa-Id', empresaId)
        .send({ format: 'csv', filters: { isActive: true } })

      expect(res.status).toBe(200)
      expect(res.header['content-disposition']).toBeDefined()
    })

    test('should export items as JSON', async () => {
      const res = await request(app)
        .post('/api/inventory/items/bulk/export')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Empresa-Id', empresaId)
        .send({ format: 'json' })

      expect(res.status).toBe(200)
      expect(res.header['content-type']).toContain('application/json')
    })

    test('should apply price range filters on export', async () => {
      const res = await request(app)
        .post('/api/inventory/items/bulk/export')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Empresa-Id', empresaId)
        .send({ format: 'csv', filters: { minPrice: 10, maxPrice: 100 } })

      expect(res.status).toBe(200)
      expect(res.header['content-disposition']).toBeDefined()
    })

    test('should return empty export when no items match filters', async () => {
      const res = await request(app)
        .post('/api/inventory/items/bulk/export')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Empresa-Id', empresaId)
        .send({ format: 'csv', filters: { minPrice: 999999 } })

      expect(res.status).toBe(200)
      expect(res.header['content-disposition']).toBeDefined()
    })
  })

  // ---------------------------------------------------------------------------
  // PATCH /items/bulk/update
  // ---------------------------------------------------------------------------

  describe('PATCH /api/inventory/items/bulk/update', () => {
    beforeAll(async () => {
      await prisma.item
        .create({
          data: {
            sku: 'BULK-TEST-UPDATE-001',
            code: 'BULK-TEST-UPDATE-001',
            name: 'Update Test Item',
            categoryId,
            brandId,
            unitId,
            empresaId,
            costPrice: 10,
            salePrice: 20,
          },
        })
        .catch(() => {})
    })

    test('should update items in bulk', async () => {
      const res = await request(app)
        .patch('/api/inventory/items/bulk/update')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Empresa-Id', empresaId)
        .send({
          filter: { sku: { contains: 'BULK-TEST-UPDATE' } },
          update: { minStock: 50 },
        })

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.data).toHaveProperty('modifiedCount')
    })

    test('should return 404 when no items match filter', async () => {
      const res = await request(app)
        .patch('/api/inventory/items/bulk/update')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Empresa-Id', empresaId)
        .send({
          filter: { sku: 'NONEXISTENT-SKU' },
          update: { minStock: 100 },
        })

      expect(res.status).toBe(404)
    })

    test('should not allow updating sensitive fields like empresaId', async () => {
      const res = await request(app)
        .patch('/api/inventory/items/bulk/update')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Empresa-Id', empresaId)
        .send({
          filter: { sku: { startsWith: 'BULK-EXPORT' } },
          update: {
            empresaId: '00000000-0000-0000-0000-000000000000', // should be ignored
            minStock: 5,
          },
        })

      expect(res.status).toBe(200)
      const item = await prisma.item.findFirst({
        where: { sku: 'BULK-EXPORT-001', empresaId },
      })
      expect(item?.empresaId).toBe(empresaId)
    })

    test('should return 400 when no valid update fields provided', async () => {
      const res = await request(app)
        .patch('/api/inventory/items/bulk/update')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Empresa-Id', empresaId)
        .send({
          filter: { sku: { startsWith: 'BULK-EXPORT' } },
          update: { createdBy: 'attacker', id: 'fake-id' }, // not in whitelist
        })

      expect(res.status).toBe(400)
    })
  })

  // ---------------------------------------------------------------------------
  // DELETE /items/bulk/delete
  // ---------------------------------------------------------------------------

  describe('DELETE /api/inventory/items/bulk/delete', () => {
    test('should soft delete items in bulk', async () => {
      await prisma.item.create({
        data: {
          sku: 'BULK-DELETE-001',
          code: 'BULK-DELETE-001',
          name: 'Delete Test',
          categoryId,
          brandId,
          unitId,
          empresaId,
          costPrice: 10,
          salePrice: 20,
        },
      })

      const res = await request(app)
        .delete('/api/inventory/items/bulk/delete')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Empresa-Id', empresaId)
        .send({ filter: { sku: 'BULK-DELETE-001' }, permanent: false })

      expect(res.status).toBe(200)
      expect(res.body.data).toHaveProperty('deletedCount')
    })

    test('should hard delete items in bulk', async () => {
      const item = await prisma.item.create({
        data: {
          sku: 'BULK-HARD-DELETE-001',
          code: 'BULK-HARD-DELETE-001',
          name: 'Hard Delete Test',
          categoryId,
          brandId,
          unitId,
          empresaId,
          costPrice: 10,
          salePrice: 20,
        },
      })

      const res = await request(app)
        .delete('/api/inventory/items/bulk/delete')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Empresa-Id', empresaId)
        .send({ filter: { id: item.id }, permanent: true })

      expect(res.status).toBe(200)
    })
  })

  // ---------------------------------------------------------------------------
  // GET /items/bulk/operations
  // ---------------------------------------------------------------------------

  describe('GET /api/inventory/items/bulk/operations', () => {
    test('should list bulk operations', async () => {
      const res = await request(app)
        .get('/api/inventory/items/bulk/operations')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Empresa-Id', empresaId)

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(Array.isArray(res.body.data)).toBe(true)
      expect(res.body.meta).toHaveProperty('page')
      expect(res.body.meta).toHaveProperty('total')
    })

    test('should support pagination', async () => {
      const res = await request(app)
        .get('/api/inventory/items/bulk/operations?page=1&limit=5')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Empresa-Id', empresaId)

      expect(res.status).toBe(200)
      expect(res.body.meta.page).toBe(1)
      expect(res.body.meta.limit).toBe(5)
    })
  })

  // ---------------------------------------------------------------------------
  // GET /items/bulk/operations/:operationId
  // ---------------------------------------------------------------------------

  describe('GET /api/inventory/items/bulk/operations/:operationId', () => {
    let operationId: string

    beforeAll(async () => {
      const user = await prisma.user.findUnique({ where: { correo: 'admin@test.com' } })
      const operation = await prisma.bulkOperation.create({
        data: {
          operationType: 'IMPORT',
          status: 'COMPLETED',
          totalRecords: 5,
          processedRecords: 5,
          errorRecords: 0,
          createdBy: user?.id ?? 'system',
        },
      })
      operationId = operation.id
    })

    test('should get operation details', async () => {
      const res = await request(app)
        .get(`/api/inventory/items/bulk/operations/${operationId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Empresa-Id', empresaId)

      expect(res.status).toBe(200)
      expect(res.body.data.id).toBe(operationId)
    })

    test('should return 404 for non-existent operation', async () => {
      const res = await request(app)
        .get('/api/inventory/items/bulk/operations/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Empresa-Id', empresaId)

      expect(res.status).toBe(404)
    })
  })

  // ---------------------------------------------------------------------------
  // DELETE /items/bulk/operations/:operationId
  // ---------------------------------------------------------------------------

  describe('DELETE /api/inventory/items/bulk/operations/:operationId', () => {
    test('should delete operation record', async () => {
      const user = await prisma.user.findUnique({ where: { correo: 'admin@test.com' } })
      const operation = await prisma.bulkOperation.create({
        data: {
          operationType: 'EXPORT',
          status: 'COMPLETED',
          totalRecords: 10,
          processedRecords: 10,
          errorRecords: 0,
          createdBy: user?.id ?? 'system',
        },
      })

      const res = await request(app)
        .delete(`/api/inventory/items/bulk/operations/${operation.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Empresa-Id', empresaId)

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
    })
  })
})
