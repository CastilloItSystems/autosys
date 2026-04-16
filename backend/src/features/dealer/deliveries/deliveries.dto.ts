import { IDealerDelivery } from './deliveries.interface.js'

export class CreateDealerDeliveryDTO {
  dealerUnitId: string
  customerName: string
  customerDocument?: string
  customerPhone?: string
  customerEmail?: string
  scheduledAt: Date
  advisorName?: string
  checklistCompleted?: boolean
  documentsSigned?: boolean
  accessoriesDelivered?: boolean
  observations?: string
  actNumber?: string
  status?: string

  constructor(data: Record<string, unknown>) {
    this.dealerUnitId = String(data.dealerUnitId).trim()
    this.customerName = String(data.customerName).trim()
    this.scheduledAt = new Date(String(data.scheduledAt))
    if (data.customerDocument != null && String(data.customerDocument).trim() !== '')
      this.customerDocument = String(data.customerDocument).trim()
    if (data.customerPhone != null && String(data.customerPhone).trim() !== '')
      this.customerPhone = String(data.customerPhone).trim()
    if (data.customerEmail != null && String(data.customerEmail).trim() !== '')
      this.customerEmail = String(data.customerEmail).trim()
    if (data.advisorName != null && String(data.advisorName).trim() !== '')
      this.advisorName = String(data.advisorName).trim()
    if (data.checklistCompleted !== undefined) this.checklistCompleted = Boolean(data.checklistCompleted)
    if (data.documentsSigned !== undefined) this.documentsSigned = Boolean(data.documentsSigned)
    if (data.accessoriesDelivered !== undefined) this.accessoriesDelivered = Boolean(data.accessoriesDelivered)
    if (data.observations != null && String(data.observations).trim() !== '') this.observations = String(data.observations).trim()
    if (data.actNumber != null && String(data.actNumber).trim() !== '') this.actNumber = String(data.actNumber).trim()
    if (data.status != null && String(data.status).trim() !== '') this.status = String(data.status).trim()
  }
}

export class UpdateDealerDeliveryDTO {
  customerName?: string
  customerDocument?: string | null
  customerPhone?: string | null
  customerEmail?: string | null
  scheduledAt?: Date
  advisorName?: string | null
  checklistCompleted?: boolean
  documentsSigned?: boolean
  accessoriesDelivered?: boolean
  observations?: string | null
  actNumber?: string | null
  status?: string
  isActive?: boolean

  constructor(data: Record<string, unknown>) {
    if (data.customerName !== undefined) this.customerName = String(data.customerName).trim()
    if (data.customerDocument !== undefined) this.customerDocument = data.customerDocument ? String(data.customerDocument).trim() : null
    if (data.customerPhone !== undefined) this.customerPhone = data.customerPhone ? String(data.customerPhone).trim() : null
    if (data.customerEmail !== undefined) this.customerEmail = data.customerEmail ? String(data.customerEmail).trim() : null
    if (data.scheduledAt !== undefined) this.scheduledAt = new Date(String(data.scheduledAt))
    if (data.advisorName !== undefined) this.advisorName = data.advisorName ? String(data.advisorName).trim() : null
    if (data.checklistCompleted !== undefined) this.checklistCompleted = Boolean(data.checklistCompleted)
    if (data.documentsSigned !== undefined) this.documentsSigned = Boolean(data.documentsSigned)
    if (data.accessoriesDelivered !== undefined) this.accessoriesDelivered = Boolean(data.accessoriesDelivered)
    if (data.observations !== undefined) this.observations = data.observations ? String(data.observations).trim() : null
    if (data.actNumber !== undefined) this.actNumber = data.actNumber ? String(data.actNumber).trim() : null
    if (data.status !== undefined) this.status = String(data.status).trim()
    if (data.isActive !== undefined) this.isActive = Boolean(data.isActive)
  }
}

export class DealerDeliveryResponseDTO {
  id: string
  deliveryNumber: string
  status: string
  customerName: string
  scheduledAt: Date
  deliveredAt?: Date | null
  checklistCompleted: boolean
  documentsSigned: boolean
  accessoriesDelivered: boolean
  createdAt: Date
  dealerUnit: IDealerDelivery['dealerUnit']

  constructor(data: IDealerDelivery) {
    this.id = data.id
    this.deliveryNumber = data.deliveryNumber
    this.status = data.status
    this.customerName = data.customerName
    this.scheduledAt = data.scheduledAt
    this.checklistCompleted = data.checklistCompleted
    this.documentsSigned = data.documentsSigned
    this.accessoriesDelivered = data.accessoriesDelivered
    this.createdAt = data.createdAt
    this.dealerUnit = data.dealerUnit
    if (data.deliveredAt != null) this.deliveredAt = data.deliveredAt
  }
}
