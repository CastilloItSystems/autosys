// backend/src/features/crm/customerVehicles/customerVehicles.dto.ts

import { ICustomerVehicle } from './customerVehicles.interface.js'

export class CreateCustomerVehicleDTO {
  plate: string
  brandId?: string
  modelId?: string
  vin?: string
  year?: number
  color?: string
  fuelType?: string
  transmission?: string
  mileage?: number
  purchasedHere?: boolean
  notes?: string

  constructor(data: Record<string, unknown>) {
    this.plate = String(data.plate).trim().toUpperCase()
    if (data.brandId != null && String(data.brandId).trim() !== '')
      this.brandId = String(data.brandId).trim()
    if (data.modelId != null && String(data.modelId).trim() !== '')
      this.modelId = String(data.modelId).trim()
    if (data.vin != null && String(data.vin).trim() !== '')
      this.vin = String(data.vin).trim().toUpperCase()
    if (data.year !== undefined && data.year !== null) this.year = Number(data.year)
    if (data.color != null && String(data.color).trim() !== '')
      this.color = String(data.color).trim()
    if (data.fuelType !== undefined) this.fuelType = String(data.fuelType)
    if (data.transmission !== undefined) this.transmission = String(data.transmission)
    if (data.mileage !== undefined && data.mileage !== null) this.mileage = Number(data.mileage)
    if (data.purchasedHere !== undefined) this.purchasedHere = Boolean(data.purchasedHere)
    if (data.notes != null && String(data.notes).trim() !== '')
      this.notes = String(data.notes).trim()
  }
}

export class UpdateCustomerVehicleDTO {
  plate?: string
  brandId?: string
  modelId?: string
  vin?: string
  year?: number
  color?: string
  fuelType?: string
  transmission?: string
  mileage?: number
  purchasedHere?: boolean
  notes?: string
  isActive?: boolean

  constructor(data: Record<string, unknown>) {
    if (data.plate !== undefined) this.plate = String(data.plate).trim().toUpperCase()
    if (data.brandId !== undefined) this.brandId = data.brandId ? String(data.brandId).trim() : undefined
    if (data.modelId !== undefined) this.modelId = data.modelId ? String(data.modelId).trim() : undefined
    if (data.vin !== undefined) this.vin = data.vin ? String(data.vin).trim().toUpperCase() : undefined
    if (data.year !== undefined) this.year = data.year !== null ? Number(data.year) : undefined
    if (data.color !== undefined) this.color = data.color ? String(data.color).trim() : undefined
    if (data.fuelType !== undefined) this.fuelType = data.fuelType ? String(data.fuelType) : undefined
    if (data.transmission !== undefined) this.transmission = data.transmission ? String(data.transmission) : undefined
    if (data.mileage !== undefined) this.mileage = data.mileage !== null ? Number(data.mileage) : undefined
    if (data.purchasedHere !== undefined) this.purchasedHere = Boolean(data.purchasedHere)
    if (data.notes !== undefined) this.notes = data.notes ? String(data.notes).trim() : undefined
    if (data.isActive !== undefined) this.isActive = Boolean(data.isActive)
  }
}

export class CustomerVehicleResponseDTO {
  id: string
  customerId: string
  empresaId: string
  plate: string
  vin?: string | null
  brandId?: string | null
  brand?: { id: string; name: string; code: string } | null
  modelId?: string | null
  vehicleModel?: { id: string; name: string; year?: number | null } | null
  year?: number | null
  color?: string | null
  fuelType?: string | null
  transmission?: string | null
  mileage?: number | null
  purchasedHere: boolean
  notes?: string | null
  isActive: boolean
  createdAt: Date
  updatedAt: Date

  constructor(data: ICustomerVehicle) {
    this.id = data.id
    this.customerId = data.customerId
    this.empresaId = data.empresaId
    this.plate = data.plate
    this.purchasedHere = data.purchasedHere
    this.isActive = data.isActive
    this.createdAt = data.createdAt
    this.updatedAt = data.updatedAt
    if (data.vin != null) this.vin = data.vin
    if (data.brandId != null) this.brandId = data.brandId
    if (data.brand != null) this.brand = data.brand
    if (data.modelId != null) this.modelId = data.modelId
    if (data.vehicleModel != null) this.vehicleModel = data.vehicleModel
    if (data.year != null) this.year = data.year
    if (data.color != null) this.color = data.color
    if (data.fuelType != null) this.fuelType = data.fuelType
    if (data.transmission != null) this.transmission = data.transmission
    if (data.mileage != null) this.mileage = data.mileage
    if (data.notes != null) this.notes = data.notes
  }
}
