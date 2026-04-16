import { IDealerFinancing } from './financing.interface.js'

export class CreateDealerFinancingDTO {
  dealerUnitId: string
  customerName: string
  customerDocument?: string
  customerPhone?: string
  customerEmail?: string
  bankName?: string
  planName?: string
  requestedAmount?: number | null
  downPaymentAmount?: number | null
  approvedAmount?: number | null
  termMonths?: number | null
  annualRatePct?: number | null
  installmentAmount?: number | null
  currency?: string
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
    if (data.bankName != null && String(data.bankName).trim() !== '') this.bankName = String(data.bankName).trim()
    if (data.planName != null && String(data.planName).trim() !== '') this.planName = String(data.planName).trim()
    if (data.requestedAmount !== undefined) this.requestedAmount = data.requestedAmount !== null ? Number(data.requestedAmount) : null
    if (data.downPaymentAmount !== undefined)
      this.downPaymentAmount = data.downPaymentAmount !== null ? Number(data.downPaymentAmount) : null
    if (data.approvedAmount !== undefined) this.approvedAmount = data.approvedAmount !== null ? Number(data.approvedAmount) : null
    if (data.termMonths !== undefined) this.termMonths = data.termMonths !== null ? Number(data.termMonths) : null
    if (data.annualRatePct !== undefined) this.annualRatePct = data.annualRatePct !== null ? Number(data.annualRatePct) : null
    if (data.installmentAmount !== undefined)
      this.installmentAmount = data.installmentAmount !== null ? Number(data.installmentAmount) : null
    if (data.currency != null && String(data.currency).trim() !== '') this.currency = String(data.currency).trim()
    if (data.notes != null && String(data.notes).trim() !== '') this.notes = String(data.notes).trim()
    if (data.status != null && String(data.status).trim() !== '') this.status = String(data.status).trim()
  }
}

export class UpdateDealerFinancingDTO {
  customerName?: string
  customerDocument?: string | null
  customerPhone?: string | null
  customerEmail?: string | null
  bankName?: string | null
  planName?: string | null
  requestedAmount?: number | null
  downPaymentAmount?: number | null
  approvedAmount?: number | null
  termMonths?: number | null
  annualRatePct?: number | null
  installmentAmount?: number | null
  currency?: string | null
  notes?: string | null
  status?: string
  isActive?: boolean

  constructor(data: Record<string, unknown>) {
    if (data.customerName !== undefined) this.customerName = String(data.customerName).trim()
    if (data.customerDocument !== undefined) this.customerDocument = data.customerDocument ? String(data.customerDocument).trim() : null
    if (data.customerPhone !== undefined) this.customerPhone = data.customerPhone ? String(data.customerPhone).trim() : null
    if (data.customerEmail !== undefined) this.customerEmail = data.customerEmail ? String(data.customerEmail).trim() : null
    if (data.bankName !== undefined) this.bankName = data.bankName ? String(data.bankName).trim() : null
    if (data.planName !== undefined) this.planName = data.planName ? String(data.planName).trim() : null
    if (data.requestedAmount !== undefined) this.requestedAmount = data.requestedAmount !== null ? Number(data.requestedAmount) : null
    if (data.downPaymentAmount !== undefined)
      this.downPaymentAmount = data.downPaymentAmount !== null ? Number(data.downPaymentAmount) : null
    if (data.approvedAmount !== undefined) this.approvedAmount = data.approvedAmount !== null ? Number(data.approvedAmount) : null
    if (data.termMonths !== undefined) this.termMonths = data.termMonths !== null ? Number(data.termMonths) : null
    if (data.annualRatePct !== undefined) this.annualRatePct = data.annualRatePct !== null ? Number(data.annualRatePct) : null
    if (data.installmentAmount !== undefined)
      this.installmentAmount = data.installmentAmount !== null ? Number(data.installmentAmount) : null
    if (data.currency !== undefined) this.currency = data.currency ? String(data.currency).trim() : null
    if (data.notes !== undefined) this.notes = data.notes ? String(data.notes).trim() : null
    if (data.status !== undefined) this.status = String(data.status).trim()
    if (data.isActive !== undefined) this.isActive = Boolean(data.isActive)
  }
}

export class DealerFinancingResponseDTO {
  id: string
  financingNumber: string
  status: string
  customerName: string
  requestedAmount?: any | null
  approvedAmount?: any | null
  termMonths?: number | null
  createdAt: Date
  dealerUnit: IDealerFinancing['dealerUnit']

  constructor(data: IDealerFinancing) {
    this.id = data.id
    this.financingNumber = data.financingNumber
    this.status = data.status
    this.customerName = data.customerName
    this.createdAt = data.createdAt
    this.dealerUnit = data.dealerUnit
    if (data.requestedAmount != null) this.requestedAmount = data.requestedAmount
    if (data.approvedAmount != null) this.approvedAmount = data.approvedAmount
    if (data.termMonths != null) this.termMonths = data.termMonths
  }
}
