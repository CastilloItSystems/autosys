// backend/src/features/workshop/serviceOrderAdditionals/serviceOrderAdditionals.dto.ts

export interface ServiceOrderAdditionalDTO {
  id: string
  description: string
  estimatedPrice: number
  status: 'PROPOSED' | 'QUOTED' | 'APPROVED' | 'EXECUTED' | 'REJECTED'
  serviceOrderId: string
  createdAt: Date
  updatedAt: Date
}

export interface CreateServiceOrderAdditionalDTO {
  description: string
  estimatedPrice: number
  status?: 'PROPOSED' | 'QUOTED' | 'APPROVED' | 'EXECUTED' | 'REJECTED'
  serviceOrderId: string
}

export interface UpdateServiceOrderAdditionalDTO extends Partial<CreateServiceOrderAdditionalDTO> {}
