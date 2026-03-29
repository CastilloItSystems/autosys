// backend/src/features/crm/cases/cases.interface.ts

export type CaseType =
  | 'SALE_COMPLAINT'
  | 'WORKSHOP_COMPLAINT'
  | 'PARTS_COMPLAINT'
  | 'WARRANTY'
  | 'GENERAL_INQUIRY'
  | 'SUGGESTION'
  | 'INCIDENT'
  | 'SERVICE_COMPLAINT'

export type CasePriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

export type CaseStatus =
  | 'OPEN'
  | 'IN_ANALYSIS'
  | 'IN_PROGRESS'
  | 'WAITING_CLIENT'
  | 'ESCALATED'
  | 'RESOLVED'
  | 'CLOSED'
  | 'REJECTED'

export interface ICaseComment {
  id: string
  caseId: string
  comment: string
  isInternal: boolean
  createdBy: string
  createdAt: string
}

export interface ICase {
  id: string
  caseNumber: string
  type: CaseType
  priority: CasePriority
  status: CaseStatus
  customerId: string
  customer?: { id: string; name: string; code: string; phone?: string | null; mobile?: string | null } | null
  customerVehicleId?: string | null
  customerVehicle?: { id: string; plate: string } | null
  leadId?: string | null
  lead?: { id: string; title: string; channel: string } | null
  refDocType?: string | null
  refDocId?: string | null
  refDocNumber?: string | null
  title: string
  description: string
  resolution?: string | null
  rootCause?: string | null
  slaDeadline?: string | null
  resolvedAt?: string | null
  closedAt?: string | null
  assignedTo?: string | null
  createdBy: string
  empresaId: string
  comments?: ICaseComment[]
  createdAt: string
  updatedAt: string
}

export interface ICaseFilters {
  type?: string
  priority?: string
  status?: string
  customerId?: string
  assignedTo?: string
  search?: string
  dateFrom?: string
  dateTo?: string
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}
