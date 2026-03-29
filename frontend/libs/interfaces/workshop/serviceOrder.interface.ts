// libs/interfaces/workshop/serviceOrder.interface.ts
import type { CustomerRef, VehicleRef } from './shared.interface'

export type ServiceOrderStatus =
  | 'DRAFT'
  | 'OPEN'
  | 'DIAGNOSING'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'IN_PROGRESS'
  | 'PAUSED'
  | 'WAITING_PARTS'
  | 'WAITING_AUTH'
  | 'QUALITY_CHECK'
  | 'READY'
  | 'DELIVERED'
  | 'INVOICED'
  | 'CLOSED'
  | 'CANCELLED'

export type ServiceOrderPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'ASAP'
export type ServiceOrderItemType = 'LABOR' | 'PART' | 'OTHER'

export interface ServiceOrderItem {
  id?: string
  type: ServiceOrderItemType
  description: string
  quantity: number
  unitPrice: number
  discountPct: number
  total: number
  operationId?: string | null
  itemId?: string | null
  stockDeducted: boolean
}

export interface ServiceOrder {
  id: string
  folio: string
  status: ServiceOrderStatus
  priority: ServiceOrderPriority
  customerId: string
  customer: CustomerRef | null
  customerVehicleId: string | null
  customerVehicle: VehicleRef | null
  vehiclePlate: string | null
  vehicleDesc: string | null
  mileageIn: number | null
  mileageOut: number | null
  diagnosisNotes: string | null
  observations: string | null
  assignedTechnicianId: string | null
  assignedAdvisorId: string | null
  bayId: string | null
  serviceTypeId: string | null
  appointmentId: string | null
  receptionId: string | null
  receivedAt: string
  estimatedDelivery: string | null
  deliveredAt: string | null
  closedAt: string | null
  laborTotal: number
  partsTotal: number
  otherTotal: number
  subtotal: number
  taxAmt: number
  total: number
  items: ServiceOrderItem[]
  createdBy: string
  createdAt: string
  updatedAt: string
}

export interface ServiceOrderFilters {
  status?: ServiceOrderStatus
  priority?: ServiceOrderPriority
  customerId?: string
  assignedTechnicianId?: string
  bayId?: string
  search?: string
  dateFrom?: string
  dateTo?: string
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface CreateServiceOrderInput {
  customerId: string
  priority?: ServiceOrderPriority
  customerVehicleId?: string
  vehiclePlate?: string
  vehicleDesc?: string
  mileageIn?: number
  diagnosisNotes?: string
  observations?: string
  assignedTechnicianId?: string
  bayId?: string
  serviceTypeId?: string
  receptionId?: string
  estimatedDelivery?: string
  items?: Array<{
    type: ServiceOrderItemType
    description: string
    quantity: number
    unitPrice: number
    discountPct?: number
    operationId?: string
    itemId?: string
  }>
}

export interface UpdateServiceOrderInput {
  priority?: ServiceOrderPriority
  customerVehicleId?: string | null
  vehiclePlate?: string
  vehicleDesc?: string
  mileageIn?: number
  mileageOut?: number
  diagnosisNotes?: string
  observations?: string
  assignedTechnicianId?: string | null
  assignedAdvisorId?: string | null
  bayId?: string | null
  serviceTypeId?: string | null
  estimatedDelivery?: string | null
  items?: CreateServiceOrderInput['items']
}

export interface UpdateServiceOrderStatusInput {
  status: ServiceOrderStatus
  mileageOut?: number
}
