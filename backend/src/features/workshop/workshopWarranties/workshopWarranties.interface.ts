// backend/src/features/workshop/workshopWarranties/workshopWarranties.interface.ts

export type WarrantyType = 'LABOR' | 'PARTS' | 'MIXED' | 'COMMERCIAL'
export type WarrantyStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'REJECTED' | 'CLOSED'

export interface IWorkshopWarranty {
  id: string
  warrantyNumber: string
  type: WarrantyType
  status: WarrantyStatus
  originalOrderId: string
  reworkOrderId?: string | null
  customerId: string
  customerVehicleId?: string | null
  description: string
  rootCause?: string | null
  resolution?: string | null
  technicianId?: string | null
  expiresAt?: Date | null
  resolvedAt?: Date | null
  empresaId: string
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

export interface ICreateWarrantyInput {
  type: WarrantyType
  originalOrderId: string
  customerId: string
  customerVehicleId?: string
  description: string
  technicianId?: string
  expiresAt?: Date
}

export interface IUpdateWarrantyInput {
  rootCause?: string
  resolution?: string
  technicianId?: string | null
  reworkOrderId?: string | null
}

export interface IWarrantyFilters {
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
