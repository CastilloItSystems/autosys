// backend/src/features/inventory/stock/bulk/bulk.interface.ts

export type StockBulkOperationType =
  | 'STOCK_IMPORT'
  | 'STOCK_ADJUSTMENT'
  | 'STOCK_TRANSFER'
  | 'STOCK_EXPORT'

// ─── CSV row shapes ───────────────────────────────────────────────────────────

/**
 * CSV row for STOCK_IMPORT: creates/sets stock levels and records ADJUSTMENT_IN movements.
 * Columns: sku, warehouseCode, quantity, unitCost, location, notes
 */
export interface IStockImportRow {
  sku: string
  warehouseCode: string
  quantity: number       // must be > 0
  unitCost?: number      // updates averageCost on the stock record
  location?: string      // bin location (e.g. "A1-R01-D01")
  notes?: string
}

/**
 * CSV row for STOCK_ADJUSTMENT: adjusts existing stock and records the appropriate movement.
 * Columns: sku, warehouseCode, quantity, movementType, reference, notes
 *
 * quantity > 0 → entry  (default movementType: ADJUSTMENT_IN)
 * quantity < 0 → exit   (default movementType: ADJUSTMENT_OUT)
 * Explicit movementType: ADJUSTMENT_IN | ADJUSTMENT_OUT | PURCHASE |
 *   SUPPLIER_RETURN | WORKSHOP_RETURN | LOAN_OUT | LOAN_RETURN
 */
export interface IStockAdjustmentRow {
  sku: string
  warehouseCode: string
  quantity: number        // positive = entry, negative = exit
  movementType?: string
  reference?: string
  notes?: string
}

/**
 * CSV row for STOCK_TRANSFER: moves stock between warehouses and records TRANSFER movements.
 * Columns: sku, fromWarehouseCode, toWarehouseCode, quantity, notes
 */
export interface IStockTransferRow {
  sku: string
  fromWarehouseCode: string
  toWarehouseCode: string
  quantity: number        // must be > 0
  notes?: string
}

// ─── Export input ─────────────────────────────────────────────────────────────

export interface IStockExportInput {
  filters?: {
    warehouseId?: string
    itemId?: string
    categoryId?: string
    minQuantity?: number
    maxQuantity?: number
    lowStock?: boolean
    outOfStock?: boolean
  }
  columns?: string[]
  format?: 'csv' | 'json' | 'xlsx'
}

// ─── Result types ─────────────────────────────────────────────────────────────

export interface IStockBulkError {
  rowNumber: number
  sku?: string
  warehouseCode?: string
  error: string
}

export interface IStockBulkResult {
  operationId: string
  processed: number
  failed: number
  errors: IStockBulkError[]
}
