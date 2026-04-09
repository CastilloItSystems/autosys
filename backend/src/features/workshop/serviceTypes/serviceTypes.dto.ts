// backend/src/features/workshop/serviceTypes/serviceTypes.dto.ts

export class CreateServiceTypeDTO {
  code: string
  name: string
  description?: string
  standardMinutes?: number
  standardLaborPrice?: number

  constructor(data: any) {
    this.code = String(data.code ?? '').toUpperCase().trim()
    this.name = String(data.name ?? '').trim()
    this.description = data.description?.trim() ?? undefined
    this.standardMinutes = data.standardMinutes != null ? Number(data.standardMinutes) : undefined
    this.standardLaborPrice = data.standardLaborPrice != null ? Number(data.standardLaborPrice) : undefined
  }
}

export class UpdateServiceTypeDTO {
  code?: string
  name?: string
  description?: string | null
  standardMinutes?: number | null
  standardLaborPrice?: number | null

  constructor(data: any) {
    if (data.code !== undefined) this.code = String(data.code).toUpperCase().trim()
    if (data.name !== undefined) this.name = String(data.name).trim()
    if ('description' in data) this.description = data.description?.trim() ?? null
    if ('standardMinutes' in data) this.standardMinutes = data.standardMinutes != null ? Number(data.standardMinutes) : null
    if ('standardLaborPrice' in data) this.standardLaborPrice = data.standardLaborPrice != null ? Number(data.standardLaborPrice) : null
  }
}

export class ServiceTypeResponseDTO {
  id: string
  code: string
  name: string
  description: string | null
  standardMinutes: number | null
  standardLaborPrice: number | null
  isActive: boolean
  createdAt: Date
  updatedAt: Date

  constructor(data: any) {
    this.id = data.id
    this.code = data.code
    this.name = data.name
    this.description = data.description ?? null
    this.standardMinutes = data.standardMinutes ?? null
    this.standardLaborPrice = data.standardLaborPrice != null ? Number(data.standardLaborPrice) : null
    this.isActive = data.isActive
    this.createdAt = data.createdAt
    this.updatedAt = data.updatedAt
  }
}
