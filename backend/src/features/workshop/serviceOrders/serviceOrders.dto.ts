// backend/src/features/workshop/serviceOrders/serviceOrders.dto.ts
import type { ServiceOrderStatus, ServiceOrderItemType } from './serviceOrders.interface.js'

export class CreateServiceOrderItemDTO {
  type: ServiceOrderItemType
  description: string
  quantity: number
  unitPrice: number

  constructor(data: any) {
    this.type = data.type ?? 'LABOR'
    this.description = String(data.description).trim()
    this.quantity = Number(data.quantity ?? 1)
    this.unitPrice = Number(data.unitPrice ?? 0)
  }
}

export class CreateServiceOrderDTO {
  customerId: string
  customerVehicleId?: string
  vehiclePlate?: string
  vehicleDesc?: string
  mileageIn?: number
  diagnosisNotes?: string
  observations?: string
  assignedTechnicianId?: string
  estimatedDelivery?: Date
  items: CreateServiceOrderItemDTO[]

  constructor(data: any) {
    this.customerId = data.customerId
    this.customerVehicleId = data.customerVehicleId ?? undefined
    this.vehiclePlate = data.vehiclePlate?.trim() ?? undefined
    this.vehicleDesc = data.vehicleDesc?.trim() ?? undefined
    this.mileageIn = data.mileageIn != null ? Number(data.mileageIn) : undefined
    this.diagnosisNotes = data.diagnosisNotes?.trim() ?? undefined
    this.observations = data.observations?.trim() ?? undefined
    this.assignedTechnicianId = data.assignedTechnicianId ?? undefined
    this.estimatedDelivery = data.estimatedDelivery ? new Date(data.estimatedDelivery) : undefined
    this.items = (data.items ?? []).map((i: any) => new CreateServiceOrderItemDTO(i))
  }
}

export class UpdateServiceOrderDTO {
  customerVehicleId?: string | null
  vehiclePlate?: string
  vehicleDesc?: string
  mileageIn?: number
  mileageOut?: number
  diagnosisNotes?: string
  observations?: string
  assignedTechnicianId?: string | null
  estimatedDelivery?: Date | null
  items?: CreateServiceOrderItemDTO[]

  constructor(data: any) {
    if ('customerVehicleId' in data) this.customerVehicleId = data.customerVehicleId ?? null
    if (data.vehiclePlate !== undefined) this.vehiclePlate = data.vehiclePlate.trim()
    if (data.vehicleDesc !== undefined) this.vehicleDesc = data.vehicleDesc.trim()
    if (data.mileageIn != null) this.mileageIn = Number(data.mileageIn)
    if (data.mileageOut != null) this.mileageOut = Number(data.mileageOut)
    if (data.diagnosisNotes !== undefined) this.diagnosisNotes = data.diagnosisNotes.trim()
    if (data.observations !== undefined) this.observations = data.observations.trim()
    if ('assignedTechnicianId' in data) this.assignedTechnicianId = data.assignedTechnicianId ?? null
    if ('estimatedDelivery' in data)
      this.estimatedDelivery = data.estimatedDelivery ? new Date(data.estimatedDelivery) : null
    if (data.items !== undefined)
      this.items = data.items.map((i: any) => new CreateServiceOrderItemDTO(i))
  }
}

export class UpdateStatusDTO {
  status: ServiceOrderStatus
  mileageOut?: number

  constructor(data: any) {
    this.status = data.status
    this.mileageOut = data.mileageOut != null ? Number(data.mileageOut) : undefined
  }
}

export class ServiceOrderResponseDTO {
  id: string
  folio: string
  status: ServiceOrderStatus
  customerId: string
  customer: any
  customerVehicleId: string | null
  customerVehicle: any
  vehiclePlate: string | null
  vehicleDesc: string | null
  mileageIn: number | null
  mileageOut: number | null
  diagnosisNotes: string | null
  observations: string | null
  assignedTechnicianId: string | null
  receivedAt: Date
  estimatedDelivery: Date | null
  deliveredAt: Date | null
  laborTotal: number
  partsTotal: number
  total: number
  items: any[]
  createdBy: string
  createdAt: Date
  updatedAt: Date

  constructor(data: any) {
    this.id = data.id
    this.folio = data.folio
    this.status = data.status
    this.customerId = data.customerId
    this.customer = data.customer ?? null
    this.customerVehicleId = data.customerVehicleId ?? null
    this.customerVehicle = data.customerVehicle ?? null
    this.vehiclePlate = data.vehiclePlate ?? null
    this.vehicleDesc = data.vehicleDesc ?? null
    this.mileageIn = data.mileageIn ?? null
    this.mileageOut = data.mileageOut ?? null
    this.diagnosisNotes = data.diagnosisNotes ?? null
    this.observations = data.observations ?? null
    this.assignedTechnicianId = data.assignedTechnicianId ?? null
    this.receivedAt = data.receivedAt
    this.estimatedDelivery = data.estimatedDelivery ?? null
    this.deliveredAt = data.deliveredAt ?? null
    this.laborTotal = Number(data.laborTotal ?? 0)
    this.partsTotal = Number(data.partsTotal ?? 0)
    this.total = Number(data.total ?? 0)
    this.items = (data.items ?? []).map((item: any) => ({
      id: item.id,
      type: item.type,
      description: item.description,
      quantity: Number(item.quantity),
      unitPrice: Number(item.unitPrice),
      total: Number(item.total),
    }))
    this.createdBy = data.createdBy
    this.createdAt = data.createdAt
    this.updatedAt = data.updatedAt
  }
}
