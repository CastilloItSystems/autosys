// libs/interfaces/workshop/serviceType.interface.ts
export interface ServiceType {
  id: string
  code: string
  name: string
  description: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface ServiceTypeFilters {
  search?: string
  isActive?: 'true' | 'false'
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface CreateServiceTypeInput {
  code: string
  name: string
  description?: string
}

export interface UpdateServiceTypeInput {
  code?: string
  name?: string
  description?: string | null
}
