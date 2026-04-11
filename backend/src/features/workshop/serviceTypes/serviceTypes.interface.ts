// backend/src/features/workshop/serviceTypes/serviceTypes.interface.ts

export interface IServiceType {
  id: string
  code: string
  name: string
  description?: string | null
  isActive: boolean
  empresaId: string
  createdAt: Date
  updatedAt: Date
}

export interface ICreateServiceTypeInput {
  code: string
  name: string
  description?: string
}

export interface IUpdateServiceTypeInput {
  code?: string
  name?: string
  description?: string | null
}

export interface IServiceTypeFilters {
  search?: string
  isActive?: boolean
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}
