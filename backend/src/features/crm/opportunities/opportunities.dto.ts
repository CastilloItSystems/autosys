import { IOpportunity } from './opportunities.interface.js'

export class CreateOpportunityDTO {
  leadId?: string
  customerId?: string
  campaignId?: string
  channel: string
  stageCode?: string
  title: string
  description?: string
  amount?: number
  currency?: string
  ownerId?: string
  nextActivityAt: string
  expectedCloseAt?: string

  constructor(data: Record<string, unknown>) {
    this.channel = String(data.channel)
    this.title = String(data.title).trim()
    if (data.ownerId != null && String(data.ownerId).trim() !== '')
      this.ownerId = String(data.ownerId).trim()
    this.nextActivityAt = String(data.nextActivityAt)

    if (data.leadId != null && String(data.leadId).trim() !== '') this.leadId = String(data.leadId).trim()
    if (data.customerId != null && String(data.customerId).trim() !== '') this.customerId = String(data.customerId).trim()
    if (data.campaignId != null && String(data.campaignId).trim() !== '') this.campaignId = String(data.campaignId).trim()
    if (data.stageCode != null && String(data.stageCode).trim() !== '') this.stageCode = String(data.stageCode).trim()
    if (data.description != null && String(data.description).trim() !== '') this.description = String(data.description).trim()
    if (data.amount !== undefined && data.amount !== null) this.amount = Number(data.amount)
    if (data.currency != null && String(data.currency).trim() !== '') this.currency = String(data.currency).trim()
    if (data.expectedCloseAt != null && String(data.expectedCloseAt).trim() !== '') this.expectedCloseAt = String(data.expectedCloseAt).trim()
  }
}

export class UpdateOpportunityDTO {
  customerId?: string
  campaignId?: string
  stageCode?: string
  title?: string
  description?: string
  amount?: number
  currency?: string
  ownerId?: string
  nextActivityAt?: string
  expectedCloseAt?: string

  constructor(data: Record<string, unknown>) {
    if (data.customerId !== undefined) this.customerId = data.customerId ? String(data.customerId).trim() : undefined
    if (data.campaignId !== undefined) this.campaignId = data.campaignId ? String(data.campaignId).trim() : undefined
    if (data.stageCode !== undefined) this.stageCode = String(data.stageCode).trim()
    if (data.title !== undefined) this.title = String(data.title).trim()
    if (data.description !== undefined) this.description = data.description ? String(data.description).trim() : undefined
    if (data.amount !== undefined) this.amount = data.amount !== null ? Number(data.amount) : undefined
    if (data.currency !== undefined) this.currency = data.currency ? String(data.currency).trim() : undefined
    if (data.ownerId !== undefined) this.ownerId = String(data.ownerId).trim()
    if (data.nextActivityAt !== undefined) this.nextActivityAt = String(data.nextActivityAt)
    if (data.expectedCloseAt !== undefined)
      this.expectedCloseAt = data.expectedCloseAt ? String(data.expectedCloseAt) : undefined
  }
}

export class UpdateOpportunityStageDTO {
  stageCode: string
  notes?: string

  constructor(data: Record<string, unknown>) {
    this.stageCode = String(data.stageCode).trim()
    if (data.notes != null && String(data.notes).trim() !== '') this.notes = String(data.notes).trim()
  }
}

export class CloseOpportunityDTO {
  result: 'WON' | 'LOST'
  lostReasonId?: string
  lostReasonText?: string
  notes?: string

  constructor(data: Record<string, unknown>) {
    this.result = String(data.result).trim() as 'WON' | 'LOST'
    if (data.lostReasonId != null && String(data.lostReasonId).trim() !== '') this.lostReasonId = String(data.lostReasonId).trim()
    if (data.lostReasonText != null && String(data.lostReasonText).trim() !== '') this.lostReasonText = String(data.lostReasonText).trim()
    if (data.notes != null && String(data.notes).trim() !== '') this.notes = String(data.notes).trim()
  }
}

export class OpportunityResponseDTO {
  id: string
  empresaId: string
  leadId?: string | null
  customerId?: string | null
  campaignId?: string | null
  channel: string
  stageCode: string
  status: string
  title: string
  description?: string | null
  amount?: any | null
  currency: string
  ownerId: string
  nextActivityAt: Date
  expectedCloseAt?: Date | null
  wonAt?: Date | null
  lostAt?: Date | null
  lostReasonId?: string | null
  lostReasonText?: string | null
  createdBy: string
  createdAt: Date
  updatedAt: Date

  constructor(data: IOpportunity) {
    this.id = data.id
    this.empresaId = data.empresaId
    this.channel = data.channel
    this.stageCode = data.stageCode
    this.status = data.status
    this.title = data.title
    this.currency = data.currency
    this.ownerId = data.ownerId
    this.nextActivityAt = data.nextActivityAt
    this.createdBy = data.createdBy
    this.createdAt = data.createdAt
    this.updatedAt = data.updatedAt

    if (data.leadId != null) this.leadId = data.leadId
    if (data.customerId != null) this.customerId = data.customerId
    if (data.campaignId != null) this.campaignId = data.campaignId
    if (data.description != null) this.description = data.description
    if (data.amount != null) this.amount = data.amount
    if (data.expectedCloseAt != null) this.expectedCloseAt = data.expectedCloseAt
    if (data.wonAt != null) this.wonAt = data.wonAt
    if (data.lostAt != null) this.lostAt = data.lostAt
    if (data.lostReasonId != null) this.lostReasonId = data.lostReasonId
    if (data.lostReasonText != null) this.lostReasonText = data.lostReasonText
  }
}
