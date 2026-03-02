// backend/src/features/inventory/reconciliations/reconciliations.dto.ts

import {
  IReconciliation,
  IReconciliationItem,
  IReconciliationWithRelations,
  ReconciliationSource,
} from './reconciliations.interface'

export class CreateReconciliationDTO {
  warehouseId: string
  source: ReconciliationSource
  reason: string
  notes?: string | null
  items: CreateReconciliationItemDTO[]

  constructor(data: any) {
    this.warehouseId = data.warehouseId
    this.source = data.source as ReconciliationSource
    this.reason = data.reason
    this.notes = data.notes ?? null
    this.items =
      data.items?.map((item: any) => new CreateReconciliationItemDTO(item)) ?? []
  }
}

export class UpdateReconciliationDTO {
  reason?: string
  notes?: string | null
  remarks?: string | null

  constructor(data: any) {
    const updateData = {
      ...(data.reason !== undefined && { reason: data.reason }),
      ...(data.notes !== undefined && { notes: data.notes }),
      ...(data.remarks !== undefined && { remarks: data.remarks }),
    }
    Object.assign(this, updateData)
  }
}

export class StartReconciliationDTO {
  startedBy: string

  constructor(data: any) {
    this.startedBy = data.startedBy
  }
}

export class CompleteReconciliationDTO {
  completedBy: string

  constructor(data: any) {
    this.completedBy = data.completedBy
  }
}

export class ApproveReconciliationDTO {
  approvedBy: string

  constructor(data: any) {
    this.approvedBy = data.approvedBy
  }
}

export class ApplyReconciliationDTO {
  appliedBy: string

  constructor(data: any) {
    this.appliedBy = data.appliedBy
  }
}

export class CreateReconciliationItemDTO {
  itemId: string
  systemQuantity: number
  expectedQuantity: number
  notes?: string | null

  constructor(data: any) {
    this.itemId = data.itemId
    this.systemQuantity = Number(data.systemQuantity)
    this.expectedQuantity = Number(data.expectedQuantity)
    this.notes = data.notes ?? null
  }
}

export class ReconciliationResponseDTO {
  id: string
  reconciliationNumber: string
  warehouseId: string
  status: string
  source: string
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
  warehouse?: any
  items?: ReconciliationItemResponseDTO[]
  createdBy: string
  createdAt: Date
  updatedAt: Date

  constructor(data: IReconciliationWithRelations) {
    this.id = data.id
    this.reconciliationNumber = data.reconciliationNumber
    this.warehouseId = data.warehouseId
    this.status = data.status
    this.source = data.source
    this.startedBy = data.startedBy ?? null
    this.startedAt = data.startedAt ?? null
    this.completedBy = data.completedBy ?? null
    this.completedAt = data.completedAt ?? null
    this.approvedBy = data.approvedBy ?? null
    this.approvedAt = data.approvedAt ?? null
    this.appliedBy = data.appliedBy ?? null
    this.appliedAt = data.appliedAt ?? null
    this.reason = data.reason
    this.notes = data.notes ?? null
    this.remarks = data.remarks ?? null
    this.createdBy = data.createdBy
    this.createdAt = data.createdAt
    this.updatedAt = data.updatedAt ?? new Date()
    if (data.warehouse) this.warehouse = data.warehouse
    if (data.items)
      this.items = data.items.map((item) => new ReconciliationItemResponseDTO(item))
  }
}

export class ReconciliationItemResponseDTO {
  id: string
  reconciliationId: string
  itemId: string
  systemQuantity: number
  expectedQuantity: number
  difference: number
  notes?: string | null
  createdAt: Date
  updatedAt?: Date

  constructor(data: IReconciliationItem) {
    this.id = data.id
    this.reconciliationId = data.reconciliationId
    this.itemId = data.itemId
    this.systemQuantity = data.systemQuantity
    this.expectedQuantity = data.expectedQuantity
    this.difference = data.difference
    this.notes = data.notes ?? null
    this.createdAt = data.createdAt
    if (data.updatedAt) this.updatedAt = data.updatedAt
  }
}
