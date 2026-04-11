// backend/src/features/workshop/serviceTypes/serviceTypes.dto.ts

export class CreateServiceTypeDTO {
  code: string
  name: string
  description?: string

  constructor(data: any) {
    this.code = String(data.code ?? '').toUpperCase().trim()
    this.name = String(data.name ?? '').trim()
    this.description = data.description?.trim() ?? undefined
  }
}

export class UpdateServiceTypeDTO {
  code?: string
  name?: string
  description?: string | null

  constructor(data: any) {
    if (data.code !== undefined) this.code = String(data.code).toUpperCase().trim()
    if (data.name !== undefined) this.name = String(data.name).trim()
    if ('description' in data) this.description = data.description?.trim() ?? null
  }
}

export class ServiceTypeResponseDTO {
  id: string
  code: string
  name: string
  description: string | null
  isActive: boolean
  createdAt: Date
  updatedAt: Date

  constructor(data: any) {
    this.id = data.id
    this.code = data.code
    this.name = data.name
    this.description = data.description ?? null
    this.isActive = data.isActive
    this.createdAt = data.createdAt
    this.updatedAt = data.updatedAt
  }
}
