// backend/src/features/inventory/items/bulk/bulk.service.ts

import {
  IBulkImportInput,
  IBulkExportInput,
  IBulkUpdateInput,
  IBulkDeleteInput,
  IBulkOperation,
  IBulkValidationError,
  IBulkImportResult,
  IBulkImportData,
} from './bulk.interface.js'
import {
  BadRequestError,
  NotFoundError,
} from '../../../../shared/utils/apiError.js'
import { v4 as uuid } from 'uuid'
import prisma from '../../../../services/prisma.service.js'
import { PaginationHelper } from '../../../../shared/utils/pagination.js'
import { INVENTORY_MESSAGES } from '../../shared/constants/messages.js'
import { logger } from '../../../../shared/utils/logger.js'
import ExcelJS from 'exceljs'

export class BulkService {
  async importItems(
    data: IBulkImportInput,
    userId: string,
    empresaId?: string
  ): Promise<IBulkImportResult> {
    const operationId = uuid()

    // Parse CSV
    const rows = this.parseCSV(data.fileContent)
    if (rows.length === 0) {
      throw new BadRequestError(INVENTORY_MESSAGES.bulk.emptyFile)
    }

    // Create bulk operation record
    await prisma.bulkOperation.create({
      data: {
        id: operationId,
        operationType: 'IMPORT',
        status: 'PROCESSING',
        fileName: data.fileName,
        totalRecords: rows.length,
        processedRecords: 0,
        errorRecords: 0,
        createdBy: userId,
        metadata: { empresaId },
      },
    })

    const errors: IBulkValidationError[] = []
    let imported = 0
    let updated = 0
    let failed = 0

    const normalize = (v: any) => {
      if (v === undefined || v === null) return undefined
      let s = String(v).trim()
      if (s.startsWith('"') && s.endsWith('"')) s = s.slice(1, -1)
      if (s === '') return undefined
      return s
    }

    const parseNumber = (v: any) => {
      if (v === undefined || v === null) return undefined
      const s = String(v)
        .replace(/[^0-9.,-]/g, '')
        .replace(/,/g, '.')
      const n = parseFloat(s)
      return Number.isNaN(n) ? undefined : n
    }

    const isUuid = (v?: string) => !!v && /^[0-9a-fA-F-]{36}$/.test(v)

    for (let i = 0; i < rows.length; i++) {
      try {
        const row = rows[i]

        // Normalize and sanitize fields coming from CSV (trim, remove surrounding quotes)
        row.sku = normalize(row.sku)
        row.name = normalize(row.name)
        row.description = normalize(row.description)
        row.barcode = normalize(row.barcode)
        row.category = normalize(row.category) // human-readable name
        row.brand = normalize(row.brand)
        row.unit = normalize(row.unit)

        // numeric fields
        row.costPrice = parseNumber(row.costPrice)
        row.salePrice = parseNumber(row.salePrice)
        row.wholesalePrice = parseNumber(row.wholesalePrice)
        row.minStock =
          row.minStock !== undefined
            ? parseInt(String(row.minStock).replace(/[^0-9-]/g, ''), 10)
            : undefined

        // Resolve relational IDs: categoryId, brandId, unitId
        if (!isUuid(row.categoryId) && row.category) {
          row.categoryId = await this.resolveCategoryIdByName(
            row.category,
            empresaId
          )
        }
        if (!isUuid(row.brandId) && row.brand) {
          row.brandId = await this.resolveBrandIdByName(row.brand, empresaId)
        }
        if (!isUuid(row.unitId) && row.unit) {
          row.unitId = await this.resolveUnitIdByName(row.unit, empresaId)
        }

        // Validate required fields
        if (!row.sku || !row.name) {
          errors.push({
            rowNumber: i + 1,
            field: 'sku/name',
            value: row,
            error: 'SKU and name are required',
          })
          failed++
          continue
        }

        // Check if item exists for this empresa
        const existingItem = await prisma.item.findFirst({
          where: {
            sku: row.sku,
            ...(empresaId ? { empresaId } : {}),
          },
        })

        if (existingItem && data.options?.updateExisting) {
          // Update existing
          await prisma.item.update({
            where: { id: existingItem.id },
            data: {
              name: row.name,
              description: row.description,
              categoryId: row.categoryId,
              brandId: row.brandId,
              unitId: row.unitId,
              costPrice: row.costPrice,
              salePrice: row.salePrice,
              wholesalePrice: row.wholesalePrice,
              minStock: row.minStock,
              barcode: row.barcode,
            },
          })
          updated++
        } else if (!existingItem) {
          // Create new
          await prisma.item.create({
            data: {
              sku: row.sku,
              name: row.name,
              description: row.description,
              categoryId: row.categoryId || undefined,
              brandId: row.brandId || undefined,
              unitId: row.unitId || undefined,
              costPrice: row.costPrice ?? 0,
              salePrice: row.salePrice ?? 0,
              wholesalePrice: row.wholesalePrice ?? undefined,
              minStock: row.minStock ?? 0,
              barcode: row.barcode,
              isActive: true,
              empresaId: empresaId || 'default',
            },
          })
          imported++
        } else {
          errors.push({
            rowNumber: i + 1,
            field: 'sku',
            value: row.sku,
            error: 'Item already exists and updateExisting is false',
          })
          failed++
        }
      } catch (error: any) {
        failed++
        errors.push({
          rowNumber: i + 1,
          field: 'general',
          value: rows[i],
          error: error.message,
        })
      }
    }

    // Update operation status
    await prisma.bulkOperation.update({
      where: { id: operationId },
      data: {
        status: failed === 0 ? 'COMPLETED' : 'COMPLETED',
        processedRecords: imported + updated + failed,
        errorRecords: failed,
        errorDetails: errors.length > 0 ? JSON.stringify(errors) : undefined,
        endDate: new Date(),
      },
    })

    return {
      operationId,
      imported,
      updated,
      failed,
      errors: errors.length > 0 ? errors : [],
    }
  }

