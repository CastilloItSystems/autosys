import { DealerDocumentReferenceType, DealerDocumentStatus } from '../../../generated/prisma/client.js'

export interface IDealerDocument {
  id: string
  empresaId: string
  dealerUnitId?: string | null
  referenceType: DealerDocumentReferenceType
  referenceId?: string | null
  documentType: string
  documentNumber?: string | null
  name: string
  fileUrl: string
  mimeType?: string | null
  sizeBytes?: number | null
  issuedAt?: Date | null
  expiresAt?: Date | null
  status: DealerDocumentStatus
  notes?: string | null
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  dealerUnit?: {
    id: string
    code?: string | null
    vin?: string | null
    brand: { id: string; code: string; name: string }
    model?: { id: string; name: string; year?: number | null } | null
  } | null
}

export interface IDealerDocumentFilters {
  dealerUnitId?: string
  referenceType?: string
  referenceId?: string
  status?: string
  isActive?: boolean
  search?: string
  expiringDays?: number
}
