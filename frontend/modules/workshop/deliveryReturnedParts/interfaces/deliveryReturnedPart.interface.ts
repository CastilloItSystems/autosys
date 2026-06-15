// libs/interfaces/workshop/deliveryReturnedPart.interface.ts

export type ReturnedPartCondition =
  | 'WHOLE'
  | 'DAMAGED'
  | 'IN_PIECES'
  | 'REPLACED'
  | 'OTHER'

export interface DeliveryReturnedPart {
  id: string
  deliveryId: string
  materialId: string | null
  description: string
  quantity: number
  condition: ReturnedPartCondition
  clientAcknowledged: boolean
  clientAcknowledgedAt: string | null
  clientSignature: string | null
  photoUrl: string | null
  notes: string | null
  empresaId: string
  createdAt: string
}

export interface CreateReturnedPartInput {
  deliveryId: string
  materialId?: string | null
  description: string
  quantity?: number
  condition?: ReturnedPartCondition
  clientAcknowledged?: boolean
  clientSignature?: string
  photoUrl?: string
  notes?: string
}
