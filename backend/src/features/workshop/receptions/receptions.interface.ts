// backend/src/features/workshop/receptions/receptions.interface.ts

export type FuelLevel = 'EMPTY' | 'QUARTER' | 'HALF' | 'THREE_QUARTERS' | 'FULL'

export interface IReception {
  id: string
  folio: string
  customerId: string
  customerVehicleId?: string | null
  vehiclePlate?: string | null
  vehicleDesc?: string | null
  mileageIn?: number | null
  fuelLevel?: FuelLevel | null
  accessories?: any | null
  hasPreExistingDamage: boolean
  damageNotes?: string | null
  clientDescription?: string | null
  authorizationName?: string | null
  authorizationPhone?: string | null
  estimatedDelivery?: Date | null
  advisorId?: string | null
  appointmentId?: string | null
  empresaId: string
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

export interface ICreateReceptionInput {
  customerId: string
  customerVehicleId?: string
  vehiclePlate?: string
  vehicleDesc?: string
  mileageIn?: number
  fuelLevel?: FuelLevel
  accessories?: string[]
  hasPreExistingDamage?: boolean
  damageNotes?: string
  clientDescription?: string
  authorizationName?: string
  authorizationPhone?: string
  estimatedDelivery?: Date
  advisorId?: string
  appointmentId?: string
}

export interface IUpdateReceptionInput {
  mileageIn?: number
  fuelLevel?: FuelLevel | null
  accessories?: string[]
  hasPreExistingDamage?: boolean
  damageNotes?: string | null
  clientDescription?: string
  authorizationName?: string
  authorizationPhone?: string
  estimatedDelivery?: Date | null
  advisorId?: string | null
}

export interface IReceptionFilters {
  customerId?: string
  advisorId?: string
  appointmentId?: string
  dateFrom?: string
  dateTo?: string
  search?: string
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}
