// backend/src/features/inventory/entryNotes/entryNotes.dto.ts

import {
  IEntryNote,
  IEntryNoteItem,
  EntryType,
  EntryNoteStatus,
} from './entryNotes.interface'

export class CreateEntryNoteDTO {
  type: EntryType
  purchaseOrderId?: string | null
  warehouseId: string
  supplierName?: string | null
  supplierId?: string | null
  supplierPhone?: string | null
  reason?: string | null
  reference?: string | null
  notes?: string | null
  receivedBy?: string | null
  authorizedBy?: string | null

  constructor(data: any) {
    this.type = data.type || 'PURCHASE'
    this.purchaseOrderId = data.purchaseOrderId ?? null
    this.warehouseId = data.warehouseId
    this.supplierName = data.supplierName ?? null
    this.supplierId = data.supplierId ?? null
    this.supplierPhone = data.supplierPhone ?? null
    this.reason = data.reason ?? null
    this.reference = data.reference ?? null
    this.notes = data.notes ?? null
    this.receivedBy = data.receivedBy ?? null
    this.authorizedBy = data.authorizedBy ?? null
  }
}

export class UpdateEntryNoteDTO {
  status?: EntryNoteStatus
  notes?: string | null
  receivedBy?: string | null
  verifiedBy?: string | null
  authorizedBy?: string | null
  supplierName?: string | null
  supplierId?: string | null
  supplierPhone?: string | null
  reason?: string | null
  reference?: string | null

  constructor(data: any) {
    if (data.status !== undefined) this.status = data.status
    if (data.notes !== undefined) this.notes = data.notes ?? null
    if (data.receivedBy !== undefined) this.receivedBy = data.receivedBy ?? null
    if (data.verifiedBy !== undefined) this.verifiedBy = data.verifiedBy ?? null
    if (data.authorizedBy !== undefined)
      this.authorizedBy = data.authorizedBy ?? null
    if (data.supplierName !== undefined)
      this.supplierName = data.supplierName ?? null
    if (data.supplierId !== undefined) this.supplierId = data.supplierId ?? null
    if (data.supplierPhone !== undefined)
      this.supplierPhone = data.supplierPhone ?? null
    if (data.reason !== undefined) this.reason = data.reason ?? null
    if (data.reference !== undefined) this.reference = data.reference ?? null
  }
}

export class EntryNoteResponseDTO {
  id: string
  entryNoteNumber: string
  type: EntryType
  status: EntryNoteStatus
  purchaseOrderId?: string | null
  warehouseId: string
  supplierName?: string | null
  supplierId?: string | null
  supplierPhone?: string | null
  reason?: string | null
  reference?: string | null
  notes?: string | null
  receivedAt?: Date | null
  verifiedAt?: Date | null
  receivedBy?: string | null
  receivedByName?: string | null
  verifiedBy?: string | null
  authorizedBy?: string | null
  createdAt: Date
  updatedAt: Date
  purchaseOrder?: any
  warehouse?: any
  items?: any[]

  constructor(
    data: IEntryNote & {
      purchaseOrder?: any
      warehouse?: any
      items?: any[]
      receivedByName?: string | null
    }
  ) {
    this.id = data.id
    this.entryNoteNumber = data.entryNoteNumber
    this.type = data.type
    this.status = data.status
    this.purchaseOrderId = data.purchaseOrderId ?? null
    this.warehouseId = data.warehouseId
    this.supplierName = data.supplierName ?? null
    this.supplierId = data.supplierId ?? null
    this.supplierPhone = data.supplierPhone ?? null
    this.reason = data.reason ?? null
    this.reference = data.reference ?? null
    this.notes = data.notes ?? null
    this.receivedAt = data.receivedAt ?? null
    this.verifiedAt = data.verifiedAt ?? null
    this.receivedBy = data.receivedBy ?? null
    this.receivedByName = (data as any).receivedByName ?? null
    this.verifiedBy = data.verifiedBy ?? null
    this.authorizedBy = data.authorizedBy ?? null
    this.createdAt = data.createdAt
    this.updatedAt = data.updatedAt
    if (data.purchaseOrder) this.purchaseOrder = data.purchaseOrder
    if (data.warehouse) this.warehouse = data.warehouse
    if (data.items) {
      this.items = data.items.map((item) => new EntryNoteItemResponseDTO(item))
    }
  }
}

export class CreateEntryNoteItemDTO {
  itemId: string
  quantityReceived: number
  unitCost: number
  storedToLocation?: string | null
  batchId?: string | null
  serialNumberId?: string | null
  batchNumber?: string | null
  expiryDate?: Date | null
  notes?: string | null

  constructor(data: any) {
    this.itemId = data.itemId
    this.quantityReceived = Number(data.quantityReceived)
    this.unitCost = Number(data.unitCost)
    this.storedToLocation = data.storedToLocation ?? null
    this.batchId = data.batchId ?? null
    this.serialNumberId = data.serialNumberId ?? null
    this.batchNumber = data.batchNumber ?? null
    this.expiryDate = data.expiryDate ? new Date(data.expiryDate) : null
    this.notes = data.notes ?? null
  }
}

export class EntryNoteItemResponseDTO {
  id: string
  entryNoteId: string
  itemId: string
  quantityReceived: number
  unitCost: number | string
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

  constructor(
    data: IEntryNoteItem & { item?: any; batch?: any; serialNumber?: any }
  ) {
    this.id = data.id
    this.entryNoteId = data.entryNoteId
    this.itemId = data.itemId
    this.quantityReceived = data.quantityReceived
    this.unitCost = data.unitCost
    this.storedToLocation = data.storedToLocation ?? null
    this.batchId = data.batchId ?? null
    this.serialNumberId = data.serialNumberId ?? null
    this.batchNumber = data.batchNumber ?? null
    this.expiryDate = data.expiryDate ?? null
    this.notes = data.notes ?? null
    this.createdAt = data.createdAt
    if (data.item) this.item = data.item
    if (data.batch) this.batch = data.batch
    if (data.serialNumber) this.serialNumber = data.serialNumber
  }
}
