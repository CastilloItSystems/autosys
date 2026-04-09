// libs/interfaces/workshop/rework.interface.ts
import type { OrderRef } from './shared.interface'

export type ReworkStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'

export interface WorkshopRework {
  id: string
  status: ReworkStatus
  originalOrderId: string
  originalOrder: OrderRef | null
  reworkOrderId: string | null
  reworkOrder: OrderRef | null
  motive: string
  rootCause: string | null
  technicianId: string | null
  estimatedCost: number
  realCost: number | null
  notes: string | null
  createdBy: string
  resolvedAt: string | null
  empresaId: string
  createdAt: string
  updatedAt: string
}

export interface ReworkFilters {
  status?: ReworkStatus
  technicianId?: string
  originalOrderId?: string
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface CreateReworkInput {
  originalOrderId: string
  motive: string
  rootCause?: string
  technicianId?: string
  estimatedCost?: number
  notes?: string
}

export interface UpdateReworkInput {
  rootCause?: string
  technicianId?: string
  estimatedCost?: number
  realCost?: number
  notes?: string
  reworkOrderId?: string
}
