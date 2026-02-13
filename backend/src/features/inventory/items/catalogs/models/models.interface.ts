// backend/src/features/inventory/items/catalogs/models/models.interface.ts

export enum ModelType {
  VEHICLE = 'VEHICLE',
  PART = 'PART',
  GENERIC = 'GENERIC',
}

export interface IModel {
  id: string
  brandId: string
  code?: string | null
  name: string
  year?: number | null
  type: ModelType
  description?: string | null
  specifications?: any | null
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface IModelWithRelations extends IModel {
  brand?: {
    id: string
    code: string
    name: string
  }
  _count?: {
    items: number
  }
  compatibleVehicles?: IModel[]
  compatibleParts?: IModel[]
}

export interface ICreateModelInput {
  brandId: string
  code?: string
  name: string
  year?: number
  type?: ModelType
  description?: string
  specifications?: any
  isActive?: boolean
}

export interface IUpdateModelInput {
  brandId?: string
  code?: string
  name?: string
  year?: number
  type?: ModelType
  description?: string
  specifications?: any
  isActive?: boolean
}

export interface IModelFilters {
  search?: string
  brandId?: string
  year?: number
  type?: ModelType
  isActive?: boolean
}

export interface IModelGroupedByBrand {
  brand: {
    id: string
    code: string
    name: string
  }
  models: IModelWithRelations[]
  count: number
}
