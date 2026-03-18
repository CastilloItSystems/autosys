// backend/src/features/inventory/items/bulk/bulk.interface.ts

export interface IBulkOperation {
  id: string
  operationType: 'IMPORT' | 'EXPORT' | 'UPDATE' | 'DELETE'
  status:
    | 'PENDING'
    | 'PROCESSING'
    | 'COMPLETED'
    | 'COMPLETED_WITH_ERRORS'
    | 'FAILED'
    | 'CANCELLED'
  fileName?: string
  fileUrl?: string
  totalRecords: number
  processedRecords: number
  errorRecords: number
  errorDetails?: string
  startDate: Date
  endDate?: Date
  createdBy: string
  metadata?: Record<string, unknown>
}

export interface IBulkImportData {
  sku: string
  name: string
  description?: string
  categoryId?: string
  unitId?: string
  costPrice: number
  salePrice: number
  wholesalePrice?: number
  stock: number
  minStock?: number
  barcode?: string
  identity?: string
  location?: string
  [key: string]: any
}

export interface IBulkImportInput {
  fileName: string
  fileContent: string // CSV content
  mapping?: IColumnMapping
  options?: {
    skipHeaderRow?: boolean
    updateExisting?: boolean
    validateOnly?: boolean
  }
}

export interface IColumnMapping {
  [csvColumn: string]: string // Maps CSV columns to DB fields
}

export interface IBulkExportInput {
  filters?: IBulkExportFilters
  columns?: string[]
  format?: 'csv' | 'json' | 'xlsx'
}

export interface IBulkExportFilters {
  categoryId?: string
  brandId?: string
  minPrice?: number
  maxPrice?: number
  inStock?: boolean
  isActive?: boolean
  createdAfter?: Date
  createdBefore?: Date
}

export interface IBulkExportResult {
  fileUrl: string
  fileName: string
  format: string
  recordCount: number
  generatedAt: Date
}

export interface IBulkUpdateInput {
  filter: any // MongoDB-like query filter
  update: any // Fields to update
  options?: {
    validateOnly?: boolean
    skipValidation?: boolean
  }
}

export interface IBulkUpdateResult {
  modifiedCount: number
  matchedCount: number
  upsertedCount: number
}

export interface IBulkDeleteInput {
  filter: any
  permanent?: boolean // Soft delete vs hard delete
}

export interface IBulkDeleteResult {
  deletedCount: number
}

export interface IBulkOperationResult {
  operationId: string
  status: string
  totalRecords: number
  processedRecords: number
  errorRecords: number
  successRecords: number
  errorDetails?: any[]
}

export interface IBulkValidationError {
  rowNumber?: number
  field: string
  value: any
  error: string
}

export interface IBulkImportResult {
  operationId: string
  imported: number
  updated: number
  failed: number
  errors: IBulkValidationError[]
}
