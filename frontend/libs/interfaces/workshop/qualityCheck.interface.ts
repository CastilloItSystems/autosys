// libs/interfaces/workshop/qualityCheck.interface.ts
import type { OrderRef } from './shared.interface'

export type QualityCheckStatus = 'PENDING' | 'IN_PROGRESS' | 'PASSED' | 'FAILED'

export interface ChecklistItem {
  key: string
  label: string
  passed: boolean
  notes?: string | null
}

export interface QualityCheck {
  id: string
  serviceOrderId: string
  serviceOrder: OrderRef | null
  inspectorId: string
  status: QualityCheckStatus
  checklistItems: ChecklistItem[] | null
  failureNotes: string | null
  retryCount: number
  passedItems: number
  failedItems: number
  totalItems: number
  startedAt: string | null
  completedAt: string | null
  notes: string | null
  createdBy: string
  createdAt: string
  updatedAt: string
}

export interface CreateQualityCheckInput {
  serviceOrderId: string
  inspectorId: string
  checklistItems?: ChecklistItem[]
  notes?: string
}

export interface SubmitQualityCheckInput {
  checklistItems: ChecklistItem[]
  failureNotes?: string
  notes?: string
}
