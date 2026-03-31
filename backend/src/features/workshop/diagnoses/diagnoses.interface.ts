// backend/src/features/workshop/diagnoses/diagnoses.interface.ts
import {
  DiagnosisStatus,
  DiagnosisFindingSeverity,
} from '../../../generated/prisma/client.js'

export interface ICreateDiagnosisInput {
  receptionId?: string
  serviceOrderId?: string
  technicianId?: string
  generalNotes?: string
  severity?: DiagnosisFindingSeverity
}

export interface IUpdateDiagnosisInput {
  status?: DiagnosisStatus
  generalNotes?: string
  severity?: DiagnosisFindingSeverity
  technicianId?: string
  startedAt?: Date
  finishedAt?: Date
}

export interface ICreateDiagnosisFindingInput {
  category?: string
  description: string
  severity?: DiagnosisFindingSeverity
  requiresClientAuth?: boolean
  observation?: string
}

export interface ICreateDiagnosisSuggestedOpInput {
  operationId?: string
  description: string
  estimatedMins?: number
  estimatedPrice?: number
}

export interface ICreateDiagnosisSuggestedPartInput {
  itemId?: string
  description: string
  quantity?: number
  estimatedCost?: number
  estimatedPrice?: number
}
