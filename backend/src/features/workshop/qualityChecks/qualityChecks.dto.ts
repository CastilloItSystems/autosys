// backend/src/features/workshop/qualityChecks/qualityChecks.dto.ts
import type { QualityCheckStatus, IChecklistItem } from './qualityChecks.interface.js'

export class CreateQualityCheckDTO {
  serviceOrderId: string
  inspectorId: string
  checklistItems?: IChecklistItem[]
  notes?: string

  constructor(data: any) {
    this.serviceOrderId = data.serviceOrderId
    this.inspectorId = data.inspectorId
    this.checklistItems = Array.isArray(data.checklistItems) ? data.checklistItems : undefined
    this.notes = data.notes?.trim() ?? undefined
  }
}

export class SubmitQualityCheckDTO {
  checklistItems: IChecklistItem[]
  failureNotes?: string
  notes?: string

  constructor(data: any) {
    this.checklistItems = Array.isArray(data.checklistItems) ? data.checklistItems : []
    this.failureNotes = data.failureNotes?.trim() ?? undefined
    this.notes = data.notes?.trim() ?? undefined
  }
}

export class QualityCheckResponseDTO {
  id: string
  serviceOrderId: string
  serviceOrder: any | null
  inspectorId: string
  status: QualityCheckStatus
  checklistItems: IChecklistItem[] | null
  failureNotes: string | null
  retryCount: number
  passedItems: number
  failedItems: number
  totalItems: number
  startedAt: Date | null
  completedAt: Date | null
  notes: string | null
  createdBy: string
  createdAt: Date
  updatedAt: Date

  constructor(data: any) {
    this.id = data.id
    this.serviceOrderId = data.serviceOrderId
    this.serviceOrder = data.serviceOrder ?? null
    this.inspectorId = data.inspectorId
    this.status = data.status
    this.checklistItems = data.checklistItems ?? null
    this.failureNotes = data.failureNotes ?? null
    this.retryCount = data.retryCount ?? 0
    this.startedAt = data.startedAt ?? null
    this.completedAt = data.completedAt ?? null
    this.notes = data.notes ?? null
    this.createdBy = data.createdBy
    this.createdAt = data.createdAt
    this.updatedAt = data.updatedAt

    // Calcular resumen del checklist
    const items: IChecklistItem[] = data.checklistItems ?? []
    this.totalItems = items.length
    this.passedItems = items.filter(i => i.passed).length
    this.failedItems = items.filter(i => !i.passed).length
  }
}
