// backend/src/features/inventory/items/bulk/bulk.dto.ts

import {
  IBulkOperation,
  IBulkImportInput,
  IBulkExportInput,
  IBulkUpdateInput,
  IBulkDeleteInput,
  IBulkOperationResult,
  IBulkImportResult,
} from './bulk.interface'

export class BulkOperationDTO {
  id: string
  operationType: 'import' | 'export' | 'update' | 'delete'
  status: 'pending' | 'processing' | 'completed' | 'failed'
  fileName?: string
  fileUrl?: string
  totalRecords: number
  processedRecords: number
  errorRecords: number
  startDate: Date
  endDate?: Date
  createdBy: string

  constructor(data: IBulkOperation) {
    this.id = data.id
    this.operationType = data.operationType
    this.status = data.status
    this.totalRecords = data.totalRecords
    this.processedRecords = data.processedRecords
    this.errorRecords = data.errorRecords
    this.startDate = data.startDate
    this.createdBy = data.createdBy

    if (data.fileName !== undefined) this.fileName = data.fileName
    if (data.fileUrl !== undefined) this.fileUrl = data.fileUrl
    if (data.endDate !== undefined) this.endDate = data.endDate
  }
}

export class BulkImportDTO {
  fileName: string
  fileContent: string
  mapping?: any
  options?: any

  constructor(data: IBulkImportInput) {
    this.fileName = data.fileName
    this.fileContent = data.fileContent

    if (data.mapping !== undefined) this.mapping = data.mapping
    if (data.options !== undefined) this.options = data.options
  }
}

export class BulkExportDTO {
  filters?: any
  columns?: string[]
  format: 'csv' | 'json' | 'excel'

  constructor(data: IBulkExportInput) {
    this.format = data.format ?? 'csv'

    if (data.filters !== undefined) this.filters = data.filters
    if (data.columns !== undefined) this.columns = data.columns
  }
}

export class BulkUpdateDTO {
  filter: any
  update: any
  options?: any

  constructor(data: IBulkUpdateInput) {
    this.filter = data.filter
    this.update = data.update

    if (data.options !== undefined) this.options = data.options
  }
}

export class BulkDeleteDTO {
  filter: any
  permanent: boolean

  constructor(data: IBulkDeleteInput) {
    this.filter = data.filter
    this.permanent = data.permanent ?? false
  }
}

export class BulkOperationResultDTO {
  operationId: string
  status: string
  totalRecords: number
  processedRecords: number
  errorRecords: number
  successRecords: number

  constructor(data: IBulkOperationResult) {
    this.operationId = data.operationId
    this.status = data.status
    this.totalRecords = data.totalRecords
    this.processedRecords = data.processedRecords
    this.errorRecords = data.errorRecords
    this.successRecords = data.totalRecords - data.errorRecords
  }
}

export class BulkImportResultDTO {
  operationId: string
  imported: number
  updated: number
  failed: number
  errors?: any[]

  constructor(data: IBulkImportResult) {
    this.operationId = data.operationId
    this.imported = data.imported
    this.updated = data.updated
    this.failed = data.failed

    if (data.errors !== undefined) this.errors = data.errors
  }
}
