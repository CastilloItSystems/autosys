// backend/src/features/workshop/deliveries/deliveries.interface.ts
export interface ICreateDeliveryInput {
  serviceOrderId: string
  deliveredBy?: string
  receivedByName?: string
  clientConformity?: boolean
  clientSignature?: string
  observations?: string
  nextVisitDate?: Date
}
