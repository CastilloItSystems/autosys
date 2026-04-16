import { IDealerDocument } from './documents.interface.js'

export class CreateDealerDocumentDTO {
  dealerUnitId?: string
  referenceType: string
  referenceId?: string
  documentType: string
  documentNumber?: string
  name: string
  fileUrl: string
  mimeType?: string
  sizeBytes?: number | null
  issuedAt?: Date | null
  expiresAt?: Date | null
  status?: string
  notes?: string

  constructor(data: Record<string, unknown>) {
    this.referenceType = String(data.referenceType).trim()
    this.documentType = String(data.documentType).trim()
    this.name = String(data.name).trim()
    this.fileUrl = String(data.fileUrl).trim()
    if (data.dealerUnitId != null && String(data.dealerUnitId).trim() !== '') this.dealerUnitId = String(data.dealerUnitId).trim()
    if (data.referenceId != null && String(data.referenceId).trim() !== '') this.referenceId = String(data.referenceId).trim()
    if (data.documentNumber != null && String(data.documentNumber).trim() !== '')
      this.documentNumber = String(data.documentNumber).trim()
    if (data.mimeType != null && String(data.mimeType).trim() !== '') this.mimeType = String(data.mimeType).trim()
    if (data.sizeBytes !== undefined) this.sizeBytes = data.sizeBytes !== null ? Number(data.sizeBytes) : null
    if (data.issuedAt !== undefined) this.issuedAt = data.issuedAt ? new Date(String(data.issuedAt)) : null
    if (data.expiresAt !== undefined) this.expiresAt = data.expiresAt ? new Date(String(data.expiresAt)) : null
    if (data.status != null && String(data.status).trim() !== '') this.status = String(data.status).trim()
    if (data.notes != null && String(data.notes).trim() !== '') this.notes = String(data.notes).trim()
  }
}

export class UpdateDealerDocumentDTO {
  dealerUnitId?: string | null
  referenceType?: string
  referenceId?: string | null
  documentType?: string
  documentNumber?: string | null
  name?: string
  fileUrl?: string
  mimeType?: string | null
  sizeBytes?: number | null
  issuedAt?: Date | null
  expiresAt?: Date | null
  status?: string
  notes?: string | null
  isActive?: boolean

  constructor(data: Record<string, unknown>) {
    if (data.dealerUnitId !== undefined) this.dealerUnitId = data.dealerUnitId ? String(data.dealerUnitId).trim() : null
    if (data.referenceType !== undefined) this.referenceType = String(data.referenceType).trim()
    if (data.referenceId !== undefined) this.referenceId = data.referenceId ? String(data.referenceId).trim() : null
    if (data.documentType !== undefined) this.documentType = String(data.documentType).trim()
    if (data.documentNumber !== undefined) this.documentNumber = data.documentNumber ? String(data.documentNumber).trim() : null
    if (data.name !== undefined) this.name = String(data.name).trim()
    if (data.fileUrl !== undefined) this.fileUrl = String(data.fileUrl).trim()
    if (data.mimeType !== undefined) this.mimeType = data.mimeType ? String(data.mimeType).trim() : null
    if (data.sizeBytes !== undefined) this.sizeBytes = data.sizeBytes !== null ? Number(data.sizeBytes) : null
    if (data.issuedAt !== undefined) this.issuedAt = data.issuedAt ? new Date(String(data.issuedAt)) : null
    if (data.expiresAt !== undefined) this.expiresAt = data.expiresAt ? new Date(String(data.expiresAt)) : null
    if (data.status !== undefined) this.status = String(data.status).trim()
    if (data.notes !== undefined) this.notes = data.notes ? String(data.notes).trim() : null
    if (data.isActive !== undefined) this.isActive = Boolean(data.isActive)
  }
}

export class DealerDocumentResponseDTO {
  id: string
  referenceType: string
  referenceId?: string | null
  documentType: string
  documentNumber?: string | null
  name: string
  fileUrl: string
  status: string
  issuedAt?: Date | null
  expiresAt?: Date | null
  createdAt: Date
  dealerUnit?: IDealerDocument['dealerUnit']

  constructor(data: IDealerDocument) {
    this.id = data.id
    this.referenceType = data.referenceType
    this.documentType = data.documentType
    this.name = data.name
    this.fileUrl = data.fileUrl
    this.status = data.status
    this.createdAt = data.createdAt
    if (data.referenceId != null) this.referenceId = data.referenceId
    if (data.documentNumber != null) this.documentNumber = data.documentNumber
    if (data.issuedAt != null) this.issuedAt = data.issuedAt
    if (data.expiresAt != null) this.expiresAt = data.expiresAt
    if (data.dealerUnit !== undefined) this.dealerUnit = data.dealerUnit
  }
}
