import { ILoyaltyEvent } from './loyalty.interface.js'

export class CreateLoyaltyRecordDTO {
  type: 'EVENT' | 'SURVEY'
  customerId: string
  eventType?: string
  title?: string
  description?: string
  suggestedAction?: string
  dueAt?: string
  status?: string

  source?: string
  score?: number
  feedback?: string

  constructor(data: Record<string, unknown>) {
    this.type = String(data.type).trim() as 'EVENT' | 'SURVEY'
    this.customerId = String(data.customerId).trim()

    if (data.eventType != null && String(data.eventType).trim() !== '') this.eventType = String(data.eventType).trim()
    if (data.title != null && String(data.title).trim() !== '') this.title = String(data.title).trim()
    if (data.description != null && String(data.description).trim() !== '') this.description = String(data.description).trim()
    if (data.suggestedAction != null && String(data.suggestedAction).trim() !== '') this.suggestedAction = String(data.suggestedAction).trim()
    if (data.dueAt != null && String(data.dueAt).trim() !== '') this.dueAt = String(data.dueAt).trim()
    if (data.status != null && String(data.status).trim() !== '') this.status = String(data.status).trim()

    if (data.source != null && String(data.source).trim() !== '') this.source = String(data.source).trim()
    if (data.score !== undefined && data.score !== null) this.score = Number(data.score)
    if (data.feedback != null && String(data.feedback).trim() !== '') this.feedback = String(data.feedback).trim()
  }
}

export class LoyaltyEventResponseDTO {
  id: string
  empresaId: string
  customerId: string
  type: string
  status: string
  title: string
  description?: string | null
  suggestedAction?: string | null
  dueAt?: Date | null
  completedAt?: Date | null
  createdBy: string
  createdAt: Date
  updatedAt: Date

  constructor(data: ILoyaltyEvent) {
    this.id = data.id
    this.empresaId = data.empresaId
    this.customerId = data.customerId
    this.type = data.type
    this.status = data.status
    this.title = data.title
    this.createdBy = data.createdBy
    this.createdAt = data.createdAt
    this.updatedAt = data.updatedAt

    if (data.description != null) this.description = data.description
    if (data.suggestedAction != null) this.suggestedAction = data.suggestedAction
    if (data.dueAt != null) this.dueAt = data.dueAt
    if (data.completedAt != null) this.completedAt = data.completedAt
  }
}