  async exportItems(
    data: IBulkExportInput,
    userId: string,
    empresaId?: string
  ): Promise<any> {
    const operationId = uuid()
    const format = data.format || 'csv'

    // Build where clause from filters
    const where: any = {}
    if (data.filters?.categoryId) where.categoryId = data.filters.categoryId
    if (data.filters?.brandId) where.brandId = data.filters.brandId

    if (
      data.filters?.minPrice !== undefined ||
      data.filters?.maxPrice !== undefined
    ) {
      where.salePrice = {}
      if (data.filters?.minPrice !== undefined)
        where.salePrice.gte = data.filters.minPrice
      if (data.filters?.maxPrice !== undefined)
        where.salePrice.lte = data.filters.maxPrice
    }

    if (data.filters?.inStock) {
      where.stocks = {
        some: {
          quantityAvailable: { gt: 0 },
        },
      }
    }
    if (data.filters?.isActive !== undefined)
      where.isActive = data.filters.isActive

    const whereWithEmpresa = empresaId ? { ...where, empresaId } : where
    const items = await prisma.item.findMany({
      where: whereWithEmpresa,
      include: {
        category: true,
        brand: true,
        unit: true,
      },
    })

    if (items.length === 0) {
      throw new NotFoundError(INVENTORY_MESSAGES.bulk.noItemsExport)
    }

    // Map items to flatten relations and format values correctly
    const mappedItems = items.map((item: any) => {
      return {
        ...item,
        category: item.category?.name || '',
        brand: item.brand?.name || '',
        unit: item.unit?.name || '',
        status: item.isActive ? 'Activo' : 'Inactivo',
        costPrice: item.costPrice ? Number(item.costPrice) : 0,
        salePrice: item.salePrice ? Number(item.salePrice) : 0,
        wholesalePrice: item.wholesalePrice ? Number(item.wholesalePrice) : 0,
      }
    })

    let fileContent: any = ''
    let fileName = ''

    if (format === 'csv') {
      fileContent = this.toCSV(mappedItems, data.columns)
      fileName = `items_export_${new Date().getTime()}.csv`
    } else if (format === 'json') {
      fileContent = JSON.stringify(mappedItems, null, 2)
      fileName = `items_export_${new Date().getTime()}.json`
    } else if (format === 'xlsx') {
      const workbook = new ExcelJS.Workbook()
      const worksheet = workbook.addWorksheet('Artículos')

      const keys = data.columns || Object.keys(mappedItems[0] || {})
      worksheet.addRow(keys)

      mappedItems.forEach((item: any) => {
        worksheet.addRow(keys.map((key) => item[key] ?? ''))
      })

      fileContent = await workbook.xlsx.writeBuffer()
      fileName = `items_export_${new Date().getTime()}.xlsx`
    }

    // Create operation record
    await prisma.bulkOperation.create({
      data: {
        id: operationId,
        operationType: 'EXPORT',
        status: 'COMPLETED',
        fileName,
        totalRecords: items.length,
        processedRecords: items.length,
        errorRecords: 0,
        createdBy: userId,
        endDate: new Date(),
      },
    })

    logger.info('Bulk export completed', {
      operationId,
      format,
      recordCount: items.length,
      userId,
    })

    return {
      operationId,
      fileName,
      format,
      recordCount: items.length,
      content: fileContent,
    }
  }

