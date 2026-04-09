// backend/src/features/inventory/stock/bulk/bulk.service.ts

import {
  IStockImportRow,
  IStockAdjustmentRow,
  IStockTransferRow,
  IStockExportInput,
  IStockBulkError,
  IStockBulkResult,
} from './bulk.interface.js'
import { BadRequestError, NotFoundError } from '../../../../shared/utils/apiError.js'
import { v4 as uuid } from 'uuid'
import prisma from '../../../../services/prisma.service.js'
import { PaginationHelper } from '../../../../shared/utils/pagination.js'
import { logger } from '../../../../shared/utils/logger.js'
import ExcelJS from 'exceljs'

// Valid movement types for adjustments
const VALID_MOVEMENT_TYPES = [
  'ADJUSTMENT_IN',
  'ADJUSTMENT_OUT',
  'PURCHASE',
  'SALE',
  'SUPPLIER_RETURN',
  'WORKSHOP_RETURN',
  'LOAN_OUT',
  'LOAN_RETURN',
]

export class StockBulkService {
  // ─── IMPORT ───────────────────────────────────────────────────────────────

  /**
   * Bulk import: creates/updates stock levels from CSV and records ADJUSTMENT_IN movements.
   * CSV columns: sku, warehouseCode, quantity, unitCost, location, notes
   */
  async importStock(
    fileContent: string,
    fileName: string,
    userId: string,
    empresaId: string,
    options?: { updateExisting?: boolean }
  ): Promise<IStockBulkResult> {
    const MAX_CSV_BYTES = 10 * 1024 * 1024
    if (fileContent.length > MAX_CSV_BYTES) {
      throw new BadRequestError('El archivo supera el límite de 10 MB')
    }

    const rawRows = this.parseCSV(fileContent)
    if (rawRows.length === 0) {
      throw new BadRequestError('El archivo no contiene registros válidos')
    }

    const operationId = uuid()
    await prisma.bulkOperation.create({
      data: {
        id: operationId,
        operationType: 'STOCK_IMPORT',
        status: 'PROCESSING',
        fileName,
        totalRecords: rawRows.length,
        processedRecords: 0,
        errorRecords: 0,
        createdBy: userId,
        metadata: { empresaId },
      },
    })

    const errors: IStockBulkError[] = []
    let processed = 0
    let failed = 0

    // ── Parse rows ────────────────────────────────────────────────────────────
    const rows: (IStockImportRow & { _rowIndex: number })[] = []
    for (let i = 0; i < rawRows.length; i++) {
      const r = rawRows[i]
      const sku = this.norm(r.sku)
      const warehouseCode = this.norm(r.warehouseCode)
      const quantity = this.parsePositiveNumber(r.quantity)

      if (!sku || !warehouseCode) {
        errors.push({ rowNumber: i + 1, sku: sku || undefined, warehouseCode: warehouseCode || undefined, error: 'sku y warehouseCode son requeridos' })
        failed++
        continue
      }
      if (quantity === undefined || quantity <= 0) {
        errors.push({ rowNumber: i + 1, sku, warehouseCode, error: 'quantity debe ser un número mayor a 0' })
        failed++
        continue
      }
      rows.push({
        _rowIndex: i + 1,
        sku,
        warehouseCode,
        quantity,
        unitCost: this.parsePositiveNumber(r.unitCost),
        location: this.norm(r.location),
        notes: this.norm(r.notes),
      } as any)
    }

    // ── Batch resolve SKUs and warehouse codes ─────────────────────────────
    const skuSet = [...new Set(rows.map((r) => r.sku))]
    const whCodeSet = [...new Set(rows.map((r) => r.warehouseCode))]

    const [itemRecords, warehouseRecords] = await Promise.all([
      prisma.item.findMany({
        where: { sku: { in: skuSet }, empresaId },
        select: { id: true, sku: true },
      }),
      prisma.warehouse.findMany({
        where: { code: { in: whCodeSet }, empresaId },
        select: { id: true, code: true },
      }),
    ])

    const itemMap = new Map(itemRecords.map((it) => [it.sku, it.id]))
    const warehouseMap = new Map(warehouseRecords.map((wh) => [wh.code, wh.id]))

    // ── Process each row ───────────────────────────────────────────────────
    const results = await Promise.allSettled(
      rows.map(async (row) => {
        const itemId = itemMap.get(row.sku)
        if (!itemId) throw new Error(`SKU "${row.sku}" no encontrado en la empresa`)

        const warehouseId = warehouseMap.get(row.warehouseCode)
        if (!warehouseId) throw new Error(`Almacén con código "${row.warehouseCode}" no encontrado`)

        const unitCost = row.unitCost ?? 0

        await prisma.$transaction(async (tx) => {
          // Upsert stock
          const existing = await tx.stock.findUnique({
            where: { itemId_warehouseId: { itemId, warehouseId } },
          })

          if (existing) {
            if (!options?.updateExisting) {
              throw new Error(`Ya existe stock para "${row.sku}" en "${row.warehouseCode}". Use updateExisting=true para actualizar`)
            }
            const newQuantityReal = existing.quantityReal + row.quantity
            await tx.stock.update({
              where: { id: existing.id },
              data: {
                quantityReal: newQuantityReal,
                quantityAvailable: newQuantityReal - existing.quantityReserved,
                averageCost: unitCost > 0
                  ? this.calcNewAverageCost(
                      Number(existing.averageCost),
                      existing.quantityReal,
                      unitCost,
                      row.quantity
                    )
                  : existing.averageCost,
                location: row.location ?? existing.location,
                lastMovementAt: new Date(),
              },
            })
          } else {
            await tx.stock.create({
              data: {
                itemId,
                warehouseId,
                quantityReal: row.quantity,
                quantityReserved: 0,
                quantityAvailable: row.quantity,
                averageCost: unitCost,
                location: row.location ?? null,
                lastMovementAt: new Date(),
              },
            })
          }

          // Create ADJUSTMENT_IN movement
          await tx.movement.create({
            data: {
              movementNumber: this.generateMovementNumber('IMP'),
              type: 'ADJUSTMENT_IN',
              itemId,
              warehouseToId: warehouseId,
              quantity: row.quantity,
              unitCost: unitCost > 0 ? unitCost : null,
              totalCost: unitCost > 0 ? unitCost * row.quantity : null,
              notes: row.notes ?? 'Carga masiva de stock',
              createdBy: userId,
              reference: `BULK-IMPORT-${operationId.slice(0, 8)}`,
              movementDate: new Date(),
            },
          })
        })
      })
    )

    for (let i = 0; i < results.length; i++) {
      const res = results[i]
      if (res.status === 'fulfilled') {
        processed++
      } else {
        failed++
        errors.push({
          rowNumber: rows[i]._rowIndex,
          sku: rows[i].sku,
          warehouseCode: rows[i].warehouseCode,
          error: (res.reason as any)?.message ?? 'Error desconocido',
        })
      }
    }

    const finalStatus = failed === 0 ? 'COMPLETED' : processed > 0 ? 'COMPLETED_WITH_ERRORS' : 'FAILED'
    await prisma.bulkOperation.update({
      where: { id: operationId },
      data: {
        status: finalStatus,
        processedRecords: processed,
        errorRecords: failed,
        errorDetails: errors.length > 0 ? JSON.stringify(errors) : undefined,
        endDate: new Date(),
      },
    })

    logger.info('Bulk stock import completado', { operationId, processed, failed, empresaId })

    return { operationId, processed, failed, errors }
  }

