// backend/src/features/inventory/entryNotes/entryNotes.interface.ts

export type EntryNoteStatus =
  | 'PENDING'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
export type EntryType =
  | 'PURCHASE'
  | 'RETURN'
  | 'TRANSFER'
  | 'WARRANTY_RETURN'
  | 'LOAN_RETURN'
  | 'ADJUSTMENT_IN'
  | 'DONATION'
  | 'SAMPLE'
  | 'OTHER'

export const ENTRY_NOTE_STATUSES: EntryNoteStatus[] = [
  'PENDING',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
]

export const ENTRY_TYPES: EntryType[] = [
  'PURCHASE',
  'RETURN',
  'TRANSFER',
  'WARRANTY_RETURN',
  'LOAN_RETURN',
  'ADJUSTMENT_IN',
  'DONATION',
  'SAMPLE',
  'OTHER',
]

export interface IEntryNote {
  id: string
  entryNoteNumber: string
  type: EntryType
  status: EntryNoteStatus
  purchaseOrderId?: string | null
  warehouseId: string
  catalogSupplierId?: string | null
  supplierName?: string | null
  supplierId?: string | null
  supplierPhone?: string | null
  reason?: string | null
  reference?: string | null
  notes?: string | null
  receivedAt?: Date | null
  verifiedAt?: Date | null
  receivedBy?: string | null
  verifiedBy?: string | null
  authorizedBy?: string | null
  createdAt: Date
  updatedAt: Date
}

export interface IEntryNoteWithRelations extends IEntryNote {
  purchaseOrder?: any
  warehouse?: any
  catalogSupplier?: any
  items?: IEntryNoteItem[]
  receivedByName?: string | null
}

export interface IEntryNoteItem {
  id: string
  entryNoteId: string
  itemId: string
  quantityReceived: number
  unitCost: number | string
  itemName?: string | null
  storedToLocation?: string | null
  batchId?: string | null
  serialNumberId?: string | null
  batchNumber?: string | null
  expiryDate?: Date | null
  notes?: string | null
  createdAt: Date
  item?: { id: string; sku: string; name: string } | null
  batch?: { id: string; batchNumber: string } | null
  serialNumber?: { id: string; serialNumber: string } | null
}

export interface ICreateEntryNoteInput {
  type?: EntryType
  purchaseOrderId?: string | null
  warehouseId: string
  catalogSupplierId?: string | null
  supplierName?: string | null
  supplierId?: string | null
  supplierPhone?: string | null
  reason?: string | null
  reference?: string | null
  notes?: string | null
  receivedBy?: string | null
  authorizedBy?: string | null
}

export interface IUpdateEntryNoteInput {
  status?: EntryNoteStatus
  notes?: string | null
  receivedBy?: string | null
  verifiedBy?: string | null
  authorizedBy?: string | null
  catalogSupplierId?: string | null
  supplierName?: string | null
  supplierId?: string | null
  supplierPhone?: string | null
  reason?: string | null
  reference?: string | null
}

export interface IEntryNoteFilters {
  type?: EntryType
  status?: EntryNoteStatus
  purchaseOrderId?: string
  warehouseId?: string
  catalogSupplierId?: string
  receivedBy?: string
  receivedFrom?: Date
  receivedTo?: Date
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  search?: string
}

export interface ICreateEntryNoteItemInput {
  itemId: string
  itemName?: string | null
  quantityReceived: number
  unitCost: number
  storedToLocation?: string | null
  batchId?: string | null
  serialNumberId?: string | null
  batchNumber?: string | null
  expiryDate?: Date | null
  notes?: string | null
}

export interface IEntryNoteListResult {
  entryNotes: IEntryNoteWithRelations[]
  total: number
  page: number
  limit: number
}
