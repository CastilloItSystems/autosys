// libs/interfaces/workshop/technicianSpecialty.interface.ts
export interface TechnicianSpecialty {
  id: string
  code: string
  name: string
  description?: string | null
  isActive: boolean
  empresaId: string
  createdAt: string
  updatedAt: string
}

export interface TechnicianSpecialtyFilters {
  page?: number
  limit?: number
  search?: string
  isActive?: 'true' | 'false'
}

export interface CreateTechnicianSpecialtyInput {
  code: string
  name: string
  description?: string | null
}

export interface UpdateTechnicianSpecialtyInput {
  name?: string
  description?: string | null
  isActive?: boolean
}