  // ─── ADJUSTMENT ───────────────────────────────────────────────────────────

  /**
   * Bulk adjustment: adjusts stock quantities and records movements.
   * CSV columns: sku, warehouseCode, quantity, movementType, reference, notes
   * quantity > 0 = entry, < 0 = exit
   */
  async adjustStock(
    fileContent: string,
    fileName: string,
    userId: string,
    empresaId: string
  ): Promise<IStockBulkResult> {
    const MAX_CSV_BYTES = 10 * 1024 * 1024
    if (fileContent.length > MAX_CSV_BYTES) {
      throw new BadRequestError('El archivo supera el límite de 10 MB')
    }

    const rawRows = this.parseCSV(fileContent)
    if (rawRows.length === 0) {
      throw new BadRequestError('El archivo no contiene registros válidos')
    }

    const operationId = uuid()
    await prisma.bulkOperation.create({
      data: {
        id: operationId,
        operationType: 'STOCK_ADJUSTMENT',
        status: 'PROCESSING',
        fileName,
        totalRecords: rawRows.length,
        processedRecords: 0,
        errorRecords: 0,
        createdBy: userId,
        metadata: { empresaId },
      },
    })

    const errors: IStockBulkError[] = []
    let processed = 0
    let failed = 0

    // ── Parse rows ────────────────────────────────────────────────────────────
    const rows: (IStockAdjustmentRow & { _rowIndex: number })[] = []
    for (let i = 0; i < rawRows.length; i++) {
      const r = rawRows[i]
      const sku = this.norm(r.sku)
      const warehouseCode = this.norm(r.warehouseCode)
      const quantity = this.parseNumber(r.quantity)

      if (!sku || !warehouseCode) {
        errors.push({ rowNumber: i + 1, sku: sku || undefined, warehouseCode: warehouseCode || undefined, error: 'sku y warehouseCode son requeridos' })
        failed++
        continue
      }
      if (quantity === undefined || quantity === 0) {
        errors.push({ rowNumber: i + 1, sku, warehouseCode, error: 'quantity no puede ser 0' })
        failed++
        continue
      }

      const rawMovementType = this.norm(r.movementType)?.toUpperCase()
      const movementType = rawMovementType && VALID_MOVEMENT_TYPES.includes(rawMovementType)
        ? rawMovementType
        : undefined

      rows.push({
        _rowIndex: i + 1,
        sku,
        warehouseCode,
        quantity,
        movementType,
        reference: this.norm(r.reference),
        notes: this.norm(r.notes),
      } as any)
    }

    // ── Batch resolve ─────────────────────────────────────────────────────────
    const skuSet = [...new Set(rows.map((r) => r.sku))]
    const whCodeSet = [...new Set(rows.map((r) => r.warehouseCode))]

    const [itemRecords, warehouseRecords] = await Promise.all([
      prisma.item.findMany({
        where: { sku: { in: skuSet }, empresaId },
        select: { id: true, sku: true },
      }),
      prisma.warehouse.findMany({
        where: { code: { in: whCodeSet }, empresaId },
        select: { id: true, code: true },
      }),
    ])

    const itemMap = new Map(itemRecords.map((it) => [it.sku, it.id]))
    const warehouseMap = new Map(warehouseRecords.map((wh) => [wh.code, wh.id]))

    // ── Process each row independently (Promise.allSettled for resilience) ──
    const results = await Promise.allSettled(
      rows.map(async (row) => {
        const itemId = itemMap.get(row.sku)
        if (!itemId) throw new Error(`SKU "${row.sku}" no encontrado en la empresa`)

        const warehouseId = warehouseMap.get(row.warehouseCode)
        if (!warehouseId) throw new Error(`Almacén con código "${row.warehouseCode}" no encontrado`)

        // Derive movement type from quantity sign if not explicitly provided
        const movementType = (row.movementType as any) ??
          (row.quantity > 0 ? 'ADJUSTMENT_IN' : 'ADJUSTMENT_OUT')

        await prisma.$transaction(async (tx) => {
          const stock = await tx.stock.findUnique({
            where: { itemId_warehouseId: { itemId, warehouseId } },
          })
          if (!stock) {
            throw new Error(`No existe stock para "${row.sku}" en almacén "${row.warehouseCode}"`)
          }

          const newQuantityReal = stock.quantityReal + row.quantity
          if (newQuantityReal < 0) {
            throw new Error(
              `Stock insuficiente para "${row.sku}" en "${row.warehouseCode}": disponible ${stock.quantityAvailable}, solicitado ${Math.abs(row.quantity)}`
            )
          }

          await tx.stock.update({
            where: { id: stock.id },
            data: {
              quantityReal: newQuantityReal,
              quantityAvailable: newQuantityReal - stock.quantityReserved,
              lastMovementAt: new Date(),
            },
          })

          await tx.movement.create({
            data: {
              movementNumber: this.generateMovementNumber('ADJ'),
              type: movementType as any,
              itemId,
              warehouseToId: row.quantity > 0 ? warehouseId : null,
              warehouseFromId: row.quantity < 0 ? warehouseId : null,
              quantity: Math.abs(row.quantity),
              reference: row.reference ?? `BULK-ADJ-${operationId.slice(0, 8)}`,
              notes: row.notes ?? null,
              createdBy: userId,
              movementDate: new Date(),
            },
          })
        })
      })
    )

    for (let i = 0; i < results.length; i++) {
      const res = results[i]
      if (res.status === 'fulfilled') {
        processed++
      } else {
        failed++
        errors.push({
          rowNumber: rows[i]._rowIndex,
          sku: rows[i].sku,
          warehouseCode: rows[i].warehouseCode,
          error: (res.reason as any)?.message ?? 'Error desconocido',
        })
      }
    }

    const finalStatus = failed === 0 ? 'COMPLETED' : processed > 0 ? 'COMPLETED_WITH_ERRORS' : 'FAILED'
    await prisma.bulkOperation.update({
      where: { id: operationId },
      data: {
        status: finalStatus,
        processedRecords: processed,
        errorRecords: failed,
        errorDetails: errors.length > 0 ? JSON.stringify(errors) : undefined,
        endDate: new Date(),
      },
    })

    logger.info('Bulk stock adjustment completado', { operationId, processed, failed, empresaId })

    return { operationId, processed, failed, errors }
  }

