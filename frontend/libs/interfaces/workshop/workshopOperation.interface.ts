// libs/interfaces/workshop/workshopOperation.interface.ts
export interface WorkshopOperation {
  id: string
  code: string
  name: string
  description: string | null
  serviceTypeId: string | null
  serviceType: { id: string; name: string; code: string } | null
  standardMinutes: number | null
  listPrice: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface WorkshopOperationFilters {
  search?: string
  serviceTypeId?: string
  isActive?: 'true' | 'false'
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface CreateWorkshopOperationInput {
  code: string
  name: string
  description?: string
  serviceTypeId?: string
  standardMinutes?: number
  listPrice: number
}

export interface UpdateWorkshopOperationInput {
  code?: string
  name?: string
  description?: string | null
  serviceTypeId?: string | null
  standardMinutes?: number | null
  listPrice?: number
}
