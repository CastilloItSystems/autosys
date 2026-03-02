// backend/src/features/inventory/reconciliations/reconciliations.interface.ts

export enum ReconciliationStatus {
  DRAFT = 'DRAFT',
  IN_PROGRESS = 'IN_PROGRESS',
  APPROVED = 'APPROVED',
  APPLIED = 'APPLIED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
}

export enum ReconciliationSource {
  CYCLE_COUNT = 'CYCLE_COUNT',
  PHYSICAL_INVENTORY = 'PHYSICAL_INVENTORY',
  SYSTEM_ERROR = 'SYSTEM_ERROR',
  ADJUSTMENT = 'ADJUSTMENT',
  OTHER = 'OTHER',
}

export interface IReconciliation {
  id: string
  reconciliationNumber: string
  warehouseId: string
  status: ReconciliationStatus
  source: ReconciliationSource
  startedBy?: string | null
  startedAt?: Date | null
  completedBy?: string | null
  completedAt?: Date | null
  approvedBy?: string | null
  approvedAt?: Date | null
  appliedBy?: string | null
  appliedAt?: Date | null
  reason: string
  notes?: string | null
  remarks?: string | null
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

export interface IReconciliationWithRelations extends IReconciliation {
  warehouse?: any
  items?: IReconciliationItem[]
}

export interface IReconciliationItem {
  id: string
  reconciliationId: string
  itemId: string
  systemQuantity: number
  expectedQuantity: number
  difference: number
  notes?: string | null
  createdAt: Date
  updatedAt?: Date
}

export interface ICreateReconciliationInput {
  warehouseId: string
  source: ReconciliationSource
  reason: string
  notes?: string | null
  items: ICreateReconciliationItemInput[]
}

export interface IUpdateReconciliationInput {
  reason?: string
  notes?: string | null
  remarks?: string | null
}

export interface IStartReconciliationInput {
  startedBy: string
}

export interface ICompleteReconciliationInput {
  completedBy: string
}

export interface IApproveReconciliationInput {
  approvedBy: string
}

export interface IApplyReconciliationInput {
  appliedBy: string
}

export interface ICreateReconciliationItemInput {
  itemId: string
  systemQuantity: number
  expectedQuantity: number
  notes?: string | null
}

export interface IReconciliationFilters {
  warehouseId?: string
  status?: ReconciliationStatus
  source?: ReconciliationSource
  reason?: string
  startDateFrom?: Date
  startDateTo?: Date
  completedDateFrom?: Date
  completedDateTo?: Date
}
