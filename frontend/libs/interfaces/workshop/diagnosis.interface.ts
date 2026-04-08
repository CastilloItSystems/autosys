// libs/interfaces/workshop/diagnosis.interface.ts

// Alineado con el backend: DRAFT | COMPLETED | APPROVED_INTERNAL
export type DiagnosisStatus = 'DRAFT' | 'COMPLETED' | 'APPROVED_INTERNAL'

export type DiagnosisFindingSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

export interface DiagnosisFinding {
  id: string
  diagnosisId: string
  category?: string | null
  description: string
  severity: DiagnosisFindingSeverity
  requiresClientAuth: boolean
  isHiddenFinding: boolean
  clientApproved?: boolean | null
  observation?: string | null
  createdAt?: string
}

export interface DiagnosisEvidence {
  id: string
  diagnosisId: string
  type: string // 'photo' | 'video' | 'document'
  url: string
  description?: string | null
  createdAt?: string
}

export interface DiagnosisSuggestedOp {
  id: string
  diagnosisId: string
  operationId?: string | null
  description: string
  estimatedMins?: number | null
  estimatedPrice?: number | null
}

export interface DiagnosisSuggestedPart {
  id: string
  diagnosisId: string
  itemId?: string | null
  description: string
  quantity?: number | null
  estimatedCost?: number | null
  estimatedPrice?: number | null
}

export interface DiagnosisReceptionRef {
  id: string
  code?: string | null
}

export interface DiagnosisServiceOrderRef {
  id: string
  folio?: string | null
}

export interface DiagnosisTechnicianRef {
  id: string
  name?: string | null
}

export interface Diagnosis {
  id: string
  receptionId?: string | null
  serviceOrderId?: string | null
  technicianId?: string | null
  generalNotes?: string | null
  severity?: DiagnosisFindingSeverity | null
  status: DiagnosisStatus
  startedAt?: string | null
  finishedAt?: string | null
  reception?: DiagnosisReceptionRef | null
  serviceOrder?: DiagnosisServiceOrderRef | null
  technician?: DiagnosisTechnicianRef | null
  findings?: DiagnosisFinding[]
  evidences?: DiagnosisEvidence[]
  suggestedOperations?: DiagnosisSuggestedOp[]
  suggestedParts?: DiagnosisSuggestedPart[]
  createdAt: string
  updatedAt: string
}

export interface DiagnosisFilters {
  search?: string
  status?: DiagnosisStatus | 'ALL'
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface CreateDiagnosisInput {
  receptionId?: string
  serviceOrderId?: string
  technicianId?: string
  generalNotes?: string
  severity?: DiagnosisFindingSeverity
}

export interface UpdateDiagnosisInput {
  receptionId?: string | null
  serviceOrderId?: string | null
  technicianId?: string | null
  generalNotes?: string | null
  severity?: DiagnosisFindingSeverity | null
  status?: DiagnosisStatus
}

export interface CreateFindingInput {
  category?: string
  description: string
  severity: DiagnosisFindingSeverity
  requiresClientAuth?: boolean
  isHiddenFinding?: boolean
  observation?: string
}

export interface CreateSuggestedOpInput {
  operationId?: string
  description: string
  estimatedMins?: number
  estimatedPrice?: number
}

export interface CreateSuggestedPartInput {
  itemId?: string
  description: string
  quantity?: number
  estimatedCost?: number
  estimatedPrice?: number
}
