// backend/src/features/workshop/qualityChecks/qualityChecks.interface.ts

export type QualityCheckStatus = 'PENDING' | 'IN_PROGRESS' | 'PASSED' | 'FAILED'

export interface IChecklistItem {
  item: string
  passed: boolean
  notes?: string
}

export interface IQualityCheck {
  id: string
  serviceOrderId: string
  inspectorId: string
  status: QualityCheckStatus
  checklistItems?: IChecklistItem[] | null
  failureNotes?: string | null
  retryCount: number
  startedAt?: Date | null
  completedAt?: Date | null
  notes?: string | null
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

export interface ICreateQualityCheckInput {
  serviceOrderId: string
  inspectorId: string
  checklistItems?: IChecklistItem[]
  notes?: string
}

export interface ISubmitQualityCheckInput {
  checklistItems: IChecklistItem[]
  failureNotes?: string
  notes?: string
}
