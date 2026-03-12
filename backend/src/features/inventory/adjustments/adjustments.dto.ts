// backend/src/features/inventory/adjustments/adjustments.dto.ts

import {
  IAdjustment,
  IAdjustmentItem,
  IAdjustmentWithRelations,
  AdjustmentStatus,
  ICreateAdjustmentInput,
  IUpdateAdjustmentInput,
  ICreateAdjustmentItemInput,
} from './adjustments.interface.js'

// ---------------------------------------------------------------------------
// Request DTOs
// ---------------------------------------------------------------------------

export class CreateAdjustmentDTO implements ICreateAdjustmentInput {
  warehouseId: string
  reason: string
  notes?: string | null
  items: CreateAdjustmentItemDTO[]

  constructor(data: Record<string, unknown>) {
    this.warehouseId = String(data.warehouseId)
    this.reason = String(data.reason)
    if (data.notes !== undefined)
      this.notes = data.notes === null ? null : String(data.notes)
    this.items = (Array.isArray(data.items) ? data.items : []).map(
      (item) => new CreateAdjustmentItemDTO(item as Record<string, unknown>)
    )
  }
}

export class CreateAdjustmentItemDTO implements ICreateAdjustmentItemInput {
  itemId: string
  quantityChange: number
  unitCost?: number | null
  notes?: string | null

  constructor(data: Record<string, unknown>) {
    this.itemId = String(data.itemId)
    this.quantityChange = Number(data.quantityChange)
    if (data.unitCost !== undefined)
      this.unitCost = data.unitCost === null ? null : Number(data.unitCost)
    if (data.notes !== undefined)
      this.notes = data.notes === null ? null : String(data.notes)
  }
}

export class UpdateAdjustmentDTO implements IUpdateAdjustmentInput {
  reason?: string
  notes?: string | null

  constructor(data: Record<string, unknown>) {
    if (data.reason !== undefined) this.reason = String(data.reason)
    if (data.notes !== undefined)
      this.notes = data.notes === null ? null : String(data.notes)
  }
}

// ---------------------------------------------------------------------------
// Response DTOs
// ---------------------------------------------------------------------------

export class AdjustmentResponseDTO {
  id: string
  adjustmentNumber: string
  warehouseId: string
  status: AdjustmentStatus
  reason: string
  createdBy: string
  createdAt: Date
  updatedAt: Date
  notes?: string | null
  approvedBy?: string | null
  approvedAt?: Date | null
  appliedBy?: string | null
  appliedAt?: Date | null
  items?: IAdjustmentItem[]
  warehouse?: unknown

  constructor(data: IAdjustmentWithRelations) {
    this.id = data.id
    this.adjustmentNumber = data.adjustmentNumber
    this.warehouseId = data.warehouseId
    this.status = data.status
    this.reason = data.reason
    this.createdBy = data.createdBy
    this.createdAt = data.createdAt
    this.updatedAt = data.updatedAt
    // Optional fields
    if (data.notes !== undefined) this.notes = data.notes
    if (data.approvedBy !== undefined) this.approvedBy = data.approvedBy
    if (data.approvedAt !== undefined) this.approvedAt = data.approvedAt
    if (data.appliedBy !== undefined) this.appliedBy = data.appliedBy
    if (data.appliedAt !== undefined) this.appliedAt = data.appliedAt
    if (data.items !== undefined) this.items = data.items
    if (data.warehouse !== undefined) this.warehouse = data.warehouse
  }
}

export class AdjustmentItemResponseDTO {
  id: string
  adjustmentId: string
  itemId: string
  quantityChange: number
  createdAt: Date
  currentQuantity?: number | null
  newQuantity?: number | null
  unitCost?: number | null
  notes?: string | null
  item?: unknown

  constructor(data: IAdjustmentItem) {
    this.id = data.id
    this.adjustmentId = data.adjustmentId
    this.itemId = data.itemId
    this.quantityChange = data.quantityChange
    this.createdAt = data.createdAt
    // Optional fields
    if (data.currentQuantity !== undefined)
      this.currentQuantity = data.currentQuantity
    if (data.newQuantity !== undefined) this.newQuantity = data.newQuantity
    if (data.unitCost !== undefined)
      this.unitCost = data.unitCost ? Number(data.unitCost) : null
    if (data.notes !== undefined) this.notes = data.notes
    if (data.item !== undefined) this.item = data.item
  }
}
