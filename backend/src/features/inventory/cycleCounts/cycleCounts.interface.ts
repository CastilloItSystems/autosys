// backend/src/features/inventory/cycleCounts/cycleCounts.interface.ts

export enum CycleCountStatus {
  DRAFT = 'DRAFT',
  IN_PROGRESS = 'IN_PROGRESS',
  APPROVED = 'APPROVED',
  APPLIED = 'APPLIED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
}

export interface ICycleCount {
  id: string
  cycleCountNumber: string
  warehouseId: string
  status: CycleCountStatus
  startedBy?: string | null
  startedAt?: Date | null
  completedBy?: string | null
  completedAt?: Date | null
  approvedBy?: string | null
  approvedAt?: Date | null
  appliedBy?: string | null
  appliedAt?: Date | null
  notes?: string | null
  remarks?: string | null
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

export interface ICycleCountWithRelations extends ICycleCount {
  warehouse?: any
  items?: ICycleCountItem[]
}

export interface ICycleCountItem {
  id: string
  cycleCountId: string
  itemId: string
  expectedQuantity: number
  countedQuantity?: number | null
  variance?: number | null
  location?: string | null
  notes?: string | null
  createdAt: Date
  updatedAt?: Date
}

export interface ICreateCycleCountInput {
  warehouseId: string
  notes?: string | null
  items: ICreateCycleCountItemInput[]
}

export interface IUpdateCycleCountInput {
  notes?: string | null
  remarks?: string | null
}

export interface IStartCycleCountInput {
  startedBy: string
}

export interface ICompleteCycleCountInput {
  completedBy: string
}

export interface IApproveCycleCountInput {
  approvedBy: string
}

export interface IApplyCycleCountInput {
  appliedBy: string
}

export interface ICreateCycleCountItemInput {
  itemId: string
  expectedQuantity: number
  location?: string | null
  notes?: string | null
}

export interface ICycleCountFilters {
  warehouseId?: string
  status?: CycleCountStatus
  notes?: string
  startDateFrom?: Date
  startDateTo?: Date
  completedDateFrom?: Date
  completedDateTo?: Date
}
