import { IDealerUnit } from './units.interface.js'

export class CreateDealerUnitDTO {
  brandId: string
  modelId?: string
  code?: string
  version?: string
  year?: number | null
  vin?: string
  engineSerial?: string
  plate?: string
  condition?: string
  status?: string
  mileage?: number | null
  colorExterior?: string
  colorInterior?: string
  fuelType?: string
  transmission?: string
  listPrice?: number | null
  promoPrice?: number | null
  location?: string
  description?: string
  isPublished?: boolean
  isActive?: boolean
  specifications?: unknown

  constructor(data: Record<string, unknown>) {
    this.brandId = String(data.brandId).trim()
    if (data.modelId != null && String(data.modelId).trim() !== '') this.modelId = String(data.modelId).trim()
    if (data.code != null && String(data.code).trim() !== '') this.code = String(data.code).trim()
    if (data.version != null && String(data.version).trim() !== '') this.version = String(data.version).trim()
    if (data.year !== undefined) this.year = data.year !== null ? Number(data.year) : null
    if (data.vin != null && String(data.vin).trim() !== '') this.vin = String(data.vin).trim()
    if (data.engineSerial != null && String(data.engineSerial).trim() !== '')
      this.engineSerial = String(data.engineSerial).trim()
    if (data.plate != null && String(data.plate).trim() !== '') this.plate = String(data.plate).trim()
    if (data.condition != null && String(data.condition).trim() !== '') this.condition = String(data.condition).trim()
    if (data.status != null && String(data.status).trim() !== '') this.status = String(data.status).trim()
    if (data.mileage !== undefined) this.mileage = data.mileage !== null ? Number(data.mileage) : null
    if (data.colorExterior != null && String(data.colorExterior).trim() !== '')
      this.colorExterior = String(data.colorExterior).trim()
    if (data.colorInterior != null && String(data.colorInterior).trim() !== '')
      this.colorInterior = String(data.colorInterior).trim()
    if (data.fuelType != null && String(data.fuelType).trim() !== '') this.fuelType = String(data.fuelType).trim()
    if (data.transmission != null && String(data.transmission).trim() !== '')
      this.transmission = String(data.transmission).trim()
    if (data.listPrice !== undefined) this.listPrice = data.listPrice !== null ? Number(data.listPrice) : null
    if (data.promoPrice !== undefined) this.promoPrice = data.promoPrice !== null ? Number(data.promoPrice) : null
    if (data.location != null && String(data.location).trim() !== '') this.location = String(data.location).trim()
    if (data.description != null && String(data.description).trim() !== '')
      this.description = String(data.description).trim()
    if (data.isPublished !== undefined) this.isPublished = Boolean(data.isPublished)
    if (data.isActive !== undefined) this.isActive = Boolean(data.isActive)
    if (data.specifications !== undefined) this.specifications = data.specifications
  }
}

export class UpdateDealerUnitDTO {
  brandId?: string
  modelId?: string | null
  code?: string | null
  version?: string | null
  year?: number | null
  vin?: string | null
  engineSerial?: string | null
  plate?: string | null
  condition?: string
  status?: string
  mileage?: number | null
  colorExterior?: string | null
  colorInterior?: string | null
  fuelType?: string | null
  transmission?: string | null
  listPrice?: number | null
  promoPrice?: number | null
  location?: string | null
  description?: string | null
  isPublished?: boolean
  isActive?: boolean
  specifications?: unknown

  constructor(data: Record<string, unknown>) {
    if (data.brandId !== undefined) this.brandId = String(data.brandId).trim()
    if (data.modelId !== undefined) this.modelId = data.modelId ? String(data.modelId).trim() : null
    if (data.code !== undefined) this.code = data.code ? String(data.code).trim() : null
    if (data.version !== undefined) this.version = data.version ? String(data.version).trim() : null
    if (data.year !== undefined) this.year = data.year !== null ? Number(data.year) : null
    if (data.vin !== undefined) this.vin = data.vin ? String(data.vin).trim() : null
    if (data.engineSerial !== undefined) this.engineSerial = data.engineSerial ? String(data.engineSerial).trim() : null
    if (data.plate !== undefined) this.plate = data.plate ? String(data.plate).trim() : null
    if (data.condition !== undefined) this.condition = String(data.condition).trim()
    if (data.status !== undefined) this.status = String(data.status).trim()
    if (data.mileage !== undefined) this.mileage = data.mileage !== null ? Number(data.mileage) : null
    if (data.colorExterior !== undefined) this.colorExterior = data.colorExterior ? String(data.colorExterior).trim() : null
    if (data.colorInterior !== undefined) this.colorInterior = data.colorInterior ? String(data.colorInterior).trim() : null
    if (data.fuelType !== undefined) this.fuelType = data.fuelType ? String(data.fuelType).trim() : null
    if (data.transmission !== undefined) this.transmission = data.transmission ? String(data.transmission).trim() : null
    if (data.listPrice !== undefined) this.listPrice = data.listPrice !== null ? Number(data.listPrice) : null
    if (data.promoPrice !== undefined) this.promoPrice = data.promoPrice !== null ? Number(data.promoPrice) : null
    if (data.location !== undefined) this.location = data.location ? String(data.location).trim() : null
    if (data.description !== undefined) this.description = data.description ? String(data.description).trim() : null
    if (data.isPublished !== undefined) this.isPublished = Boolean(data.isPublished)
    if (data.isActive !== undefined) this.isActive = Boolean(data.isActive)
    if (data.specifications !== undefined) this.specifications = data.specifications
  }
}

export class DealerUnitResponseDTO {
  id: string
  empresaId: string
  brandId: string
  modelId?: string | null
  code?: string | null
  version?: string | null
  year?: number | null
  vin?: string | null
  engineSerial?: string | null
  plate?: string | null
  condition: string
  status: string
  mileage?: number | null
  colorExterior?: string | null
  colorInterior?: string | null
  fuelType?: string | null
  transmission?: string | null
  listPrice?: any | null
  promoPrice?: any | null
  location?: string | null
  description?: string | null
  specifications?: unknown
  isPublished: boolean
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  brand: IDealerUnit['brand']
  model?: IDealerUnit['model']

  constructor(data: IDealerUnit) {
    this.id = data.id
    this.empresaId = data.empresaId
    this.brandId = data.brandId
    this.condition = data.condition
    this.status = data.status
    this.isPublished = data.isPublished
    this.isActive = data.isActive
    this.createdAt = data.createdAt
    this.updatedAt = data.updatedAt
    this.brand = data.brand
    if (data.model != null) this.model = data.model
    if (data.modelId != null) this.modelId = data.modelId
    if (data.code != null) this.code = data.code
    if (data.version != null) this.version = data.version
    if (data.year != null) this.year = data.year
    if (data.vin != null) this.vin = data.vin
    if (data.engineSerial != null) this.engineSerial = data.engineSerial
    if (data.plate != null) this.plate = data.plate
    if (data.mileage != null) this.mileage = data.mileage
    if (data.colorExterior != null) this.colorExterior = data.colorExterior
    if (data.colorInterior != null) this.colorInterior = data.colorInterior
    if (data.fuelType != null) this.fuelType = data.fuelType
    if (data.transmission != null) this.transmission = data.transmission
    if (data.listPrice != null) this.listPrice = data.listPrice
    if (data.promoPrice != null) this.promoPrice = data.promoPrice
    if (data.location != null) this.location = data.location
    if (data.description != null) this.description = data.description
    if (data.specifications != null) this.specifications = data.specifications
  }
}
