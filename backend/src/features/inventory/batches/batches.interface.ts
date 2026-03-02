// backend/src/features/inventory/batches/batches.interface.ts

export enum BatchStatus {
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  EXPIRING_SOON = 'EXPIRING_SOON',
  INACTIVE = 'INACTIVE',
}

export interface IBatch {
  id: string
  batchNumber: string
  itemId: string
  manufacturingDate?: Date | null
  expiryDate?: Date | null
  initialQuantity: number
  currentQuantity: number
  isActive: boolean
  notes?: string | null
  createdAt: Date
  updatedAt: Date
}

export interface IBatchWithRelations extends IBatch {
  item?: any
  movements?: any[]
  preInvoiceItems?: any[]
  exitNoteItems?: any[]
}

export interface ICreateBatchInput {
  batchNumber: string
  itemId: string
  manufacturingDate?: Date | null
  expiryDate?: Date | null
  initialQuantity: number
  notes?: string | null
}

export interface IUpdateBatchInput {
  currentQuantity?: number
  notes?: string | null
  isActive?: boolean
}

export interface IBatchFilters {
  itemId?: string
  batchNumber?: string
  isActive?: boolean
  expiryDateFrom?: Date
  expiryDateTo?: Date
  status?: BatchStatus
  warehouseId?: string
}

export interface IBatchExpiryInfo {
  batchId: string
  batchNumber: string
  itemId: string
  itemName?: string
  expiryDate: Date
  daysUntilExpiry: number
  currentQuantity: number
  status: BatchStatus
}
