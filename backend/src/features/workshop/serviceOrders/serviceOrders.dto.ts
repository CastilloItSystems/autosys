// backend/src/features/workshop/serviceOrders/serviceOrders.dto.ts
import type {
  ServiceOrderStatus,
  ServiceOrderItemType,
} from './serviceOrders.interface.js'

export class CreateServiceOrderItemDTO {
  type: ServiceOrderItemType
  description: string
  quantity: number
  unitPrice: number
  unitCost: number
  discountPct: number
  taxType: string
  taxRate: number
  itemId?: string
  operationId?: string
  technicianId?: string
  notes?: string

  constructor(data: any) {
    this.type = data.type ?? 'LABOR'
    this.description = String(data.description).trim()
    this.quantity = Number(data.quantity ?? 1)
    this.unitPrice = Number(data.unitPrice ?? 0)
    this.unitCost = Number(data.unitCost ?? 0)
    this.discountPct = Number(data.discountPct ?? 0)
    this.taxType = data.taxType ?? 'IVA'
    this.taxRate = Number(data.taxRate ?? 0.16)
    this.itemId = data.itemId ?? undefined
    this.operationId = data.operationId ?? undefined
    this.technicianId = data.technicianId ?? undefined
    this.notes = data.notes?.trim() ?? undefined
  }
}

export class CreateServiceOrderDTO {
  customerId: string
  priority?: string
  serviceTypeId?: string
  bayId?: string
  customerVehicleId?: string
  receptionId?: string
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
    this.priority = data.priority ?? 'NORMAL'
    this.serviceTypeId = data.serviceTypeId ?? undefined
    this.bayId = data.bayId ?? undefined
    this.customerVehicleId = data.customerVehicleId ?? undefined
    this.receptionId = data.receptionId ?? undefined
    this.vehiclePlate = data.vehiclePlate?.trim() ?? undefined
    this.vehicleDesc = data.vehicleDesc?.trim() ?? undefined
    this.mileageIn = data.mileageIn != null ? Number(data.mileageIn) : undefined
    this.diagnosisNotes = data.diagnosisNotes?.trim() ?? undefined
    this.observations = data.observations?.trim() ?? undefined
    this.assignedTechnicianId = data.assignedTechnicianId ?? undefined
    this.estimatedDelivery = data.estimatedDelivery
      ? new Date(data.estimatedDelivery)
      : undefined
    this.items = (data.items ?? []).map(
      (i: any) => new CreateServiceOrderItemDTO(i)
    )
  }
}

export class UpdateServiceOrderDTO {
  customerId?: string
  priority?: string
  serviceTypeId?: string
  bayId?: string
  customerVehicleId?: string
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
    this.customerId = data.customerId ?? undefined
    this.priority = data.priority ?? undefined
    this.serviceTypeId = data.serviceTypeId ?? undefined
    this.bayId = 'bayId' in data ? data.bayId : undefined
    this.customerVehicleId = data.customerVehicleId ?? undefined
    this.vehiclePlate = data.vehiclePlate ?? undefined
    this.vehicleDesc = data.vehicleDesc ?? undefined
    this.mileageIn = data.mileageIn != null ? Number(data.mileageIn) : undefined
    this.mileageOut =
      data.mileageOut != null ? Number(data.mileageOut) : undefined
    this.diagnosisNotes = data.diagnosisNotes?.trim() ?? undefined
    this.observations = data.observations?.trim() ?? undefined
    this.assignedTechnicianId = data.assignedTechnicianId ?? null
    this.estimatedDelivery = data.estimatedDelivery
      ? new Date(data.estimatedDelivery)
      : null
    this.items = data.items?.map((i: any) => new CreateServiceOrderItemDTO(i))
  }
}

export class UpdateStatusDTO {
  status: ServiceOrderStatus
  mileageOut?: number

  constructor(data: any) {
    this.status = data.status
    this.mileageOut =
      data.mileageOut != null ? Number(data.mileageOut) : undefined
  }
}

export class ServiceOrderResponseDTO {
  id: string
  folio: string
  status: ServiceOrderStatus
  priority: string
  serviceTypeId: string | null
  bayId: string | null
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
  otherTotal: number
  subtotal: number
  taxAmt: number
  total: number
  items: any[]
  createdBy: string
  createdAt: Date
  updatedAt: Date

  constructor(data: any) {
    this.id = data.id
    this.folio = data.folio
    this.status = data.status
    this.priority = data.priority ?? 'NORMAL'
    this.serviceTypeId = data.serviceTypeId ?? null
    this.bayId = 'bayId' in data ? data.bayId : null
    this.customerId = data.customerId
    this.customer = data.customer ?? null
    this.customerVehicleId = data.customerVehicleId ?? null
    this.customerVehicle = data.customerVehicle ?? null
    this.vehiclePlate = data.vehiclePlate ?? null
    this.vehicleDesc = data.vehicleDesc ?? null
    this.mileageIn = data.mileageIn ?? null
    this.mileageOut = data.mileageOut ?? null
    this.diagnosisNotes = data.diagnosisNotes ?? null
    this.observations = data.internalNotes ?? data.observations ?? null
    this.assignedTechnicianId = data.assignedTechnicianId ?? null
    this.receivedAt = data.receivedAt
    this.estimatedDelivery = data.estimatedDelivery ?? null
    this.deliveredAt = data.deliveredAt ?? null
    this.laborTotal = Number(data.laborTotal ?? 0)
    this.partsTotal = Number(data.partsTotal ?? 0)
    this.otherTotal = Number(data.otherTotal ?? 0)
    this.subtotal = Number(data.subtotal ?? 0)
    this.taxAmt = Number(data.taxAmt ?? 0)
    this.total = Number(data.total ?? 0)
    this.items = (data.items ?? []).map((item: any) => ({
      id: item.id,
      type: item.type,
      status: item.status,
      description: item.description,
      quantity: Number(item.quantity),
      unitPrice: Number(item.unitPrice),
      unitCost: Number(item.unitCost ?? 0),
      discountPct: Number(item.discountPct ?? 0),
      taxType: item.taxType ?? 'IVA',
      taxRate: Number(item.taxRate ?? 0.16),
      taxAmount: Number(item.taxAmount ?? 0),
      total: Number(item.total),
      itemId: item.itemId ?? null,
      itemName: item.itemName ?? null,
      operationId: item.operationId ?? null,
      operationName: item.operationName ?? null,
      technicianId: item.technicianId ?? null,
      notes: item.notes ?? null,
      stockDeducted: item.stockDeducted ?? false,
    }))
    this.createdBy = data.createdBy
    this.createdAt = data.createdAt
    this.updatedAt = data.updatedAt
  }
}