  async bulkUpdate(
    data: IBulkUpdateInput,
    userId: string,
    empresaId?: string
  ): Promise<{ modifiedCount: number }> {
    const operationId = uuid()

    // Count matching items
    const filterWithEmpresa = empresaId
      ? { ...data.filter, empresaId }
      : data.filter
    const matchedItems = await prisma.item.findMany({
      where: filterWithEmpresa,
    })

    if (matchedItems.length === 0) {
      throw new NotFoundError(INVENTORY_MESSAGES.bulk.noItemsUpdate)
    }

    // Perform update
    const result = await prisma.item.updateMany({
      where: filterWithEmpresa,
      data: data.update,
    })

    // Record operation
    await prisma.bulkOperation.create({
      data: {
        id: operationId,
        operationType: 'UPDATE',
        status: 'COMPLETED',
        totalRecords: matchedItems.length,
        processedRecords: result.count,
        errorRecords: 0,
        createdBy: userId,
        endDate: new Date(),
      },
    })

    logger.info('Bulk update completed', {
      operationId,
      modifiedCount: result.count,
      userId,
    })

    return { modifiedCount: result.count }
  }

  async bulkDelete(
    data: IBulkDeleteInput,
    userId: string,
    empresaId?: string
  ): Promise<{ deletedCount: number }> {
    const operationId = uuid()

    const filterWithEmpresa = empresaId
      ? { ...data.filter, empresaId }
      : data.filter
    const matchedItems = await prisma.item.findMany({
      where: filterWithEmpresa,
    })

    if (matchedItems.length === 0) {
      throw new NotFoundError(INVENTORY_MESSAGES.bulk.noItemsDelete)
    }

    let result
    if (data.permanent) {
      // Hard delete
      result = await prisma.item.deleteMany({
        where: filterWithEmpresa,
      })
    } else {
      // Soft delete
      result = await prisma.item.updateMany({
        where: filterWithEmpresa,
        data: { isActive: false },
      })
    }

    // Record operation
    await prisma.bulkOperation.create({
      data: {
        id: operationId,
        operationType: 'DELETE',
        status: 'COMPLETED',
        totalRecords: matchedItems.length,
        processedRecords: result.count,
        errorRecords: 0,
        createdBy: userId,
        endDate: new Date(),
      },
    })

    logger.info('Bulk delete completed', {
      operationId,
      deletedCount: result.count,
      permanent: data.permanent,
      userId,
    })

    return { deletedCount: result.count }
  }

