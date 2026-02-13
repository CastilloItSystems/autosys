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
} from './bulk.interface'
import {
  BadRequestError,
  NotFoundError,
} from '../../../../shared/utils/ApiError'
import { v4 as uuid } from 'uuid'
import prisma from '../../../../services/prisma.service'
import { PaginationHelper } from '../../../../shared/utils/pagination'
import { INVENTORY_MESSAGES } from '../../shared/constants/messages'
import { logger } from '../../../../shared/utils/logger'

export class BulkService {
  async importItems(
    data: IBulkImportInput,
    userId: string
  ): Promise<IBulkImportResult> {
    const operationId = uuid()

    // Parse CSV
    const rows = this.parseCSV(data.fileContent)
    if (rows.length === 0) {
      throw new BadRequestError(INVENTORY_MESSAGES.bulk.emptyFile)
    }

    // Create bulk operation record
    const operation = await prisma.bulkOperation.create({
      data: {
        id: operationId,
        operationType: 'IMPORT',
        status: 'PROCESSING',
        fileName: data.fileName,
        totalRecords: rows.length,
        processedRecords: 0,
        errorRecords: 0,
        createdBy: userId,
      },
    })

    const errors: IBulkValidationError[] = []
    let imported = 0
    let updated = 0
    let failed = 0

    for (let i = 0; i < rows.length; i++) {
      try {
        const row = rows[i]

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

        // Check if item exists
        const existingItem = await prisma.item.findUnique({
          where: { sku: row.sku },
        })

        if (existingItem && data.options?.updateExisting) {
          // Update existing
          await prisma.item.update({
            where: { id: existingItem.id },
            data: {
              name: row.name,
              description: row.description,
              categoryId: row.categoryId,
              unitId: row.unitId,
              costPrice: row.costPrice,
              salePrice: row.salePrice,
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
              categoryId:
                row.categoryId || '6bd78d44-79f1-4a7a-8e3d-5f1f1e1e1e1e',
              brandId: row.brandId || '6bd78d44-79f1-4a7a-8e3d-5f1f1e1e1e1e',
              unitId: row.unitId || 'c5e1d8e1-4e7d-4c1a-8b2d-1a1a1a1a1a1a',
              costPrice: row.costPrice,
              salePrice: row.salePrice,
              wholesalePrice: row.wholesalePrice,
              minStock: row.minStock || 0,
              barcode: row.barcode,
              isActive: true,
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

  async exportItems(data: IBulkExportInput, userId: string): Promise<any> {
    const operationId = uuid()
    const format = data.format || 'csv'

    // Build where clause from filters
    const where: any = {}
    if (data.filters?.categoryId) where.categoryId = data.filters.categoryId
    if (data.filters?.inStock) where.stock = { gt: 0 }
    if (data.filters?.isActive !== undefined)
      where.isActive = data.filters.isActive

    const items = await prisma.item.findMany({ where })

    if (items.length === 0) {
      throw new NotFoundError(INVENTORY_MESSAGES.bulk.noItemsExport)
    }

    let fileContent = ''
    let fileName = ''

    if (format === 'csv') {
      fileContent = this.toCSV(items, data.columns)
      fileName = `items_export_${new Date().getTime()}.csv`
    } else if (format === 'json') {
      fileContent = JSON.stringify(items, null, 2)
      fileName = `items_export_${new Date().getTime()}.json`
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
    userId: string
  ): Promise<{ modifiedCount: number }> {
    const operationId = uuid()

    // Count matching items
    const matchedItems = await prisma.item.findMany({
      where: data.filter,
    })

    if (matchedItems.length === 0) {
      throw new NotFoundError(INVENTORY_MESSAGES.bulk.noItemsUpdate)
    }

    // Perform update
    const result = await prisma.item.updateMany({
      where: data.filter,
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
    userId: string
  ): Promise<{ deletedCount: number }> {
    const operationId = uuid()

    const matchedItems = await prisma.item.findMany({
      where: data.filter,
    })

    if (matchedItems.length === 0) {
      throw new NotFoundError(INVENTORY_MESSAGES.bulk.noItemsDelete)
    }

    let result
    if (data.permanent) {
      // Hard delete
      result = await prisma.item.deleteMany({
        where: data.filter,
      })
    } else {
      // Soft delete
      result = await prisma.item.updateMany({
        where: data.filter,
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
