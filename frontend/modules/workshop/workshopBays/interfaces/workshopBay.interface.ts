// libs/interfaces/workshop/workshopBay.interface.ts
export interface WorkshopBay {
  id: string
  code: string
  name: string
  description: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface WorkshopBayFilters {
  search?: string
  isActive?: 'true' | 'false'
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface CreateWorkshopBayInput {
  code: string
  name: string
  description?: string
}

export interface UpdateWorkshopBayInput {
  code?: string
  name?: string
  description?: string | null
}
