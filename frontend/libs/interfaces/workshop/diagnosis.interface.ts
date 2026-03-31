// libs/interfaces/workshop/diagnosis.interface.ts

export type DiagnosisStatus = 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED' | 'APPROVED'

export type DiagnosisFindingSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

export interface DiagnosisFinding {
  id: string
  diagnosisId: string
  category?: string | null
  description: string
  severity: DiagnosisFindingSeverity
  requiresClientAuth: boolean
  observation?: string | null
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
  reception?: DiagnosisReceptionRef | null
  serviceOrder?: DiagnosisServiceOrderRef | null
  technician?: DiagnosisTechnicianRef | null
  findings?: DiagnosisFinding[]
  suggestedOps?: DiagnosisSuggestedOp[]
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
