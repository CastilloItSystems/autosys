// libs/interfaces/workshop/ingressMotive.interface.ts
export interface IngressMotive {
  id: string
  code: string
  name: string
  description?: string | null
  isActive: boolean
  empresaId: string
  createdAt: string
  updatedAt: string
}

export interface IngressMotiveFilters {
  page?: number
  limit?: number
  search?: string
  isActive?: 'true' | 'false'
}

export interface CreateIngressMotiveInput {
  code: string
  name: string
  description?: string | null
}

export interface UpdateIngressMotiveInput {
  name?: string
  description?: string | null
  isActive?: boolean
}
