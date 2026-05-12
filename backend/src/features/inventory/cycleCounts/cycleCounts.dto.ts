// backend/src/features/inventory/cycleCounts/cycleCounts.dto.ts

import {
  ICycleCount,
  ICycleCountItem,
  ICycleCountWithRelations,
} from './cycleCounts.interface.js'

export class CreateCycleCountDTO {
  warehouseId: string
  notes?: string | null
  items: CreateCycleCountItemDTO[]

  constructor(data: any) {
    this.warehouseId = data.warehouseId
    this.notes = data.notes ?? null
    this.items =
      data.items?.map((item: any) => new CreateCycleCountItemDTO(item)) ?? []
  }
}

export class UpdateCycleCountDTO {
  notes?: string | null
  remarks?: string | null
  items?: CreateCycleCountItemDTO[]

  constructor(data: any) {
    this.notes = data.notes ?? null
    this.remarks = data.remarks ?? null
    if (data.items) {
      this.items = data.items.map(
        (item: any) => new CreateCycleCountItemDTO(item)
      )
    }
  }
}

export class StartCycleCountDTO {
  startedBy: string

  constructor(data: any) {
    this.startedBy = data.startedBy
  }
}

export class CompleteCycleCountDTO {
  completedBy: string

  constructor(data: any) {
    this.completedBy = data.completedBy
  }
}

export class ApproveCycleCountDTO {
  approvedBy: string

  constructor(data: any) {
    this.approvedBy = data.approvedBy
  }
}

export class ApplyCycleCountDTO {
  appliedBy: string

  constructor(data: any) {
    this.appliedBy = data.appliedBy
  }
}

export class CreateCycleCountItemDTO {
  itemId: string
  expectedQuantity: number
  location?: string | null
  notes?: string | null

  constructor(data: any) {
    this.itemId = data.itemId
    this.expectedQuantity = Number(data.expectedQuantity)
    this.location = data.location ?? null
    this.notes = data.notes ?? null
  }
}

export class CycleCountResponseDTO {
  id: string
  cycleCountNumber: string
  warehouseId: string
  status: string
  startedBy?: string | null
  startedByName?: string | null
  startedAt?: Date | null
  completedBy?: string | null
  completedByName?: string | null
  completedAt?: Date | null
  approvedBy?: string | null
  approvedByName?: string | null
  approvedAt?: Date | null
  appliedBy?: string | null
  appliedByName?: string | null
  appliedAt?: Date | null
  notes?: string | null
  remarks?: string | null
  warehouse?: any
  items?: CycleCountItemResponseDTO[]
  createdBy: string
  createdByName?: string | null
  createdAt: Date
  updatedAt: Date

  constructor(data: ICycleCountWithRelations & {
    createdByName?: string | null
    startedByName?: string | null
    completedByName?: string | null
    approvedByName?: string | null
    appliedByName?: string | null
  }) {
    this.id = data.id
    this.cycleCountNumber = data.cycleCountNumber
    this.warehouseId = data.warehouseId
    this.status = data.status
    this.startedBy = data.startedBy ?? null
    if (data.startedByName != null) this.startedByName = String(data.startedByName)
    this.startedAt = data.startedAt ?? null
    this.completedBy = data.completedBy ?? null
    if (data.completedByName != null) this.completedByName = String(data.completedByName)
    this.completedAt = data.completedAt ?? null
    this.approvedBy = data.approvedBy ?? null
    if (data.approvedByName != null) this.approvedByName = String(data.approvedByName)
    this.approvedAt = data.approvedAt ?? null
    this.appliedBy = data.appliedBy ?? null
    if (data.appliedByName != null) this.appliedByName = String(data.appliedByName)
    this.appliedAt = data.appliedAt ?? null
    this.notes = data.notes ?? null
    this.remarks = data.remarks ?? null
    this.createdBy = data.createdBy
    if (data.createdByName != null) this.createdByName = String(data.createdByName)
    this.createdAt = data.createdAt
    this.updatedAt = data.updatedAt ?? new Date()
    if (data.warehouse) this.warehouse = data.warehouse
    if (data.items)
      this.items = data.items.map((item) => new CycleCountItemResponseDTO(item))
  }
}

export class CycleCountItemResponseDTO {
  id: string
  cycleCountId: string
  itemId: string
  expectedQuantity: number
  countedQuantity: number | null | undefined
  variance: number | null | undefined
  location: string | null        // Snapshot original del stock
  locationFound: string | null   // Ubicación encontrada por el contador
  notes?: string | null
  item?: any
  createdAt: Date
  updatedAt?: Date

  constructor(data: any) {
    this.id = data.id
    this.cycleCountId = data.cycleCountId
    this.itemId = data.itemId
    this.expectedQuantity = data.expectedQuantity
    this.countedQuantity = data.countedQuantity ?? undefined
    this.variance = data.variance ?? undefined
    this.location = data.location ?? null
    this.locationFound = data.locationFound ?? null
    this.notes = data.notes ?? null
    this.item = data.item
    this.createdAt = data.createdAt
    if (data.updatedAt) this.updatedAt = data.updatedAt
  }
}
