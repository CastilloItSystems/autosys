// libs/interfaces/workshop/tot.interface.ts
import type { WorkshopPagedResponse, WorkshopResponse } from './shared.interface'

export type TOTStatus =
  | 'REQUESTED'
  | 'APPROVED'
  | 'DEPARTED'
  | 'IN_PROGRESS'
  | 'RETURNED'
  | 'INVOICED'
  | 'CANCELLED'

export type TOTDocumentType =
  | 'PROVIDER_QUOTE'
  | 'DELIVERY_ACT'
  | 'RETURN_ACT'
  | 'PROVIDER_INVOICE'
  | 'OTHER'

export interface TOTDocument {
  id: string
  totId: string
  type: TOTDocumentType
  url: string
  description?: string | null
  uploadedBy: string
  createdAt: string
}

export interface WorkshopTOT {
  id: string
  totNumber: string
  status: TOTStatus
  serviceOrderId: string
  serviceOrder?: { id: string; folio: string; status: string } | null
  supplierId?: string | null
  supplier?: { id: string; code: string; name: string; specialty?: string | null; phone?: string | null; email?: string | null } | null
  providerName?: string | null
  partDescription: string
  partSerial?: string | null
  photoUrls?: string[] | null
  requestedWork: string
  technicalInstruction?: string | null
  approvedById?: string | null
  departureRef?: string | null
  departedAt?: string | null
  estimatedReturnAt?: string | null
  returnedAt?: string | null
  providerQuote?: number | null
  finalCost?: number | null
  providerInvoiceRef?: string | null
  notes?: string | null
  documents: TOTDocument[]
  empresaId: string
  createdBy: string
  createdAt: string
  updatedAt: string
}

export interface TOTFilters {
  status?: TOTStatus
  serviceOrderId?: string
  supplierId?: string
  search?: string
  page?: number
  limit?: number
}

export interface CreateTOTInput {
  serviceOrderId: string
  supplierId?: string | null
  providerName?: string | null
  partDescription: string
  partSerial?: string | null
  photoUrls?: string[] | null
  requestedWork: string
  technicalInstruction?: string | null
  estimatedReturnAt?: string | null
  providerQuote?: number | null
  notes?: string | null
}

export interface UpdateTOTInput {
  supplierId?: string | null
  providerName?: string | null
  partDescription?: string
  partSerial?: string | null
  photoUrls?: string[] | null
  requestedWork?: string
  technicalInstruction?: string | null
  approvedById?: string | null
  departureRef?: string | null
  departedAt?: string | null
  estimatedReturnAt?: string | null
  returnedAt?: string | null
  providerQuote?: number | null
  finalCost?: number | null
  providerInvoiceRef?: string | null
  notes?: string | null
}

export interface AddTOTDocumentInput {
  type: TOTDocumentType
  url: string
  description?: string | null
}

export type TOTPagedResponse = WorkshopPagedResponse<WorkshopTOT>
export type TOTResponse = WorkshopResponse<WorkshopTOT>
