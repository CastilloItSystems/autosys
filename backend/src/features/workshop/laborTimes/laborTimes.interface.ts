// backend/src/features/workshop/laborTimes/laborTimes.interface.ts

export type LaborTimeStatus = 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'CANCELLED'

export interface ILaborTime {
  id: string
  serviceOrderId: string
  serviceOrderItemId?: string | null
  operationId?: string | null
  technicianId: string
  startedAt: Date
  pausedAt?: Date | null
  finishedAt?: Date | null
  pausedMinutes: number
  realMinutes?: number | null
  standardMinutes?: number | null
  status: LaborTimeStatus
  notes?: string | null
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

export interface IStartLaborTimeInput {
  serviceOrderId: string
  serviceOrderItemId?: string
  operationId?: string
  technicianId: string
  notes?: string
}

export interface ILaborTimeFilters {
  serviceOrderId?: string
  technicianId?: string
  status?: LaborTimeStatus
  dateFrom?: string
  dateTo?: string
  page?: number
  limit?: number
}
