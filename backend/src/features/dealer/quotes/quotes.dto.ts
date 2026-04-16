import { IDealerQuote } from './quotes.interface.js'

export class CreateDealerQuoteDTO {
  dealerUnitId: string
  customerName: string
  customerDocument?: string
  customerPhone?: string
  customerEmail?: string
  listPrice?: number | null
  discountPct?: number | null
  offeredPrice?: number | null
  taxPct?: number | null
  currency?: string
  validUntil?: Date | null
  paymentTerms?: string
  financingRequired?: boolean
  notes?: string
  status?: string

  constructor(data: Record<string, unknown>) {
    this.dealerUnitId = String(data.dealerUnitId).trim()
    this.customerName = String(data.customerName).trim()
    if (data.customerDocument != null && String(data.customerDocument).trim() !== '')
      this.customerDocument = String(data.customerDocument).trim()
    if (data.customerPhone != null && String(data.customerPhone).trim() !== '')
      this.customerPhone = String(data.customerPhone).trim()
    if (data.customerEmail != null && String(data.customerEmail).trim() !== '')
      this.customerEmail = String(data.customerEmail).trim()
    if (data.listPrice !== undefined) this.listPrice = data.listPrice !== null ? Number(data.listPrice) : null
    if (data.discountPct !== undefined) this.discountPct = data.discountPct !== null ? Number(data.discountPct) : null
    if (data.offeredPrice !== undefined) this.offeredPrice = data.offeredPrice !== null ? Number(data.offeredPrice) : null
    if (data.taxPct !== undefined) this.taxPct = data.taxPct !== null ? Number(data.taxPct) : null
    if (data.currency != null && String(data.currency).trim() !== '') this.currency = String(data.currency).trim()
    if (data.validUntil !== undefined) this.validUntil = data.validUntil ? new Date(data.validUntil as string) : null
    if (data.paymentTerms != null && String(data.paymentTerms).trim() !== '')
      this.paymentTerms = String(data.paymentTerms).trim()
    if (data.financingRequired !== undefined) this.financingRequired = Boolean(data.financingRequired)
    if (data.notes != null && String(data.notes).trim() !== '') this.notes = String(data.notes).trim()
    if (data.status != null && String(data.status).trim() !== '') this.status = String(data.status).trim()
  }
}

export class UpdateDealerQuoteDTO {
  customerName?: string
  customerDocument?: string | null
  customerPhone?: string | null
  customerEmail?: string | null
  listPrice?: number | null
  discountPct?: number | null
  offeredPrice?: number | null
  taxPct?: number | null
  currency?: string | null
  validUntil?: Date | null
  paymentTerms?: string | null
  financingRequired?: boolean
  notes?: string | null
  status?: string
  isActive?: boolean

  constructor(data: Record<string, unknown>) {
    if (data.customerName !== undefined) this.customerName = String(data.customerName).trim()
    if (data.customerDocument !== undefined) this.customerDocument = data.customerDocument ? String(data.customerDocument).trim() : null
    if (data.customerPhone !== undefined) this.customerPhone = data.customerPhone ? String(data.customerPhone).trim() : null
    if (data.customerEmail !== undefined) this.customerEmail = data.customerEmail ? String(data.customerEmail).trim() : null
    if (data.listPrice !== undefined) this.listPrice = data.listPrice !== null ? Number(data.listPrice) : null
    if (data.discountPct !== undefined) this.discountPct = data.discountPct !== null ? Number(data.discountPct) : null
    if (data.offeredPrice !== undefined) this.offeredPrice = data.offeredPrice !== null ? Number(data.offeredPrice) : null
    if (data.taxPct !== undefined) this.taxPct = data.taxPct !== null ? Number(data.taxPct) : null
    if (data.currency !== undefined) this.currency = data.currency ? String(data.currency).trim() : null
    if (data.validUntil !== undefined) this.validUntil = data.validUntil ? new Date(data.validUntil as string) : null
    if (data.paymentTerms !== undefined) this.paymentTerms = data.paymentTerms ? String(data.paymentTerms).trim() : null
    if (data.financingRequired !== undefined) this.financingRequired = Boolean(data.financingRequired)
    if (data.notes !== undefined) this.notes = data.notes ? String(data.notes).trim() : null
    if (data.status !== undefined) this.status = String(data.status).trim()
    if (data.isActive !== undefined) this.isActive = Boolean(data.isActive)
  }
}

export class DealerQuoteResponseDTO {
  id: string
  empresaId: string
  dealerUnitId: string
  quoteNumber: string
  status: string
  customerName: string
  customerDocument?: string | null
  customerPhone?: string | null
  customerEmail?: string | null
  listPrice?: any | null
  discountPct?: any | null
  discountAmount?: any | null
  offeredPrice?: any | null
  taxPct?: any | null
  taxAmount?: any | null
  totalAmount?: any | null
  currency?: string | null
  validUntil?: Date | null
  paymentTerms?: string | null
  financingRequired: boolean
  notes?: string | null
  isActive: boolean
  sentAt?: Date | null
  approvedAt?: Date | null
  rejectedAt?: Date | null
  convertedAt?: Date | null
  createdAt: Date
  updatedAt: Date
  dealerUnit: IDealerQuote['dealerUnit']

  constructor(data: IDealerQuote) {
    this.id = data.id
    this.empresaId = data.empresaId
    this.dealerUnitId = data.dealerUnitId
    this.quoteNumber = data.quoteNumber
    this.status = data.status
    this.customerName = data.customerName
    this.financingRequired = data.financingRequired
    this.isActive = data.isActive
    this.createdAt = data.createdAt
    this.updatedAt = data.updatedAt
    this.dealerUnit = data.dealerUnit
    if (data.customerDocument != null) this.customerDocument = data.customerDocument
    if (data.customerPhone != null) this.customerPhone = data.customerPhone
    if (data.customerEmail != null) this.customerEmail = data.customerEmail
    if (data.listPrice != null) this.listPrice = data.listPrice
    if (data.discountPct != null) this.discountPct = data.discountPct
    if (data.discountAmount != null) this.discountAmount = data.discountAmount
    if (data.offeredPrice != null) this.offeredPrice = data.offeredPrice
    if (data.taxPct != null) this.taxPct = data.taxPct
    if (data.taxAmount != null) this.taxAmount = data.taxAmount
    if (data.totalAmount != null) this.totalAmount = data.totalAmount
    if (data.currency != null) this.currency = data.currency
    if (data.validUntil != null) this.validUntil = data.validUntil
    if (data.paymentTerms != null) this.paymentTerms = data.paymentTerms
    if (data.notes != null) this.notes = data.notes
    if (data.sentAt != null) this.sentAt = data.sentAt
    if (data.approvedAt != null) this.approvedAt = data.approvedAt
    if (data.rejectedAt != null) this.rejectedAt = data.rejectedAt
    if (data.convertedAt != null) this.convertedAt = data.convertedAt
  }
}
