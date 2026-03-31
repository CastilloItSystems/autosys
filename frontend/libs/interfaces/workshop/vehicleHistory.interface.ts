// libs/interfaces/workshop/vehicleHistory.interface.ts

export interface VehicleHistoryVehicle {
  id: string
  plate: string
  year?: number | null
  color?: string | null
  mileage?: number | null
  brand?: { name: string } | null
  vehicleModel?: { name: string } | null
  customer?: { id: string; name: string; code: string; phone?: string | null } | null
}

export interface VehicleHistoryAppointment {
  id: string
  folio: string
  scheduledDate: string
  status: string
  serviceType?: { name: string } | null
  createdAt: string
}

export interface VehicleHistoryReception {
  id: string
  code: string
  mileageIn: number
  status: string
  receivedAt: string
}

export interface VehicleHistoryServiceOrder {
  id: string
  folio: string
  status: string
  total: number
  receivedAt: string
  deliveredAt?: string | null
}

export interface VehicleHistoryWarranty {
  id: string
  code: string
  type: string
  status: string
  createdAt: string
}

export interface VehicleHistoryData {
  vehicle: VehicleHistoryVehicle
  appointments: VehicleHistoryAppointment[]
  receptions: VehicleHistoryReception[]
  serviceOrders: VehicleHistoryServiceOrder[]
  warranties: VehicleHistoryWarranty[]
}