  // ─── TRANSFER ─────────────────────────────────────────────────────────────

  /**
   * Bulk transfer: moves stock between warehouses and records TRANSFER movements.
   * CSV columns: sku, fromWarehouseCode, toWarehouseCode, quantity, notes
   */
  async transferStock(
    fileContent: string,
    fileName: string,
    userId: string,
    empresaId: string
  ): Promise<IStockBulkResult> {
    const MAX_CSV_BYTES = 10 * 1024 * 1024
    if (fileContent.length > MAX_CSV_BYTES) {
      throw new BadRequestError('El archivo supera el límite de 10 MB')
    }

    const rawRows = this.parseCSV(fileContent)
    if (rawRows.length === 0) {
      throw new BadRequestError('El archivo no contiene registros válidos')
    }

    const operationId = uuid()
    await prisma.bulkOperation.create({
      data: {
        id: operationId,
        operationType: 'STOCK_TRANSFER',
        status: 'PROCESSING',
        fileName,
        totalRecords: rawRows.length,
        processedRecords: 0,
        errorRecords: 0,
        createdBy: userId,
        metadata: { empresaId },
      },
    })

    const errors: IStockBulkError[] = []
    let processed = 0
    let failed = 0

    // ── Parse rows ────────────────────────────────────────────────────────────
    const rows: (IStockTransferRow & { _rowIndex: number })[] = []
    for (let i = 0; i < rawRows.length; i++) {
      const r = rawRows[i]
      const sku = this.norm(r.sku)
      const fromWarehouseCode = this.norm(r.fromWarehouseCode)
      const toWarehouseCode = this.norm(r.toWarehouseCode)
      const quantity = this.parsePositiveNumber(r.quantity)

      if (!sku || !fromWarehouseCode || !toWarehouseCode) {
        errors.push({ rowNumber: i + 1, sku: sku || undefined, error: 'sku, fromWarehouseCode y toWarehouseCode son requeridos' })
        failed++
        continue
      }
      if (quantity === undefined || quantity <= 0) {
        errors.push({ rowNumber: i + 1, sku, error: 'quantity debe ser un número mayor a 0' })
        failed++
        continue
      }
      if (fromWarehouseCode === toWarehouseCode) {
        errors.push({ rowNumber: i + 1, sku, error: 'Los almacenes de origen y destino no pueden ser el mismo' })
        failed++
        continue
      }

      rows.push({
        _rowIndex: i + 1,
        sku,
        fromWarehouseCode,
        toWarehouseCode,
        quantity,
        notes: this.norm(r.notes),
      } as any)
    }

    // ── Batch resolve ─────────────────────────────────────────────────────────
    const skuSet = [...new Set(rows.map((r) => r.sku))]
    const allCodes = [...new Set(rows.flatMap((r) => [r.fromWarehouseCode, r.toWarehouseCode]))]

    const [itemRecords, warehouseRecords] = await Promise.all([
      prisma.item.findMany({
        where: { sku: { in: skuSet }, empresaId },
        select: { id: true, sku: true },
      }),
      prisma.warehouse.findMany({
        where: { code: { in: allCodes }, empresaId },
        select: { id: true, code: true },
      }),
    ])

    const itemMap = new Map(itemRecords.map((it) => [it.sku, it.id]))
    const warehouseMap = new Map(warehouseRecords.map((wh) => [wh.code, wh.id]))

    // ── Process each row in its own transaction ──────────────────────────────
    const results = await Promise.allSettled(
      rows.map(async (row) => {
        const itemId = itemMap.get(row.sku)
        if (!itemId) throw new Error(`SKU "${row.sku}" no encontrado en la empresa`)

        const fromWarehouseId = warehouseMap.get(row.fromWarehouseCode)
        if (!fromWarehouseId) throw new Error(`Almacén origen "${row.fromWarehouseCode}" no encontrado`)

        const toWarehouseId = warehouseMap.get(row.toWarehouseCode)
        if (!toWarehouseId) throw new Error(`Almacén destino "${row.toWarehouseCode}" no encontrado`)

        await prisma.$transaction(async (tx) => {
          // Validate origin stock
          const stockFrom = await tx.stock.findUnique({
            where: { itemId_warehouseId: { itemId, warehouseId: fromWarehouseId } },
          })
          if (!stockFrom) {
            throw new Error(`No existe stock para "${row.sku}" en almacén origen "${row.fromWarehouseCode}"`)
          }
          if (stockFrom.quantityAvailable < row.quantity) {
            throw new Error(
              `Stock insuficiente para "${row.sku}" en "${row.fromWarehouseCode}": disponible ${stockFrom.quantityAvailable}, solicitado ${row.quantity}`
            )
          }

          // Decrement origin
          await tx.stock.update({
            where: { id: stockFrom.id },
            data: {
              quantityReal: stockFrom.quantityReal - row.quantity,
              quantityAvailable: stockFrom.quantityAvailable - row.quantity,
              lastMovementAt: new Date(),
            },
          })

          // Upsert destination (may not exist yet)
          await tx.stock.upsert({
            where: { itemId_warehouseId: { itemId, warehouseId: toWarehouseId } },
            update: {
              quantityReal: { increment: row.quantity },
              quantityAvailable: { increment: row.quantity },
              lastMovementAt: new Date(),
            },
            create: {
              itemId,
              warehouseId: toWarehouseId,
              quantityReal: row.quantity,
              quantityReserved: 0,
              quantityAvailable: row.quantity,
              averageCost: stockFrom.averageCost,
              lastMovementAt: new Date(),
            },
          })

          // Create TRANSFER movement
          await tx.movement.create({
            data: {
              movementNumber: this.generateMovementNumber('TRF'),
              type: 'TRANSFER',
              itemId,
              warehouseFromId: fromWarehouseId,
              warehouseToId: toWarehouseId,
              quantity: row.quantity,
              unitCost: stockFrom.averageCost,
              totalCost: stockFrom.averageCost
                ? Number(stockFrom.averageCost) * row.quantity
                : null,
              notes: row.notes ?? null,
              createdBy: userId,
              reference: `BULK-TRF-${operationId.slice(0, 8)}`,
              movementDate: new Date(),
            },
          })
        })
      })
    )

    for (let i = 0; i < results.length; i++) {
      const res = results[i]
      if (res.status === 'fulfilled') {
        processed++
      } else {
        failed++
        errors.push({
          rowNumber: rows[i]._rowIndex,
          sku: rows[i].sku,
          error: (res.reason as any)?.message ?? 'Error desconocido',
        })
      }
    }

    const finalStatus = failed === 0 ? 'COMPLETED' : processed > 0 ? 'COMPLETED_WITH_ERRORS' : 'FAILED'
    await prisma.bulkOperation.update({
      where: { id: operationId },
      data: {
        status: finalStatus,
        processedRecords: processed,
        errorRecords: failed,
        errorDetails: errors.length > 0 ? JSON.stringify(errors) : undefined,
        endDate: new Date(),
      },
    })

    logger.info('Bulk stock transfer completado', { operationId, processed, failed, empresaId })

    return { operationId, processed, failed, errors }
  }

