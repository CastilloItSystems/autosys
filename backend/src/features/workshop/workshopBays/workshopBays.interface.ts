// backend/src/features/workshop/workshopBays/workshopBays.interface.ts

export interface IWorkshopBay {
  id: string
  code: string
  name: string
  description?: string | null
  isActive: boolean
  empresaId: string
  createdAt: Date
  updatedAt: Date
}

export interface ICreateWorkshopBayInput {
  code: string
  name: string
  description?: string
}

export interface IUpdateWorkshopBayInput {
  code?: string
  name?: string
  description?: string | null
}

export interface IWorkshopBayFilters {
  search?: string
  isActive?: boolean
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}
