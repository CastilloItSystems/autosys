// backend/src/features/workshop/laborTimes/laborTimes.dto.ts
import type { LaborTimeStatus } from './laborTimes.interface.js'

export class StartLaborTimeDTO {
  serviceOrderId: string
  serviceOrderItemId?: string
  operationId?: string
  technicianId: string
  notes?: string

  constructor(data: any) {
    this.serviceOrderId = data.serviceOrderId
    this.serviceOrderItemId = data.serviceOrderItemId ?? undefined
    this.operationId = data.operationId ?? undefined
    this.technicianId = data.technicianId
    this.notes = data.notes?.trim() ?? undefined
  }
}

export class LaborTimeResponseDTO {
  id: string
  serviceOrderId: string
  serviceOrderItemId: string | null
  operationId: string | null
  operation: any | null
  technicianId: string
  startedAt: Date
  pausedAt: Date | null
  finishedAt: Date | null
  pausedMinutes: number
  realMinutes: number | null
  standardMinutes: number | null
  status: LaborTimeStatus
  notes: string | null
  efficiency: number | null  // realMinutes / standardMinutes * 100
  createdBy: string
  createdAt: Date
  updatedAt: Date

  constructor(data: any) {
    this.id = data.id
    this.serviceOrderId = data.serviceOrderId
    this.serviceOrderItemId = data.serviceOrderItemId ?? null
    this.operationId = data.operationId ?? null
    this.operation = data.operation ?? null
    this.technicianId = data.technicianId
    this.startedAt = data.startedAt
    this.pausedAt = data.pausedAt ?? null
    this.finishedAt = data.finishedAt ?? null
    this.pausedMinutes = data.pausedMinutes ?? 0
    this.realMinutes = data.realMinutes ?? null
    this.standardMinutes = data.standardMinutes ?? null
    this.status = data.status
    this.notes = data.notes ?? null
    this.efficiency =
      data.realMinutes && data.standardMinutes && data.standardMinutes > 0
        ? Math.round((data.standardMinutes / data.realMinutes) * 100)
        : null
    this.createdBy = data.createdBy
    this.createdAt = data.createdAt
    this.updatedAt = data.updatedAt
  }
}
