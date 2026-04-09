// backend/src/features/workshop/deliveries/deliveries.dto.ts

export class CreateDeliveryDTO {
  serviceOrderId: string
  deliveredBy: string
  receivedByName: string
  clientConformity?: boolean
  clientSignature?: string
  observations?: string
  nextVisitDate?: Date

  constructor(data: any) {
    this.serviceOrderId = data.serviceOrderId
    this.deliveredBy = data.deliveredBy
    this.receivedByName = data.receivedByName?.trim() ?? ''
    this.clientConformity =
      data.clientConformity !== undefined
        ? Boolean(data.clientConformity)
        : undefined
    this.clientSignature = data.clientSignature?.trim() ?? undefined
    this.observations = data.observations?.trim() ?? undefined
    this.nextVisitDate = data.nextVisitDate
      ? new Date(data.nextVisitDate)
      : undefined
  }
}

// FASE 2.5: OrderRef interface for response
interface OrderRef {
  id: string
  folio: string
  status: string
}

export class DeliveryResponseDTO {
  id: string
  serviceOrderId: string
  serviceOrder?: OrderRef | null
  deliveredAt: Date
  deliveredBy: string
  receivedByName: string | null
  clientConformity: boolean
  clientSignature: string | null
  observations: string | null
  nextVisitDate: Date | null
  createdAt: Date
  updatedAt: Date

  constructor(data: any) {
    this.id = data.id
    this.serviceOrderId = data.serviceOrderId
    // FASE 2.5: Map serviceOrder relation
    this.serviceOrder = data.serviceOrder ?? null
    this.deliveredAt = data.deliveredAt
    this.deliveredBy = data.deliveredBy
    this.receivedByName = data.receivedByName ?? null
    this.clientConformity = data.clientConformity
    this.clientSignature = data.clientSignature ?? null
    this.observations = data.observations ?? null
    this.nextVisitDate = data.nextVisitDate ?? null
    this.createdAt = data.createdAt
    this.updatedAt = data.updatedAt
  }
}
