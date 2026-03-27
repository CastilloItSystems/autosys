// backend/src/features/inventory/stock/bulk/bulk.dto.ts

import {
  IStockBulkResult,
  IStockBulkError,
  StockBulkOperationType,
} from './bulk.interface.js'

export class StockBulkResultDTO implements IStockBulkResult {
  operationId: string
  processed: number
  failed: number
  errors: IStockBulkError[]

  constructor(data: IStockBulkResult) {
    this.operationId = data.operationId
    this.processed = data.processed
    this.failed = data.failed
    this.errors = data.errors
  }
}

export class StockBulkOperationDTO {
  id: string
  operationType: StockBulkOperationType
  status: string
  fileName?: string
  totalRecords: number
  processedRecords: number
  errorRecords: number
  errorDetails?: string
  startDate: Date
  endDate?: Date
  createdBy: string

  constructor(data: any) {
    this.id = data.id
    this.operationType = data.operationType
    this.status = data.status
    this.fileName = data.fileName
    this.totalRecords = data.totalRecords
    this.processedRecords = data.processedRecords
    this.errorRecords = data.errorRecords
    this.errorDetails = data.errorDetails
    this.startDate = data.startDate
    this.endDate = data.endDate
    this.createdBy = data.createdBy
  }
}