  async getOperations(page = 1, limit = 10) {
    const {
      skip,
      take,
      page: validPage,
      limit: validLimit,
    } = PaginationHelper.validateAndParse({ page, limit })

    const [operations, total] = await Promise.all([
      prisma.bulkOperation.findMany({
        skip,
        take,
        orderBy: { startDate: 'desc' },
      }),
      prisma.bulkOperation.count(),
    ])

    const meta = PaginationHelper.getMeta(validPage, validLimit, total)

    return {
      data: operations,
      ...meta,
    }
  }

  async getOperation(operationId: string) {
    const operation = await prisma.bulkOperation.findUnique({
      where: { id: operationId },
    })

    if (!operation) {
      throw new NotFoundError(INVENTORY_MESSAGES.bulk.operationNotFound)
    }

    return operation
  }

  async deleteOperation(operationId: string): Promise<void> {
    const operation = await prisma.bulkOperation.findUnique({
      where: { id: operationId },
    })

    if (!operation) {
      throw new NotFoundError(INVENTORY_MESSAGES.bulk.operationNotFound)
    }

    await prisma.bulkOperation.delete({
      where: { id: operationId },
    })

    logger.info('Bulk operation deleted', { operationId })
  }

  // Helper methods
  private async resolveCategoryIdByName(
    name: string,
    empresaId?: string
  ): Promise<string | undefined> {
    if (!name) return undefined
    const where: any = { name: { equals: name, mode: 'insensitive' } }
    if (empresaId) where.empresaId = empresaId
    const existing = await prisma.category.findFirst({ where })
    if (existing) return existing.id
    // create new category scoped to empresa
    const created = await prisma.category.create({
      data: {
        name,
        empresaId: empresaId || 'default',
        code: name.slice(0, 30),
      },
    })
    return created.id
  }

  private async resolveBrandIdByName(
    name: string,
    empresaId?: string
  ): Promise<string | undefined> {
    if (!name) return undefined
    const where: any = { name: { equals: name, mode: 'insensitive' } }
    if (empresaId) where.empresaId = empresaId
    const existing = await prisma.brand.findFirst({ where })
    if (existing) return existing.id
    const created = await prisma.brand.create({
      data: {
        name,
        empresaId: empresaId || 'default',
        code: name.slice(0, 30),
      },
    })
    return created.id
  }

  private async resolveUnitIdByName(
    name: string,
    empresaId?: string
  ): Promise<string | undefined> {
    if (!name) return undefined
    const where: any = { name: { equals: name, mode: 'insensitive' } }
    if (empresaId) where.empresaId = empresaId
    const existing = await prisma.unit.findFirst({ where })
    if (existing) return existing.id

    // Auto-create missing unit with defaults for abbreviation and type
    const created = await prisma.unit.create({
      data: {
        name,
        empresaId: empresaId || 'default',
        code: name.slice(0, 30),
        abbreviation: name.slice(0, 5).toLowerCase(),
        type: 'COUNTABLE',
      },
    })
    return created.id
  }

  private parseCSV(content: string): any[] {
    const lines = content.trim().split('\n')
    if (lines.length < 2) return []

    const headers = lines[0]?.split(',').map((h) => h.trim()) || []
    const rows = []

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i]
      if (!line) continue
      const values = line.split(',').map((v) => v.trim())
      const row: any = {}

      headers.forEach((header, index) => {
        row[header] = values[index]
      })

      rows.push(row)
    }

    return rows
  }

  private toCSV(items: any[], columns?: string[]): string {
    if (items.length === 0) return ''

    const keys = columns || Object.keys(items[0])
    const header = keys.join(',')
    const rows = items.map((item) =>
      keys.map((key) => item[key] ?? '').join(',')
    )

    return [header, ...rows].join('\n')
  }
}
