// backend/src/features/workshop/serviceOrders/serviceOrders.interface.ts

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

export interface IServiceOrderItem {
  id: string
  serviceOrderId: string
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

export interface IServiceOrder {
  id: string
  folio: string
  empresaId: string
  customerId: string
  customerVehicleId: string | null
  vehiclePlate: string | null
  vehicleDesc: string | null
  mileageIn: number | null
  mileageOut: number | null
  diagnosisNotes: string | null
  observations: string | null
  status: ServiceOrderStatus
  priority: ServiceOrderPriority
  assignedAdvisorId: string | null
  assignedTechnicianId: string | null
  appointmentId: string | null
  receptionId: string | null
  serviceTypeId: string | null
  bayId: string | null
  receivedAt: Date
  estimatedDelivery: Date | null
  deliveredAt: Date | null
  closedAt: Date | null
  laborTotal: number
  partsTotal: number
  otherTotal: number
  subtotal: number
  taxAmt: number
  total: number
  createdBy: string
  createdAt: Date
  updatedAt: Date
  items: IServiceOrderItem[]
}

export interface IServiceOrderFilters {
  status?: ServiceOrderStatus
  priority?: ServiceOrderPriority
  customerId?: string
  assignedTechnicianId?: string
  assignedAdvisorId?: string
  bayId?: string
  search?: string
  dateFrom?: string
  dateTo?: string
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface IServiceOrderStatusHistoryFilters {
  page?: number
  limit?: number
}
