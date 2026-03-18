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

    // Guard against excessively large files (max 10 MB)
    const MAX_CSV_BYTES = 10 * 1024 * 1024
    if (data.fileContent.length > MAX_CSV_BYTES) {
      throw new BadRequestError('El archivo supera el límite de 10 MB')
    }

    // Parse CSV
    const rows = this.parseCSV(data.fileContent) as any[]
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

    const parsePositiveNumber = (v: any) => {
      const n = parseNumber(v)
      return n !== undefined && n >= 0 ? n : undefined
    }

    const isUuid = (v?: string) => !!v && /^[0-9a-fA-F-]{36}$/.test(v)

    // Pre-load existing catalogs for the empresa to avoid N+1 queries inside the loop.
    // Each map is keyed by normalized lower-case name → id.
    const [existingCategories, existingBrands, existingUnits] =
      await Promise.all([
        prisma.category.findMany({
          where: empresaId ? { empresaId } : {},
          select: { id: true, name: true },
        }),
        prisma.brand.findMany({
          where: empresaId ? { empresaId } : {},
          select: { id: true, name: true },
        }),
        prisma.unit.findMany({
          where: empresaId ? { empresaId } : {},
          select: { id: true, name: true },
        }),
      ])
    const categoryCache = new Map(
      existingCategories.map((c) => [c.name.toLowerCase(), c.id])
    )
    const brandCache = new Map(
      existingBrands.map((b) => [b.name.toLowerCase(), b.id])
    )
    const unitCache = new Map(
      existingUnits.map((u) => [u.name.toLowerCase(), u.id])
    )

    // ── Phase 1: normalize all rows (no DB I/O) ───────────────────────────
    const normalized: (IBulkImportData & { _rowIndex: number })[] = []
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      row.sku = normalize(row.sku)
      row.name = normalize(row.name)
      row.description = normalize(row.description)
      row.barcode = normalize(row.barcode)
      row.identity = normalize(row.identity)
      row.location = normalize(row.location)
      row.category = normalize(row.category)
      row.brand = normalize(row.brand)
      row.unit = normalize(row.unit)
      row.costPrice = parsePositiveNumber(row.costPrice)
      row.salePrice = parsePositiveNumber(row.salePrice)
      row.wholesalePrice = parsePositiveNumber(row.wholesalePrice)
      row.minStock = parsePositiveNumber(row.minStock)

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
      normalized.push({ ...row, _rowIndex: i + 1 } as any)
    }

    // ── Phase 2: resolve catalog IDs (sequential only for cache misses) ───
    for (const row of normalized) {
      if (!isUuid(row.categoryId) && row.category) {
        const key = row.category.toLowerCase()
        if (categoryCache.has(key)) {
          row.categoryId = categoryCache.get(key)
        } else {
          row.categoryId = await this.resolveCategoryIdByName(
            row.category,
            empresaId
          )
          if (row.categoryId) categoryCache.set(key, row.categoryId)
        }
      }
      if (!isUuid(row.brandId) && row.brand) {
        const key = row.brand.toLowerCase()
        if (brandCache.has(key)) {
          row.brandId = brandCache.get(key)
        } else {
          row.brandId = await this.resolveBrandIdByName(row.brand, empresaId)
          if (row.brandId) brandCache.set(key, row.brandId)
        }
      }
      if (!isUuid(row.unitId) && row.unit) {
        const key = row.unit.toLowerCase()
        if (unitCache.has(key)) {
          row.unitId = unitCache.get(key)
        } else {
          row.unitId = await this.resolveUnitIdByName(row.unit, empresaId)
          if (row.unitId) unitCache.set(key, row.unitId)
        }
      }
    }

    // ── Phase 3: ONE query to find which SKUs already exist ───────────────
    const allSkus = normalized.map((r) => r.sku as string)
    const existingItems = await prisma.item.findMany({
      where: { sku: { in: allSkus }, ...(empresaId ? { empresaId } : {}) },
      select: { id: true, sku: true },
    })
    const existingMap = new Map(existingItems.map((it) => [it.sku, it.id]))

    // ── Phase 4: separate into creates vs updates ─────────────────────────
    const toCreate: typeof normalized = []
    const toUpdate: typeof normalized = []

    for (const row of normalized) {
      const existingId = existingMap.get(row.sku as string)
      if (existingId) {
        if (data.options?.updateExisting) {
          ;(row as any)._existingId = existingId
          toUpdate.push(row)
        } else {
          errors.push({
            rowNumber: (row as any)._rowIndex,
            field: 'sku',
            value: row.sku,
            error: 'Item already exists and updateExisting is false',
          })
          failed++
        }
      } else {
        toCreate.push(row)
      }
    }

    // ── Phase 5a: batch create (single query) ────────────────────────────
    if (toCreate.length > 0) {
      try {
        const result = await prisma.item.createMany({
          data: toCreate.map((row) => ({
            sku: row.sku as string,
            code: (row as any).code ?? row.sku,
            name: row.name as string,
            description: row.description,
            costPrice: row.costPrice ?? 0,
            salePrice: row.salePrice ?? 0,
            wholesalePrice: row.wholesalePrice ?? undefined,
            minStock: row.minStock ?? 0,
            barcode: row.barcode,
            identity: row.identity,
            location: row.location?.toUpperCase(),
            isActive: true,
            empresaId: empresaId as string,
            brandId: row.brandId,
            categoryId: row.categoryId,
            unitId: row.unitId,
          })),
          skipDuplicates: true,
        })
        imported = result.count
        // Rows skipped by skipDuplicates (race condition) count as failures
        const skipped = toCreate.length - result.count
        if (skipped > 0) failed += skipped
      } catch (error: any) {
        // If createMany fails entirely, record each row as an error
        for (const row of toCreate) {
          errors.push({
            rowNumber: (row as any)._rowIndex,
            field: 'general',
            value: row.sku,
            error: error.message,
          })
        }
        failed += toCreate.length
      }
    }

    // ── Phase 5b: batch updates in parallel chunks of 50 ─────────────────
    if (toUpdate.length > 0) {
      const CHUNK = 50
      for (let start = 0; start < toUpdate.length; start += CHUNK) {
        const chunk = toUpdate.slice(start, start + CHUNK)
        const results = await Promise.allSettled(
          chunk.map((row) =>
            prisma.item.update({
              where: { id: (row as any)._existingId },
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
                identity: row.identity,
                location: row.location?.toUpperCase(),
              },
            })
          )
        )
        for (let j = 0; j < results.length; j++) {
          const res = results[j]
          if (res.status === 'fulfilled') {
            updated++
          } else {
            failed++
            errors.push({
              rowNumber: (chunk[j] as any)._rowIndex,
              field: 'general',
              value: chunk[j].sku,
              error: (res.reason as any)?.message ?? 'Update failed',
            })
          }
        }
      }
    }

    // Update operation status
    await prisma.bulkOperation.update({
      where: { id: operationId },
      data: {
        status: failed === 0 ? 'COMPLETED' : 'COMPLETED_WITH_ERRORS',
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

    // Fetch items in pages of 500 to avoid loading all records into memory at once
    const PAGE_SIZE = 500
    const mappedItems: any[] = []
    let cursor: string | undefined
    while (true) {
      const page = await prisma.item.findMany({
        where: whereWithEmpresa,
        include: { category: true, brand: true, unit: true, model: true },
        take: PAGE_SIZE,
        ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
        orderBy: { id: 'asc' },
      })
      if (page.length === 0) break
      for (const item of page) {
        mappedItems.push({
          ...item,
          category: item.category?.name || '',
          brand: item.brand?.name || '',
          unit: item.unit?.name || '',
          model: (item as any).model?.name || '',
          status: item.isActive ? 'Activo' : 'Inactivo',
          costPrice: item.costPrice ? Number(item.costPrice) : 0,
          salePrice: item.salePrice ? Number(item.salePrice) : 0,
          wholesalePrice: item.wholesalePrice ? Number(item.wholesalePrice) : 0,
        })
      }
      if (page.length < PAGE_SIZE) break
      cursor = page[page.length - 1].id
    }

    // If no items match the filters, return a valid empty export instead of a 404.
    // This prevents clients from failing on "Not Found" errors when there are just
    // no matching records to export.
    if (mappedItems.length === 0) {
      logger.info('Bulk export resulted in no matching items', {
        operationId,
        format,
        userId,
      })
    }

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

      // Use provided columns or fallback to a default set if no items exist
      const defaultKeys = [
        'sku',
        'name',
        'description',
        'category',
        'brand',
        'costPrice',
        'salePrice',
      ]
      const keys =
        data.columns ||
        (mappedItems.length > 0 ? Object.keys(mappedItems[0]) : defaultKeys)
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
        totalRecords: mappedItems.length,
        processedRecords: mappedItems.length,
        errorRecords: 0,
        createdBy: userId,
        endDate: new Date(),
      },
    })

    logger.info('Bulk export completed', {
      operationId,
      format,
      recordCount: mappedItems.length,
      userId,
    })

    return {
      operationId,
      fileName,
      format,
      recordCount: mappedItems.length,
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

    // Whitelist of fields that can be updated in bulk to prevent overwriting
    // sensitive fields like createdBy, empresaId, etc.
    const ALLOWED_UPDATE_FIELDS = [
      'name',
      'description',
      'costPrice',
      'salePrice',
      'wholesalePrice',
      'minStock',
      'maxStock',
      'reorderPoint',
      'barcode',
      'identity',
      'location',
      'isActive',
      'categoryId',
      'brandId',
      'unitId',
    ] as const
    const safeUpdate: Record<string, unknown> = {}
    for (const field of ALLOWED_UPDATE_FIELDS) {
      if (field in data.update) safeUpdate[field] = data.update[field]
    }
    if (Object.keys(safeUpdate).length === 0) {
      throw new BadRequestError(
        'No se proporcionaron campos válidos para actualizar'
      )
    }

    // Perform update
    const result = await prisma.item.updateMany({
      where: filterWithEmpresa,
      data: safeUpdate,
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
  /** Generate a collision-safe code from a name: first 24 chars + 6-char hex suffix. */
  private safeCode(name: string): string {
    const base = name.slice(0, 24).trim().replace(/\s+/g, '-').toUpperCase()
    const suffix = Math.floor(Math.random() * 0xffffff)
      .toString(16)
      .padStart(6, '0')
      .toUpperCase()
    return `${base}-${suffix}`
  }

  private async resolveCategoryIdByName(
    name: string,
    empresaId?: string
  ): Promise<string | undefined> {
    if (!name) return undefined
    const eid = empresaId || 'default'
    const where: any = {
      name: { equals: name, mode: 'insensitive' },
      empresaId: eid,
    }
    const existing = await prisma.category.findFirst({ where })
    if (existing) return existing.id
    try {
      const created = await prisma.category.create({
        data: { name, empresaId: eid, code: this.safeCode(name) },
      })
      return created.id
    } catch (e: any) {
      if (e.code === 'P2002') {
        // Race condition or code conflict — re-fetch
        const found = await prisma.category.findFirst({ where })
        return found?.id
      }
      throw e
    }
  }

  private async resolveBrandIdByName(
    name: string,
    empresaId?: string
  ): Promise<string | undefined> {
    if (!name) return undefined
    const eid = empresaId || 'default'
    const where: any = {
      name: { equals: name, mode: 'insensitive' },
      empresaId: eid,
    }
    const existing = await prisma.brand.findFirst({ where })
    if (existing) return existing.id
    try {
      const created = await prisma.brand.create({
        data: { name, empresaId: eid, code: this.safeCode(name) },
      })
      return created.id
    } catch (e: any) {
      if (e.code === 'P2002') {
        const found = await prisma.brand.findFirst({ where })
        return found?.id
      }
      throw e
    }
  }

  private async resolveUnitIdByName(
    name: string,
    empresaId?: string
  ): Promise<string | undefined> {
    if (!name) return undefined
    const eid = empresaId || 'default'
    const where: any = {
      name: { equals: name, mode: 'insensitive' },
      empresaId: eid,
    }
    const existing = await prisma.unit.findFirst({ where })
    if (existing) return existing.id
    // Abbreviation must be unique per empresa — use a random suffix to avoid conflicts
    const abbr = `${name.slice(0, 3).toLowerCase()}-${Math.random().toString(36).slice(2, 5)}`
    try {
      const created = await prisma.unit.create({
        data: {
          name,
          empresaId: eid,
          code: this.safeCode(name),
          abbreviation: abbr,
          type: 'COUNTABLE',
        },
      })
      return created.id
    } catch (e: any) {
      if (e.code === 'P2002') {
        const found = await prisma.unit.findFirst({ where })
        return found?.id
      }
      throw e
    }
  }

  /**
   * RFC 4180-compliant CSV parser.
   * Handles quoted fields with embedded commas, escaped quotes (""), and CRLF/LF line endings.
   * Header names are sanitized to prevent prototype pollution.
   */
  private parseCSV(content: string): Record<string, string>[] {
    const parseRow = (line: string): string[] => {
      const values: string[] = []
      let field = ''
      let inQuotes = false

      for (let i = 0; i < line.length; i++) {
        const ch = line[i]
        if (ch === '"') {
          if (inQuotes && line[i + 1] === '"') {
            field += '"'
            i++ // skip escaped quote
          } else {
            inQuotes = !inQuotes
          }
        } else if (ch === ',' && !inQuotes) {
          values.push(field.trim())
          field = ''
        } else {
          field += ch
        }
      }
      values.push(field.trim())
      return values
    }

    // Split respecting quoted newlines
    const lines: string[] = []
    let current = ''
    let inQ = false
    for (let i = 0; i < content.length; i++) {
      const ch = content[i]
      if (ch === '"') {
        if (inQ && content[i + 1] === '"') {
          current += '""'
          i++
        } else {
          inQ = !inQ
          current += ch
        }
      } else if (
        (ch === '\n' || (ch === '\r' && content[i + 1] === '\n')) &&
        !inQ
      ) {
        if (ch === '\r') i++ // skip \n of \r\n
        lines.push(current)
        current = ''
      } else if (ch === '\r' && !inQ) {
        lines.push(current)
        current = ''
      } else {
        current += ch
      }
    }
    if (current.trim()) lines.push(current)

    if (lines.length < 2) return []

    // Sanitize headers to prevent prototype pollution (__proto__, constructor, etc.)
    const rawHeaders = parseRow(lines[0] ?? '')
    const headers = rawHeaders.map((h) => h.replace(/[^a-zA-Z0-9_]/g, ''))

    const rows: Record<string, string>[] = []
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i]
      if (!line?.trim()) continue
      const values = parseRow(line)
      const row: Record<string, string> = Object.create(null)
      headers.forEach((header, index) => {
        if (header) row[header] = values[index] ?? ''
      })
      rows.push(row)
    }

    return rows
  }

  private toCSV(items: any[], columns?: string[]): string {
    const defaultKeys = [
      'sku',
      'name',
      'description',
      'category',
      'brand',
      'costPrice',
      'salePrice',
    ]
    const keys =
      columns || (items.length > 0 ? Object.keys(items[0]) : defaultKeys)
    const header = keys.join(',')

    if (items.length === 0) {
      return header
    }

    const rows = items.map((item) =>
      keys.map((key) => item[key] ?? '').join(',')
    )

    return [header, ...rows].join('\n')
  }
}
