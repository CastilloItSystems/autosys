// backend/src/features/workshop/workshopTOT/workshopTOT.interface.ts

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

export interface ITOTDocument {
  id: string
  totId: string
  type: TOTDocumentType
  url: string
  description?: string | null
  uploadedBy: string
  createdAt: Date
}

export interface ITOT {
  id: string
  totNumber: string
  status: TOTStatus
  serviceOrderId: string
  providerId?: string | null
  providerName?: string | null
  partDescription: string
  partSerial?: string | null
  photoUrls?: any | null
  requestedWork: string
  technicalInstruction?: string | null
  approvedById?: string | null
  departureRef?: string | null
  departedAt?: Date | null
  estimatedReturnAt?: Date | null
  returnedAt?: Date | null
  providerQuote?: any | null
  finalCost?: any | null
  providerInvoiceRef?: string | null
  notes?: string | null
  documents?: ITOTDocument[]
  empresaId: string
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

export interface ICreateTOT {
  serviceOrderId: string
  supplierId?: string
  providerName?: string
  partDescription: string
  partSerial?: string
  photoUrls?: string[]
  requestedWork: string
  technicalInstruction?: string
  estimatedReturnAt?: Date
  providerQuote?: number
  notes?: string
}

export interface IUpdateTOT {
  supplierId?: string | null
  providerName?: string | null
  partDescription?: string
  partSerial?: string | null
  photoUrls?: string[] | null
  requestedWork?: string
  technicalInstruction?: string | null
  approvedById?: string | null
  departureRef?: string | null
  departedAt?: Date | null
  estimatedReturnAt?: Date | null
  returnedAt?: Date | null
  providerQuote?: number | null
  finalCost?: number | null
  providerInvoiceRef?: string | null
  notes?: string | null
}

export interface ITOTFilters {
  status?: TOTStatus
  serviceOrderId?: string
  supplierId?: string
  search?: string
  page?: number
  limit?: number
}

export interface IAddTOTDocument {
  type: TOTDocumentType
  url: string
  description?: string
}
