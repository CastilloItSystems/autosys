// backend/src/features/crm/leads/leads.dto.ts

import { ILead } from './leads.interface.js'

export class CreateLeadDTO {
  title: string
  channel: string
  source: string
  customerId?: string
  description?: string
  estimatedValue?: number
  currency?: string
  assignedTo?: string
  expectedCloseAt?: string

  constructor(data: Record<string, unknown>) {
    this.title = String(data.title).trim()
    this.channel = String(data.channel)
    this.source = String(data.source)
    if (data.customerId != null && String(data.customerId).trim() !== '')
      this.customerId = String(data.customerId).trim()
    if (data.description != null && String(data.description).trim() !== '')
      this.description = String(data.description).trim()
    if (data.estimatedValue !== undefined && data.estimatedValue !== null)
      this.estimatedValue = Number(data.estimatedValue)
    if (data.currency != null && String(data.currency).trim() !== '')
      this.currency = String(data.currency).trim()
    if (data.assignedTo != null && String(data.assignedTo).trim() !== '')
      this.assignedTo = String(data.assignedTo).trim()
    if (data.expectedCloseAt != null && String(data.expectedCloseAt).trim() !== '')
      this.expectedCloseAt = String(data.expectedCloseAt).trim()
  }
}

export class UpdateLeadDTO {
  title?: string
  channel?: string
  source?: string
  customerId?: string
  description?: string
  estimatedValue?: number
  currency?: string
  assignedTo?: string
  expectedCloseAt?: string
  lostReason?: string
  closedAt?: string

  constructor(data: Record<string, unknown>) {
    if (data.title !== undefined) this.title = String(data.title).trim()
    if (data.channel !== undefined) this.channel = String(data.channel)
    if (data.source !== undefined) this.source = String(data.source)
    if (data.customerId !== undefined)
      this.customerId = data.customerId ? String(data.customerId).trim() : undefined
    if (data.description !== undefined)
      this.description = data.description ? String(data.description).trim() : undefined
    if (data.estimatedValue !== undefined)
      this.estimatedValue = data.estimatedValue !== null ? Number(data.estimatedValue) : undefined
    if (data.currency !== undefined)
      this.currency = data.currency ? String(data.currency).trim() : undefined
    if (data.assignedTo !== undefined)
      this.assignedTo = data.assignedTo ? String(data.assignedTo).trim() : undefined
    if (data.expectedCloseAt !== undefined)
      this.expectedCloseAt = data.expectedCloseAt ? String(data.expectedCloseAt) : undefined
    if (data.lostReason !== undefined)
      this.lostReason = data.lostReason ? String(data.lostReason).trim() : undefined
    if (data.closedAt !== undefined)
      this.closedAt = data.closedAt ? String(data.closedAt) : undefined
  }
}

export class UpdateLeadStatusDTO {
  status: string
  lostReason?: string
  closedAt?: string

  constructor(data: Record<string, unknown>) {
    this.status = String(data.status)
    if (data.lostReason != null && String(data.lostReason).trim() !== '')
      this.lostReason = String(data.lostReason).trim()
    if (data.closedAt != null && String(data.closedAt).trim() !== '')
      this.closedAt = String(data.closedAt).trim()
  }
}

export class ConvertLeadDTO {
  ownerId?: string
  nextActivityAt: string
  stageCode?: string
  expectedCloseAt?: string
  amount?: number
  campaignId?: string
  notes?: string

  constructor(data: Record<string, unknown>) {
    if (data.ownerId != null && String(data.ownerId).trim() !== '')
      this.ownerId = String(data.ownerId).trim()
    this.nextActivityAt = String(data.nextActivityAt)
    if (data.stageCode != null && String(data.stageCode).trim() !== '')
      this.stageCode = String(data.stageCode).trim()
    if (data.expectedCloseAt != null && String(data.expectedCloseAt).trim() !== '')
      this.expectedCloseAt = String(data.expectedCloseAt).trim()
    if (data.amount !== undefined && data.amount !== null)
      this.amount = Number(data.amount)
    if (data.campaignId != null && String(data.campaignId).trim() !== '')
      this.campaignId = String(data.campaignId).trim()
    if (data.notes != null && String(data.notes).trim() !== '')
      this.notes = String(data.notes).trim()
  }
}

export class LeadResponseDTO {
  id: string
  empresaId: string
  customerId?: string | null
  channel: string
  source: string
  status: string
  title: string
  description?: string | null
  estimatedValue?: any | null
  currency: string
  assignedTo?: string | null
  expectedCloseAt?: Date | null
  closedAt?: Date | null
  lostReason?: string | null
  orderId?: string | null
  createdAt: Date
  updatedAt: Date

  constructor(data: ILead) {
    this.id = data.id
    this.empresaId = data.empresaId
    this.channel = data.channel
    this.source = data.source
    this.status = data.status
    this.title = data.title
    this.currency = data.currency
    this.createdAt = data.createdAt
    this.updatedAt = data.updatedAt
    if (data.customerId != null) this.customerId = data.customerId
    if (data.description != null) this.description = data.description
    if (data.estimatedValue != null) this.estimatedValue = data.estimatedValue
    if (data.assignedTo != null) this.assignedTo = data.assignedTo
    if (data.expectedCloseAt != null) this.expectedCloseAt = data.expectedCloseAt
    if (data.closedAt != null) this.closedAt = data.closedAt
    if (data.lostReason != null) this.lostReason = data.lostReason
    if (data.orderId != null) this.orderId = data.orderId
  }
}
