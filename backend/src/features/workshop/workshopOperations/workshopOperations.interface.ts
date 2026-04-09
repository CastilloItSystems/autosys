// backend/src/features/workshop/workshopOperations/workshopOperations.interface.ts

export interface IWorkshopOperation {
  id: string
  code: string
  name: string
  description?: string | null
  serviceTypeId?: string | null
  standardMinutes?: number | null
  listPrice: number
  isActive: boolean
  empresaId: string
  createdAt: Date
  updatedAt: Date
  serviceType?: { id: string; code: string; name: string } | null
}

export interface ICreateWorkshopOperationInput {
  code: string
  name: string
  description?: string
  serviceTypeId?: string
  standardMinutes?: number
  listPrice?: number
}

export interface IUpdateWorkshopOperationInput {
  code?: string
  name?: string
  description?: string | null
  serviceTypeId?: string | null
  standardMinutes?: number | null
  listPrice?: number
}

export interface IWorkshopOperationFilters {
  search?: string
  serviceTypeId?: string
  isActive?: boolean
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}
