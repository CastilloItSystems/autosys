// backend/src/features/inventory/adjustments/adjustments.dto.ts

import {
  IAdjustment,
  IAdjustmentItem,
  AdjustmentStatus,
} from './adjustments.interface'

export class CreateAdjustmentDTO {
  warehouseId: string
  reason: string
  notes?: string | null
  items: CreateAdjustmentItemDTO[]

  constructor(data: any) {
    this.warehouseId = data.warehouseId
    this.reason = data.reason
    this.notes = data.notes ?? null
    this.items = (data.items || []).map(
      (item: any) => new CreateAdjustmentItemDTO(item)
    )
  }
}

export class UpdateAdjustmentDTO {
  reason?: string
  notes?: string | null

  constructor(data: any) {
    const updateData: any = {}
    if (data.reason !== undefined) updateData.reason = data.reason
    if (data.notes !== undefined) updateData.notes = data.notes ?? null

    if (updateData.reason !== undefined) this.reason = updateData.reason
    if (updateData.notes !== undefined) this.notes = updateData.notes
  }
}

export class ApproveAdjustmentDTO {
  approvedBy: string

  constructor(data: any) {
    this.approvedBy = data.approvedBy
  }
}

export class ApplyAdjustmentDTO {
  appliedBy: string

  constructor(data: any) {
    this.appliedBy = data.appliedBy
  }
}

export class AdjustmentResponseDTO {
  id: string
  adjustmentNumber: string
  warehouseId: string
  status: AdjustmentStatus
  reason: string
  notes?: string | null
  approvedBy?: string | null
  approvedAt?: Date | null
  appliedBy?: string | null
  appliedAt?: Date | null
  createdBy: string
  createdAt: Date
  updatedAt: Date
  items?: IAdjustmentItem[]
  warehouse?: any

  constructor(
    data: IAdjustment & { items?: IAdjustmentItem[]; warehouse?: any }
  ) {
    this.id = data.id
    this.adjustmentNumber = data.adjustmentNumber
    this.warehouseId = data.warehouseId
    this.status = data.status
    this.reason = data.reason
    this.notes = data.notes ?? null
    this.approvedBy = data.approvedBy ?? null
    this.approvedAt = data.approvedAt ?? null
    this.appliedBy = data.appliedBy ?? null
    this.appliedAt = data.appliedAt ?? null
    this.createdBy = data.createdBy
    this.createdAt = data.createdAt
    this.updatedAt = data.updatedAt
    if (data.items) this.items = data.items
    if (data.warehouse) this.warehouse = data.warehouse
  }
}

export class CreateAdjustmentItemDTO {
  itemId: string
  quantityChange: number
  unitCost?: number | null
  notes?: string | null

  constructor(data: any) {
    this.itemId = data.itemId
    this.quantityChange = Number(data.quantityChange)
    this.unitCost = data.unitCost ? Number(data.unitCost) : null
    this.notes = data.notes ?? null
  }
}

export class AdjustmentItemResponseDTO {
  id: string
  adjustmentId: string
  itemId: string
  quantityChange: number
  currentQuantity: number | null | undefined
  newQuantity: number | null | undefined
  unitCost: number | null
  notes?: string | null
  createdAt: Date
  updatedAt?: Date

  constructor(data: IAdjustmentItem) {
    this.id = data.id
    this.adjustmentId = data.adjustmentId
    this.itemId = data.itemId
    this.quantityChange = data.quantityChange
    this.currentQuantity = data.currentQuantity ?? undefined
    this.newQuantity = data.newQuantity ?? undefined
    this.unitCost = data.unitCost ? Number(data.unitCost) : null
    this.notes = data.notes ?? null
    this.createdAt = data.createdAt
    if (data.updatedAt) this.updatedAt = data.updatedAt
  }
}
