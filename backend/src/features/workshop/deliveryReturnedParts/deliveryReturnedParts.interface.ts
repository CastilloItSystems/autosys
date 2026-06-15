// backend/src/features/workshop/deliveryReturnedParts/deliveryReturnedParts.interface.ts

export type ReturnedPartCondition =
  | 'WHOLE'
  | 'DAMAGED'
  | 'IN_PIECES'
  | 'REPLACED'
  | 'OTHER'

export interface ICreateReturnedPart {
  deliveryId: string
  materialId?: string | null
  description: string
  quantity?: number
  condition?: ReturnedPartCondition
  clientAcknowledged?: boolean
  clientSignature?: string | null
  photoUrl?: string | null
  notes?: string | null
}

export interface IUpdateReturnedPart extends Partial<ICreateReturnedPart> {}