  // ─── EXPORT ───────────────────────────────────────────────────────────────

  async exportStock(
    data: IStockExportInput,
    userId: string,
    empresaId: string
  ): Promise<any> {
    const operationId = uuid()
    const format = data.format || 'csv'

    const where: any = { item: { empresaId } }
    if (data.filters?.warehouseId) where.warehouseId = data.filters.warehouseId
    if (data.filters?.itemId) where.itemId = data.filters.itemId
    if (data.filters?.itemId === undefined && data.filters?.categoryId) {
      where.item = { ...where.item, categoryId: data.filters.categoryId }
    }
    if (data.filters?.outOfStock) {
      where.quantityAvailable = 0
    } else if (data.filters?.lowStock) {
      where.quantityAvailable = { lt: 10 }
    } else {
      if (data.filters?.minQuantity !== undefined) {
        where.quantityAvailable = { gte: data.filters.minQuantity }
      }
      if (data.filters?.maxQuantity !== undefined) {
        where.quantityAvailable = { ...where.quantityAvailable, lte: data.filters.maxQuantity }
      }
    }

    const PAGE_SIZE = 500
    const mappedRecords: any[] = []
    let cursor: string | undefined

    while (true) {
      const page = await prisma.stock.findMany({
        where,
        include: { item: { include: { category: true } }, warehouse: true },
        take: PAGE_SIZE,
        ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
        orderBy: { id: 'asc' },
      })
      if (page.length === 0) break
      for (const s of page) {
        mappedRecords.push({
          sku: (s as any).item?.sku ?? '',
          itemName: (s as any).item?.name ?? '',
          category: (s as any).item?.category?.name ?? '',
          warehouseCode: (s as any).warehouse?.code ?? '',
          warehouseName: (s as any).warehouse?.name ?? '',
          quantityReal: s.quantityReal,
          quantityReserved: s.quantityReserved,
          quantityAvailable: s.quantityAvailable,
          averageCost: s.averageCost ? Number(s.averageCost) : 0,
          location: s.location ?? '',
          lastMovementAt: s.lastMovementAt ? (s.lastMovementAt as Date).toISOString() : '',
        })
      }
      if (page.length < PAGE_SIZE) break
      cursor = page[page.length - 1].id
    }

    let fileContent: any = ''
    let fileName = ''

    const defaultColumns = [
      'sku', 'itemName', 'category', 'warehouseCode', 'warehouseName',
      'quantityReal', 'quantityReserved', 'quantityAvailable', 'averageCost', 'location', 'lastMovementAt',
    ]

    if (format === 'csv') {
      fileContent = this.toCSV(mappedRecords, data.columns ?? defaultColumns)
      fileName = `stock_export_${Date.now()}.csv`
    } else if (format === 'json') {
      fileContent = JSON.stringify(mappedRecords, null, 2)
      fileName = `stock_export_${Date.now()}.json`
    } else if (format === 'xlsx') {
      const workbook = new ExcelJS.Workbook()
      const worksheet = workbook.addWorksheet('Stock')
      const keys = data.columns ?? defaultColumns
      worksheet.addRow(keys)
      mappedRecords.forEach((rec) => {
        worksheet.addRow(keys.map((k) => rec[k] ?? ''))
      })
      fileContent = await workbook.xlsx.writeBuffer()
      fileName = `stock_export_${Date.now()}.xlsx`
    }

    await prisma.bulkOperation.create({
      data: {
        id: operationId,
        operationType: 'STOCK_EXPORT',
        status: 'COMPLETED',
        fileName,
        totalRecords: mappedRecords.length,
        processedRecords: mappedRecords.length,
        errorRecords: 0,
        createdBy: userId,
        endDate: new Date(),
        metadata: { empresaId },
      },
    })

    logger.info('Bulk stock export completado', { operationId, format, recordCount: mappedRecords.length, userId })

    return { operationId, fileName, format, recordCount: mappedRecords.length, content: fileContent }
  }

