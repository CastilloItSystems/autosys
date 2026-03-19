// backend/src/features/inventory/entryNotes/entryNotes.dto.ts

import {
  IEntryNote,
  IEntryNoteItem,
  IEntryNoteWithRelations,
  EntryType,
  EntryNoteStatus,
} from './entryNotes.interface.js'

// ---------------------------------------------------------------------------
// Input DTOs
// ---------------------------------------------------------------------------

export class CreateEntryNoteDTO {
  type: EntryType
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

  constructor(data: Record<string, unknown>) {
    this.type = (data.type as EntryType) ?? 'PURCHASE'
    this.warehouseId = String(data.warehouseId)
    this.purchaseOrderId = data.purchaseOrderId
      ? String(data.purchaseOrderId)
      : null
    this.catalogSupplierId = data.catalogSupplierId
      ? String(data.catalogSupplierId)
      : null
    this.supplierName = data.supplierName ? String(data.supplierName) : null
    this.supplierId = data.supplierId ? String(data.supplierId) : null
    this.supplierPhone = data.supplierPhone ? String(data.supplierPhone) : null
    this.reason = data.reason ? String(data.reason) : null
    this.reference = data.reference ? String(data.reference) : null
    this.notes = data.notes ? String(data.notes) : null
    this.receivedBy = data.receivedBy ? String(data.receivedBy) : null
    this.authorizedBy = data.authorizedBy ? String(data.authorizedBy) : null
  }
}

export class UpdateEntryNoteDTO {
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

  constructor(data: Record<string, unknown>) {
    if (data.status !== undefined) this.status = data.status as EntryNoteStatus
    if (data.notes !== undefined)
      this.notes = data.notes ? String(data.notes) : null
    if (data.receivedBy !== undefined)
      this.receivedBy = data.receivedBy ? String(data.receivedBy) : null
    if (data.verifiedBy !== undefined)
      this.verifiedBy = data.verifiedBy ? String(data.verifiedBy) : null
    if (data.authorizedBy !== undefined)
      this.authorizedBy = data.authorizedBy ? String(data.authorizedBy) : null
    if (data.catalogSupplierId !== undefined)
      this.catalogSupplierId = data.catalogSupplierId
        ? String(data.catalogSupplierId)
        : null
    if (data.supplierName !== undefined)
      this.supplierName = data.supplierName ? String(data.supplierName) : null
    if (data.supplierId !== undefined)
      this.supplierId = data.supplierId ? String(data.supplierId) : null
    if (data.supplierPhone !== undefined)
      this.supplierPhone = data.supplierPhone
        ? String(data.supplierPhone)
        : null
    if (data.reason !== undefined)
      this.reason = data.reason ? String(data.reason) : null
    if (data.reference !== undefined)
      this.reference = data.reference ? String(data.reference) : null
  }
}

export class CreateEntryNoteItemDTO {
  itemId: string
  quantityReceived: number
  unitCost: number
  itemName?: string | null
  storedToLocation?: string | null
  batchId?: string | null
  serialNumberId?: string | null
  batchNumber?: string | null
  expiryDate?: Date | null
  notes?: string | null

  constructor(data: Record<string, unknown>) {
    this.itemId = String(data.itemId)
    this.quantityReceived = Number(data.quantityReceived)
    this.unitCost = Number(data.unitCost)
    this.itemName = data.itemName ? String(data.itemName) : null
    this.storedToLocation = data.storedToLocation
      ? String(data.storedToLocation)
      : null
    this.batchId = data.batchId ? String(data.batchId) : null
    this.serialNumberId = data.serialNumberId
      ? String(data.serialNumberId)
      : null
    this.batchNumber = data.batchNumber ? String(data.batchNumber) : null
    this.expiryDate = data.expiryDate
      ? new Date(data.expiryDate as string)
      : null
    this.notes = data.notes ? String(data.notes) : null
  }
}

// ---------------------------------------------------------------------------
// Response DTOs
// ---------------------------------------------------------------------------

export class EntryNoteResponseDTO {
  id: string
  entryNoteNumber: string
  type: EntryType
  status: EntryNoteStatus
  purchaseOrderId: string | null
  warehouseId: string
  catalogSupplierId: string | null
  supplierName: string | null
  supplierId: string | null
  supplierPhone: string | null
  reason: string | null
  reference: string | null
  notes: string | null
  receivedAt: Date | null
  verifiedAt: Date | null
  receivedBy: string | null
  verifiedBy: string | null
  authorizedBy: string | null
  createdAt: Date
  updatedAt: Date
  purchaseOrder?: unknown
  warehouse?: unknown
  catalogSupplier?: unknown
  items?: EntryNoteItemResponseDTO[]

  constructor(data: IEntryNoteWithRelations) {
    this.id = data.id
    this.entryNoteNumber = data.entryNoteNumber
    this.type = data.type
    this.status = data.status
    this.purchaseOrderId = data.purchaseOrderId ?? null
    this.warehouseId = data.warehouseId
    this.catalogSupplierId = data.catalogSupplierId ?? null
    this.supplierName = data.supplierName ?? null
    this.supplierId = data.supplierId ?? null
    this.supplierPhone = data.supplierPhone ?? null
    this.reason = data.reason ?? null
    this.reference = data.reference ?? null
    this.notes = data.notes ?? null
    this.receivedAt = data.receivedAt ?? null
    this.verifiedAt = data.verifiedAt ?? null
    this.receivedBy = data.receivedBy ?? null
    this.verifiedBy = data.verifiedBy ?? null
    this.authorizedBy = data.authorizedBy ?? null
    this.createdAt = data.createdAt
    this.updatedAt = data.updatedAt

    if (data.purchaseOrder !== undefined)
      this.purchaseOrder = data.purchaseOrder
    if (data.warehouse !== undefined) this.warehouse = data.warehouse
    if (data.catalogSupplier !== undefined)
      this.catalogSupplier = data.catalogSupplier
    if (data.items !== undefined) {
      this.items = data.items.map((item) => new EntryNoteItemResponseDTO(item))
    }
  }
}

export class EntryNoteItemResponseDTO {
  id: string
  entryNoteId: string
  itemId: string
  quantityReceived: number
  unitCost: number
  itemName: string | null
  storedToLocation: string | null
  batchId: string | null
  serialNumberId: string | null
  batchNumber: string | null
  expiryDate: Date | null
  notes: string | null
  createdAt: Date
  item?: IEntryNoteItem['item']
  batch?: IEntryNoteItem['batch']
  serialNumber?: IEntryNoteItem['serialNumber']

  constructor(data: IEntryNoteItem) {
    this.id = data.id
    this.entryNoteId = data.entryNoteId
    this.itemId = data.itemId
    this.quantityReceived = data.quantityReceived
    this.unitCost =
      typeof data.unitCost === 'number'
        ? data.unitCost
        : parseFloat(String(data.unitCost))
    this.itemName = data.itemName ?? null
    this.storedToLocation = data.storedToLocation ?? null
    this.batchId = data.batchId ?? null
    this.serialNumberId = data.serialNumberId ?? null
    this.batchNumber = data.batchNumber ?? null
    this.expiryDate = data.expiryDate ?? null
    this.notes = data.notes ?? null
    this.createdAt = data.createdAt
    if (data.item !== undefined) this.item = data.item
    if (data.batch !== undefined) this.batch = data.batch
    if (data.serialNumber !== undefined) this.serialNumber = data.serialNumber
  }
}
