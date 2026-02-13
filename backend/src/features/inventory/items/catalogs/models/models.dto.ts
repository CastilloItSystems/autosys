// models.dto.ts - ACTUALIZADO
import { ModelType } from './models.interface'

export class CreateModelDTO {
  brandId: string
  name: string
  code?: string
  type: ModelType
  year?: number
  description?: string
  specifications?: any
  isActive?: boolean

  constructor(data: any) {
    this.brandId = data.brandId
    this.name = data.name
    this.code = data.code
    this.type = data.type || ModelType.PART
    this.year = data.year
    this.description = data.description
    this.specifications = data.specifications
    this.isActive = data.isActive ?? true
  }
}

export class UpdateModelDTO {
  brandId?: string
  name?: string
  code?: string
  type?: ModelType
  year?: number
  description?: string
  specifications?: any
  isActive?: boolean

  constructor(data: any) {
    if (data.brandId !== undefined) this.brandId = data.brandId
    if (data.name !== undefined) this.name = data.name
    if (data.code !== undefined) this.code = data.code
    if (data.type !== undefined) this.type = data.type
    if (data.year !== undefined) this.year = data.year
    if (data.description !== undefined) this.description = data.description
    if (data.specifications !== undefined)
      this.specifications = data.specifications
    if (data.isActive !== undefined) this.isActive = data.isActive
  }
}

export class ModelResponseDTO {
  id: string
  brandId: string
  name: string
  code: string | null
  type: ModelType
  year: number | null
  description: string | null
  specifications?: any
  isActive: boolean
  createdAt: Date
  updatedAt: Date

  brand?: {
    id: string
    code: string
    name: string
  }

  itemsCount?: number
  compatibilitiesCount?: number
  fullName?: string

  constructor(data: any, options?: { includeBrand?: boolean }) {
    this.id = data.id
    this.brandId = data.brandId
    this.name = data.name
    this.code = data.code || null
    this.type = data.type
    this.year = data.year || null
    this.description = data.description || null
    this.specifications = data.specifications
    this.isActive = data.isActive
    this.createdAt = data.createdAt
    this.updatedAt = data.updatedAt

    if (options?.includeBrand && data.brand) {
      this.brand = {
        id: data.brand.id,
        code: data.brand.code,
        name: data.brand.name,
      }
    }

    if (data._count?.items) {
      this.itemsCount = data._count.items
    }

    if (this.name && this.brand?.name) {
      this.fullName = `${this.brand.name} ${this.name}`
    }
  }
}

export class ModelGroupedDTO {
  brand: {
    id: string
    code: string
    name: string
  }
  models: ModelResponseDTO[]
  count: number

  constructor(data: any) {
    this.brand = {
      id: data.brand?.id || '',
      code: data.brand?.code || '',
      name: data.brand?.name || '',
    }
    this.models = (data.models || []).map(
      (model: any) => new ModelResponseDTO(model, { includeBrand: false })
    )
    this.count = data.count || data.models?.length || 0
  }
}
