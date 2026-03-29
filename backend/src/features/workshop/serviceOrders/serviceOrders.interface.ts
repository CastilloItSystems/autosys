// backend/src/features/workshop/serviceOrders/serviceOrders.interface.ts

export type ServiceOrderStatus =
  | 'RECEIVED'
  | 'IN_PROGRESS'
  | 'DONE'
  | 'DELIVERED'
  | 'CANCELLED'

export type ServiceOrderItemType = 'LABOR' | 'PART' | 'OTHER'

export interface IServiceOrderItem {
  id: string
  serviceOrderId: string
  type: ServiceOrderItemType
  description: string
  quantity: number
  unitPrice: number
  total: number
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
  assignedTechnicianId: string | null
  receivedAt: Date
  estimatedDelivery: Date | null
  deliveredAt: Date | null
  laborTotal: number
  partsTotal: number
  total: number
  createdBy: string
  createdAt: Date
  updatedAt: Date
  items: IServiceOrderItem[]
}

export interface IServiceOrderFilters {
  status?: ServiceOrderStatus
  customerId?: string
  assignedTechnicianId?: string
  search?: string
  dateFrom?: string
  dateTo?: string
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}
