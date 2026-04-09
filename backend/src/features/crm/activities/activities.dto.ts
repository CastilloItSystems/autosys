// backend/src/features/crm/activities/activities.dto.ts

import { IActivity } from './activities.interface.js'

export class CreateActivityDTO {
  customerId: string
  type: string
  title: string
  assignedTo: string
  dueAt: string
  leadId?: string
  description?: string

  constructor(data: Record<string, unknown>) {
    this.customerId = String(data.customerId).trim()
    this.type = String(data.type)
    this.title = String(data.title).trim()
    this.assignedTo = String(data.assignedTo).trim()
    this.dueAt = String(data.dueAt)
    if (data.leadId != null && String(data.leadId).trim() !== '')
      this.leadId = String(data.leadId).trim()
    if (data.description != null && String(data.description).trim() !== '')
      this.description = String(data.description).trim()
  }
}

export class UpdateActivityDTO {
  customerId?: string
  type?: string
  title?: string
  assignedTo?: string
  dueAt?: string
  leadId?: string
  description?: string
  status?: string

  constructor(data: Record<string, unknown>) {
    if (data.customerId !== undefined) this.customerId = String(data.customerId).trim()
    if (data.type !== undefined) this.type = String(data.type)
    if (data.title !== undefined) this.title = String(data.title).trim()
    if (data.assignedTo !== undefined) this.assignedTo = String(data.assignedTo).trim()
    if (data.dueAt !== undefined) this.dueAt = String(data.dueAt)
    if (data.leadId !== undefined) this.leadId = data.leadId ? String(data.leadId).trim() : undefined
    if (data.description !== undefined) this.description = data.description ? String(data.description).trim() : undefined
    if (data.status !== undefined) this.status = String(data.status)
  }
}

export class CompleteActivityDTO {
  outcome?: string
  completedAt?: string

  constructor(data: Record<string, unknown>) {
    if (data.outcome != null && String(data.outcome).trim() !== '')
      this.outcome = String(data.outcome).trim()
    if (data.completedAt != null && String(data.completedAt).trim() !== '')
      this.completedAt = String(data.completedAt).trim()
  }
}

export class ActivityResponseDTO {
  id: string
  empresaId: string
  customerId: string
  leadId?: string | null
  type: string
  status: string
  title: string
  description?: string | null
  assignedTo: string
  dueAt: Date
  completedAt?: Date | null
  completedBy?: string | null
  outcome?: string | null
  createdBy: string
  createdAt: Date
  updatedAt: Date

  constructor(data: IActivity) {
    this.id = data.id
    this.empresaId = data.empresaId
    this.customerId = data.customerId
    this.type = data.type
    this.status = data.status
    this.title = data.title
    this.assignedTo = data.assignedTo
    this.dueAt = data.dueAt
    this.createdBy = data.createdBy
    this.createdAt = data.createdAt
    this.updatedAt = data.updatedAt
    if (data.leadId != null) this.leadId = data.leadId
    if (data.description != null) this.description = data.description
    if (data.completedAt != null) this.completedAt = data.completedAt
    if (data.completedBy != null) this.completedBy = data.completedBy
    if (data.outcome != null) this.outcome = data.outcome
  }
}
