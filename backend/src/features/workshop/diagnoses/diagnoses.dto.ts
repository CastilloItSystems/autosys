// backend/src/features/workshop/diagnoses/diagnoses.dto.ts
import {
  DiagnosisStatus,
  DiagnosisFindingSeverity,
} from '../../../generated/prisma/client.js'

export class CreateDiagnosisDTO {
  receptionId?: string
  serviceOrderId?: string
  technicianId?: string
  generalNotes?: string
  severity?: DiagnosisFindingSeverity

  constructor(data: any) {
    this.receptionId = data.receptionId ?? undefined
    this.serviceOrderId = data.serviceOrderId ?? undefined
    this.technicianId = data.technicianId ?? undefined
    this.generalNotes = data.generalNotes?.trim() ?? undefined
    this.severity = data.severity ?? undefined
  }
}

export class UpdateDiagnosisDTO {
  status?: DiagnosisStatus
  generalNotes?: string
  severity?: DiagnosisFindingSeverity
  technicianId?: string
  startedAt?: Date
  finishedAt?: Date

  constructor(data: any) {
    if (data.status !== undefined) this.status = data.status
    if (data.generalNotes !== undefined)
      this.generalNotes = data.generalNotes.trim()
    if (data.severity !== undefined) this.severity = data.severity
    if (data.technicianId !== undefined) this.technicianId = data.technicianId
    if (data.startedAt !== undefined) this.startedAt = new Date(data.startedAt)
    if (data.finishedAt !== undefined)
      this.finishedAt = new Date(data.finishedAt)
  }
}

export class CreateDiagnosisFindingDTO {
  category?: string
  description: string
  severity?: DiagnosisFindingSeverity
  requiresClientAuth?: boolean
  observation?: string

  constructor(data: any) {
    this.category = data.category?.trim() ?? undefined
    this.description = data.description?.trim()
    this.severity = data.severity ?? undefined
    this.requiresClientAuth =
      data.requiresClientAuth !== undefined
        ? Boolean(data.requiresClientAuth)
        : undefined
    this.observation = data.observation?.trim() ?? undefined
  }
}

export class CreateDiagnosisSuggestedOpDTO {
  operationId?: string
  description: string
  estimatedMins?: number
  estimatedPrice?: number

  constructor(data: any) {
    this.operationId = data.operationId ?? undefined
    this.description = data.description?.trim()
    this.estimatedMins =
      data.estimatedMins != null ? Number(data.estimatedMins) : undefined
    this.estimatedPrice =
      data.estimatedPrice != null ? Number(data.estimatedPrice) : undefined
  }
}

export class CreateDiagnosisSuggestedPartDTO {
  itemId?: string
  description: string
  quantity?: number
  estimatedCost?: number
  estimatedPrice?: number

  constructor(data: any) {
    this.itemId = data.itemId ?? undefined
    this.description = data.description?.trim()
    this.quantity = data.quantity != null ? Number(data.quantity) : undefined
    this.estimatedCost =
      data.estimatedCost != null ? Number(data.estimatedCost) : undefined
    this.estimatedPrice =
      data.estimatedPrice != null ? Number(data.estimatedPrice) : undefined
  }
}

export class DiagnosisResponseDTO {
  id: string
  receptionId: string | null
  serviceOrderId: string | null
  technicianId: string | null
  startedAt: Date | null
  finishedAt: Date | null
  generalNotes: string | null
  severity: DiagnosisFindingSeverity
  status: DiagnosisStatus
  findings: any[]
  evidences: any[]
  suggestedOperations: any[]
  suggestedParts: any[]
  createdBy: string
  createdAt: Date
  updatedAt: Date

  constructor(data: any) {
    this.id = data.id
    this.receptionId = data.receptionId ?? null
    this.serviceOrderId = data.serviceOrderId ?? null
    this.technicianId = data.technicianId ?? null
    this.startedAt = data.startedAt ?? null
    this.finishedAt = data.finishedAt ?? null
    this.generalNotes = data.generalNotes ?? null
    this.severity = data.severity
    this.status = data.status
    this.findings = data.findings ?? []
    this.evidences = data.evidences ?? []
    this.suggestedOperations = data.suggestedOperations ?? []
    this.suggestedParts = data.suggestedParts ?? []
    this.createdBy = data.createdBy
    this.createdAt = data.createdAt
    this.updatedAt = data.updatedAt
  }
}
