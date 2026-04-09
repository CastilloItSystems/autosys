// backend/src/features/crm/customerVehicles/customerVehicles.interface.ts

export enum FuelType {
  GASOLINE = 'GASOLINE',
  DIESEL = 'DIESEL',
  ELECTRIC = 'ELECTRIC',
  HYBRID = 'HYBRID',
  GAS = 'GAS',
}

export enum TransmissionType {
  MANUAL = 'MANUAL',
  AUTOMATIC = 'AUTOMATIC',
  CVT = 'CVT',
}

export interface ICustomerVehicle {
  id: string
  customerId: string
  empresaId: string
  plate: string
  vin?: string | null
  // FKs a Brand/Model del inventario
  brandId?: string | null
  brand?: { id: string; name: string; code: string } | null
  modelId?: string | null
  vehicleModel?: { id: string; name: string; year?: number | null } | null
  year?: number | null        // override del año cuando difiere del Model.year
  color?: string | null
  fuelType?: FuelType | null
  transmission?: TransmissionType | null
  mileage?: number | null
  purchasedHere: boolean
  notes?: string | null
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface ICustomerVehicleFilters {
  brandId?: string
  isActive?: boolean
  search?: string
}
