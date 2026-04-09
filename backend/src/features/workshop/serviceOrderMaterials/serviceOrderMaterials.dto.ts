// backend/src/features/workshop/serviceOrderMaterials/serviceOrderMaterials.dto.ts

export interface ServiceOrderMaterialDTO {
  id: string
  code: string
  description: string
  quantity: number
  unitPrice: number
  totalPrice: number
  status: 'REQUESTED' | 'RESERVED' | 'DISPATCHED' | 'CONSUMED' | 'RETURNED'
  serviceOrderId: string
  itemId: string | null
  createdAt: Date
  updatedAt: Date
}

export interface CreateServiceOrderMaterialDTO {
  code: string
  description: string
  quantity: number
  unitPrice: number
  totalPrice?: number
  status?: 'REQUESTED' | 'RESERVED' | 'DISPATCHED' | 'CONSUMED' | 'RETURNED'
  serviceOrderId: string
  itemId?: string
}

export interface UpdateServiceOrderMaterialDTO extends Partial<CreateServiceOrderMaterialDTO> {}
