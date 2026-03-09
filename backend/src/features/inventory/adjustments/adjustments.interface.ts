// backend/src/features/inventory/adjustments/adjustments.interface.ts

export enum AdjustmentStatus {
  DRAFT = 'DRAFT',
  APPROVED = 'APPROVED',
  APPLIED = 'APPLIED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
}

export interface IAdjustment {
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
}

export interface IAdjustmentWithRelations extends IAdjustment {
  items?: IAdjustmentItem[]
  warehouse?: any
}

export interface IAdjustmentItem {
  id: string
  adjustmentId: string
  itemId: string
  quantityChange: number
  currentQuantity: number | null | undefined
  newQuantity: number | null | undefined
  unitCost?: any
  notes?: string | null
  createdAt: Date
  updatedAt?: Date
  item?: {
    id: string
    sku: string
    name: string
    [key: string]: any
  }
}

export interface ICreateAdjustmentInput {
  warehouseId: string
  reason: string
  notes?: string | null
  items: ICreateAdjustmentItemInput[]
}

export interface IUpdateAdjustmentInput {
  reason?: string
  notes?: string | null
}

export interface IApproveAdjustmentInput {
  approvedBy: string
}

export interface IApplyAdjustmentInput {
  appliedBy: string
}

export interface IAdjustmentFilters {
  warehouseId?: string
  status?: AdjustmentStatus
  reason?: string
  createdFrom?: Date
  createdTo?: Date
  approvedFrom?: Date
  approvedTo?: Date
}

export interface ICreateAdjustmentItemInput {
  itemId: string
  quantityChange: number
  unitCost?: number | null
  notes?: string | null
}