  // ─── OPERATIONS (historial) ────────────────────────────────────────────────

  async getOperations(page = 1, limit = 10, empresaId?: string) {
    const { skip, take, page: validPage, limit: validLimit } =
      PaginationHelper.validateAndParse({ page, limit })

    const where: any = {
      operationType: { in: ['STOCK_IMPORT', 'STOCK_ADJUSTMENT', 'STOCK_TRANSFER', 'STOCK_EXPORT'] },
    }
    if (empresaId) {
      where.metadata = { path: ['empresaId'], equals: empresaId }
    }

    const [operations, total] = await Promise.all([
      prisma.bulkOperation.findMany({
        where,
        skip,
        take,
        orderBy: { startDate: 'desc' },
      }),
      prisma.bulkOperation.count({ where }),
    ])

    const meta = PaginationHelper.getMeta(validPage, validLimit, total)
    return { data: operations, ...meta }
  }

  async getOperation(operationId: string) {
    const operation = await prisma.bulkOperation.findUnique({
      where: { id: operationId },
    })
    if (!operation) throw new NotFoundError('Operación no encontrada')
    return operation
  }

  async deleteOperation(operationId: string): Promise<void> {
    const operation = await prisma.bulkOperation.findUnique({
      where: { id: operationId },
    })
    if (!operation) throw new NotFoundError('Operación no encontrada')
    await prisma.bulkOperation.delete({ where: { id: operationId } })
    logger.info('Stock bulk operation deleted', { operationId })
  }

