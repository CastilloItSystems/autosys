// backend/src/features/workshop/deliveries/deliveries.interface.ts
export interface ICreateDeliveryInput {
  serviceOrderId: string
  deliveredBy: string
  receivedByName: string
  clientConformity?: boolean
  clientSignature?: string
  observations?: string
  nextVisitDate?: Date
}

// FASE 1.1: Update input - allows partial updates
export interface IUpdateDeliveryInput {
  receivedByName?: string
  clientConformity?: boolean
  clientSignature?: string
  observations?: string
  nextVisitDate?: Date
}
