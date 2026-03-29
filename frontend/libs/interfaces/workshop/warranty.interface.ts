// libs/interfaces/workshop/warranty.interface.ts
import type { CustomerRef, VehicleRef, OrderRef } from './shared.interface'

export type WarrantyType = 'LABOR' | 'PARTS' | 'MIXED' | 'COMMERCIAL'
export type WarrantyStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'REJECTED' | 'CLOSED'

export interface WorkshopWarranty {
  id: string
  warrantyNumber: string
  type: WarrantyType
  status: WarrantyStatus
  originalOrderId: string
  originalOrder: OrderRef | null
  reworkOrderId: string | null
  reworkOrder: { id: string; folio: string; status: string } | null
  customerId: string
  customer: CustomerRef | null
  customerVehicleId: string | null
  customerVehicle: VehicleRef | null
  description: string
  rootCause: string | null
  resolution: string | null
  technicianId: string | null
  expiresAt: string | null
  resolvedAt: string | null
  createdBy: string
  createdAt: string
  updatedAt: string
}

export interface WarrantyFilters {
  status?: WarrantyStatus
  type?: WarrantyType
  customerId?: string
  technicianId?: string
  search?: string
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface CreateWarrantyInput {
  type: WarrantyType
  originalOrderId: string
  customerId: string
  customerVehicleId?: string
  description: string
  technicianId?: string
  expiresAt?: string
}

export interface UpdateWarrantyInput {
  rootCause?: string
  resolution?: string
  technicianId?: string | null
  reworkOrderId?: string | null
}