  // ─── Private helpers ───────────────────────────────────────────────────────

  /** Normalize a CSV value: trim, remove surrounding quotes, return undefined if empty */
  private norm(v: any): string | undefined {
    if (v === undefined || v === null) return undefined
    let s = String(v).trim()
    if (s.startsWith('"') && s.endsWith('"')) s = s.slice(1, -1)
    return s === '' ? undefined : s
  }

  private parseNumber(v: any): number | undefined {
    if (v === undefined || v === null) return undefined
    const s = String(v).replace(/[^0-9.,-]/g, '').replace(/,/g, '.')
    const n = parseFloat(s)
    return Number.isNaN(n) ? undefined : n
  }

  private parsePositiveNumber(v: any): number | undefined {
    const n = this.parseNumber(v)
    return n !== undefined && n > 0 ? n : undefined
  }

  /** Generate a unique movement number with a given prefix */
  private generateMovementNumber(prefix: string): string {
    const ts = Date.now().toString(36).toUpperCase()
    const rnd = Math.random().toString(36).slice(2, 6).toUpperCase()
    return `${prefix}-${ts}-${rnd}`
  }

  /**
   * Weighted average cost calculation:
   * newAvg = (existingCost * existingQty + newCost * newQty) / (existingQty + newQty)
   */
  private calcNewAverageCost(
    existingCost: number,
    existingQty: number,
    newCost: number,
    newQty: number
  ): number {
    const total = existingQty + newQty
    if (total === 0) return 0
    return (existingCost * existingQty + newCost * newQty) / total
  }

