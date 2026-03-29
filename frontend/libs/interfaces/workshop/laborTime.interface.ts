// libs/interfaces/workshop/laborTime.interface.ts
export type LaborTimeStatus = 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'CANCELLED'

export interface LaborTime {
  id: string
  serviceOrderId: string
  serviceOrderItemId: string | null
  operationId: string | null
  operation: { id: string; name: string; code: string } | null
  technicianId: string
  startedAt: string
  pausedAt: string | null
  finishedAt: string | null
  pausedMinutes: number
  realMinutes: number | null
  standardMinutes: number | null
  status: LaborTimeStatus
  notes: string | null
  efficiency: number | null
  createdBy: string
  createdAt: string
  updatedAt: string
}

export interface LaborTimeFilters {
  serviceOrderId?: string
  technicianId?: string
  status?: LaborTimeStatus
  page?: number
  limit?: number
}

export interface StartLaborTimeInput {
  serviceOrderId: string
  serviceOrderItemId?: string
  operationId?: string
  technicianId: string
  notes?: string
}
