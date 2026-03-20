// backend/src/features/sales/payments/payments.dto.ts

export class CreatePaymentDTO {
  preInvoiceId: string
  method: string
  amount: number
  currency?: string
  exchangeRate?: number
  igtfApplies?: boolean
  details?: any[]
  reference?: string
  notes?: string

  constructor(data: Record<string, unknown>) {
    this.preInvoiceId = String(data.preInvoiceId)
    this.method = String(data.method)
    this.amount = Number(data.amount)
    if (data.currency !== undefined) this.currency = String(data.currency)
    if (data.exchangeRate !== undefined) this.exchangeRate = Number(data.exchangeRate)
    if (data.igtfApplies !== undefined) this.igtfApplies = Boolean(data.igtfApplies)
    if (Array.isArray(data.details)) this.details = data.details as any[]
    if (data.reference != null && String(data.reference).trim() !== '')
      this.reference = String(data.reference).trim()
    if (data.notes != null && String(data.notes).trim() !== '')
      this.notes = String(data.notes).trim()
  }
}

export class PaymentResponseDTO {
  id: string
  paymentNumber: string
  status: string
  preInvoiceId: string
  customerId: string
  method: string
  amount: number
  currency: string
  exchangeRate?: number
  igtfApplies: boolean
  igtfAmount: number
  totalWithIgtf: number
  details?: any[]
  reference?: string | null
  notes?: string | null
  processedBy?: string | null
  processedAt: Date
  preInvoice?: any
  customer?: any
  createdAt: Date
  updatedAt: Date

  constructor(data: Record<string, unknown>) {
    this.id = String(data.id)
    this.paymentNumber = String(data.paymentNumber)
    this.status = String(data.status)
    this.preInvoiceId = String(data.preInvoiceId)
    this.customerId = String(data.customerId)
    this.method = String(data.method)
    this.amount = Number(data.amount ?? 0)
    this.currency = String(data.currency ?? 'USD')
    this.igtfApplies = Boolean(data.igtfApplies)
    this.igtfAmount = Number(data.igtfAmount ?? 0)
    this.totalWithIgtf = Number(data.totalWithIgtf ?? 0)
    this.processedAt = data.processedAt as Date
    this.createdAt = data.createdAt as Date
    this.updatedAt = data.updatedAt as Date

    if (data.exchangeRate != null) this.exchangeRate = Number(data.exchangeRate)
    if (data.details != null) this.details = data.details as any[]
    if (data.reference != null) this.reference = String(data.reference)
    if (data.notes != null) this.notes = String(data.notes)
    if (data.processedBy != null) this.processedBy = String(data.processedBy)
    if (data.preInvoice != null) this.preInvoice = data.preInvoice
    if (data.customer != null) this.customer = data.customer
  }
}
