// backend/src/features/crm/interactions/interactions.dto.ts

import { IInteraction } from './interactions.interface.js'

export class CreateInteractionDTO {
  customerId: string
  type: string
  notes: string
  channel?: string
  direction?: string
  subject?: string
  outcome?: string
  nextAction?: string
  nextActionAt?: string
  leadId?: string

  constructor(data: Record<string, unknown>) {
    this.customerId = String(data.customerId).trim()
    this.type = String(data.type)
    this.notes = String(data.notes).trim()
    if (data.channel !== undefined) this.channel = String(data.channel)
    if (data.direction !== undefined) this.direction = String(data.direction)
    if (data.subject != null && String(data.subject).trim() !== '')
      this.subject = String(data.subject).trim()
    if (data.outcome != null && String(data.outcome).trim() !== '')
      this.outcome = String(data.outcome).trim()
    if (data.nextAction != null && String(data.nextAction).trim() !== '')
      this.nextAction = String(data.nextAction).trim()
    if (data.nextActionAt != null && String(data.nextActionAt).trim() !== '')
      this.nextActionAt = String(data.nextActionAt).trim()
    if (data.leadId != null && String(data.leadId).trim() !== '')
      this.leadId = String(data.leadId).trim()
  }
}

export class UpdateInteractionDTO {
  type?: string
  notes?: string
  channel?: string
  direction?: string
  subject?: string
  outcome?: string
  nextAction?: string
  nextActionAt?: string
  leadId?: string

  constructor(data: Record<string, unknown>) {
    if (data.type !== undefined) this.type = String(data.type)
    if (data.notes !== undefined) this.notes = String(data.notes).trim()
    if (data.channel !== undefined) this.channel = String(data.channel)
    if (data.direction !== undefined) this.direction = String(data.direction)
    if (data.subject !== undefined) this.subject = data.subject ? String(data.subject).trim() : undefined
    if (data.outcome !== undefined) this.outcome = data.outcome ? String(data.outcome).trim() : undefined
    if (data.nextAction !== undefined) this.nextAction = data.nextAction ? String(data.nextAction).trim() : undefined
    if (data.nextActionAt !== undefined) this.nextActionAt = data.nextActionAt ? String(data.nextActionAt) : undefined
    if (data.leadId !== undefined) this.leadId = data.leadId ? String(data.leadId).trim() : undefined
  }
}

export class InteractionResponseDTO {
  id: string
  empresaId: string
  customerId: string
  leadId?: string | null
  type: string
  channel: string
  direction: string
  subject?: string | null
  notes: string
  outcome?: string | null
  nextAction?: string | null
  nextActionAt?: Date | null
  createdBy: string
  createdAt: Date
  updatedAt: Date

  constructor(data: IInteraction) {
    this.id = data.id
    this.empresaId = data.empresaId
    this.customerId = data.customerId
    this.type = data.type
    this.channel = data.channel
    this.direction = data.direction
    this.notes = data.notes
    this.createdBy = data.createdBy
    this.createdAt = data.createdAt
    this.updatedAt = data.updatedAt
    if (data.leadId != null) this.leadId = data.leadId
    if (data.subject != null) this.subject = data.subject
    if (data.outcome != null) this.outcome = data.outcome
    if (data.nextAction != null) this.nextAction = data.nextAction
    if (data.nextActionAt != null) this.nextActionAt = data.nextActionAt
  }
}
