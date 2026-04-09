// backend/src/features/workshop/workshopWarranties/workshopWarranties.dto.ts
import type { WarrantyType, WarrantyStatus } from './workshopWarranties.interface.js'

export class CreateWarrantyDTO {
  type: WarrantyType
  originalOrderId: string
  customerId: string
  customerVehicleId?: string
  description: string
  technicianId?: string
  expiresAt?: Date

  constructor(data: any) {
    this.type = data.type
    this.originalOrderId = data.originalOrderId
    this.customerId = data.customerId
    this.customerVehicleId = data.customerVehicleId ?? undefined
    this.description = String(data.description ?? '').trim()
    this.technicianId = data.technicianId ?? undefined
    this.expiresAt = data.expiresAt ? new Date(data.expiresAt) : undefined
  }
}

export class UpdateWarrantyDTO {
  rootCause?: string
  resolution?: string
  technicianId?: string | null
  reworkOrderId?: string | null

  constructor(data: any) {
    if (data.rootCause !== undefined) this.rootCause = data.rootCause.trim()
    if (data.resolution !== undefined) this.resolution = data.resolution.trim()
    if ('technicianId' in data) this.technicianId = data.technicianId ?? null
    if ('reworkOrderId' in data) this.reworkOrderId = data.reworkOrderId ?? null
  }
}

export class WarrantyResponseDTO {
  id: string
  warrantyNumber: string
  type: WarrantyType
  status: WarrantyStatus
  originalOrderId: string
  originalOrder: any | null
  reworkOrderId: string | null
  reworkOrder: any | null
  customerId: string
  customer: any | null
  customerVehicleId: string | null
  customerVehicle: any | null
  description: string
  rootCause: string | null
  resolution: string | null
  technicianId: string | null
  expiresAt: Date | null
  resolvedAt: Date | null
  createdBy: string
  createdAt: Date
  updatedAt: Date

  constructor(data: any) {
    this.id = data.id
    this.warrantyNumber = data.warrantyNumber
    this.type = data.type
    this.status = data.status
    this.originalOrderId = data.originalOrderId
    this.originalOrder = data.originalOrder ?? null
    this.reworkOrderId = data.reworkOrderId ?? null
    this.reworkOrder = data.reworkOrder ?? null
    this.customerId = data.customerId
    this.customer = data.customer ?? null
    this.customerVehicleId = data.customerVehicleId ?? null
    this.customerVehicle = data.customerVehicle ?? null
    this.description = data.description
    this.rootCause = data.rootCause ?? null
    this.resolution = data.resolution ?? null
    this.technicianId = data.technicianId ?? null
    this.expiresAt = data.expiresAt ?? null
    this.resolvedAt = data.resolvedAt ?? null
    this.createdBy = data.createdBy
    this.createdAt = data.createdAt
    this.updatedAt = data.updatedAt
  }
}