  /**
   * RFC 4180-compliant CSV parser (same as items bulk service).
   */
  private parseCSV(content: string): Record<string, string>[] {
    const parseRow = (line: string): string[] => {
      const values: string[] = []
      let field = ''
      let inQuotes = false
      for (let i = 0; i < line.length; i++) {
        const ch = line[i]
        if (ch === '"') {
          if (inQuotes && line[i + 1] === '"') { field += '"'; i++ }
          else { inQuotes = !inQuotes }
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

    const lines: string[] = []
    let current = ''
    let inQ = false
    for (let i = 0; i < content.length; i++) {
      const ch = content[i]
      if (ch === '"') {
        if (inQ && content[i + 1] === '"') { current += '""'; i++ }
        else { inQ = !inQ; current += ch }
      } else if ((ch === '\n' || (ch === '\r' && content[i + 1] === '\n')) && !inQ) {
        if (ch === '\r') i++
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

  private toCSV(records: any[], columns?: string[]): string {
    const defaultKeys = Object.keys(records[0] ?? {})
    const keys = columns ?? defaultKeys
    const header = keys.join(',')
    if (records.length === 0) return header
    const rows = records.map((rec) => keys.map((k) => rec[k] ?? '').join(','))
    return [header, ...rows].join('\n')
  }
}
