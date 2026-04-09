// libs/interfaces/crm/case.interface.ts

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

export interface CaseComment {
  id: string
  caseId: string
  comment: string
  isInternal: boolean
  createdBy: string
  createdAt: string
}

export interface Case {
  id: string
  caseNumber: string
  type: CaseType | string
  priority: CasePriority | string
  status: CaseStatus | string
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
  comments?: CaseComment[]
  createdAt: string
  updatedAt: string
}

export interface CaseListResponse {
  data: Case[]
  meta: { page: number; limit: number; total: number; totalPages: number }
}

// ── UI config ──────────────────────────────────────────────────────────────

export const CASE_STATUS_CONFIG: Record<string, { label: string; severity: 'secondary' | 'info' | 'success' | 'warning' | 'danger'; icon: string }> = {
  OPEN:           { label: 'Abierto',              severity: 'info',      icon: 'pi pi-folder-open' },
  IN_ANALYSIS:    { label: 'En análisis',           severity: 'info',      icon: 'pi pi-search' },
  IN_PROGRESS:    { label: 'En proceso',            severity: 'warning',   icon: 'pi pi-spinner' },
  WAITING_CLIENT: { label: 'Esperando cliente',     severity: 'warning',   icon: 'pi pi-clock' },
  ESCALATED:      { label: 'Escalado',              severity: 'danger',    icon: 'pi pi-arrow-up' },
  RESOLVED:       { label: 'Resuelto',              severity: 'success',   icon: 'pi pi-check' },
  CLOSED:         { label: 'Cerrado',               severity: 'secondary', icon: 'pi pi-lock' },
  REJECTED:       { label: 'Rechazado',             severity: 'danger',    icon: 'pi pi-times' },
}

export const CASE_PRIORITY_CONFIG: Record<string, { label: string; severity: 'secondary' | 'info' | 'success' | 'warning' | 'danger'; icon: string }> = {
  LOW:      { label: 'Baja',     severity: 'secondary', icon: 'pi pi-minus' },
  MEDIUM:   { label: 'Media',    severity: 'info',      icon: 'pi pi-minus-circle' },
  HIGH:     { label: 'Alta',     severity: 'warning',   icon: 'pi pi-exclamation-circle' },
  CRITICAL: { label: 'Crítica',  severity: 'danger',    icon: 'pi pi-exclamation-triangle' },
}

export const CASE_TYPE_CONFIG: Record<string, { label: string }> = {
  SALE_COMPLAINT:     { label: 'Reclamo de venta' },
  WORKSHOP_COMPLAINT: { label: 'Reclamo de taller' },
  PARTS_COMPLAINT:    { label: 'Reclamo de repuesto' },
  WARRANTY:           { label: 'Garantía' },
  GENERAL_INQUIRY:    { label: 'Consulta general' },
  SUGGESTION:         { label: 'Sugerencia' },
  INCIDENT:           { label: 'Incidente' },
  SERVICE_COMPLAINT:  { label: 'Queja por atención' },
}

export const CASE_STATUS_OPTIONS = Object.entries(CASE_STATUS_CONFIG).map(([value, cfg]) => ({ label: cfg.label, value }))
export const CASE_PRIORITY_OPTIONS = Object.entries(CASE_PRIORITY_CONFIG).map(([value, cfg]) => ({ label: cfg.label, value }))
export const CASE_TYPE_OPTIONS = Object.entries(CASE_TYPE_CONFIG).map(([value, cfg]) => ({ label: cfg.label, value }))
