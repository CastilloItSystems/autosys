// libs/interfaces/workshop/delivery.interface.ts
import type { OrderRef } from './shared.interface'

export interface VehicleDelivery {
  id: string
  serviceOrderId: string
  serviceOrder?: OrderRef | null
  deliveredBy: string | null
  receivedByName: string | null
  clientConformity: boolean
  clientSignature: string | null
  observations: string | null
  nextVisitDate: string | null
  deliveredAt: string
  createdAt: string
  updatedAt: string
}

export interface DeliveryFilters {
  serviceOrderId?: string
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface CreateDeliveryInput {
  serviceOrderId: string
  deliveredBy?: string
  receivedByName?: string
  clientConformity?: boolean
  clientSignature?: string
  observations?: string
  nextVisitDate?: string
}
