// backend/src/features/sales/invoices/invoices.dto.ts

export class InvoiceResponseDTO {
  id: string
  invoiceNumber: string
  fiscalNumber?: string | null
  status: string
  preInvoiceId: string
  paymentId: string
  customerId: string
  currency: string
  exchangeRate?: number
  discountAmount: number
  subtotalBruto: number
  baseImponible: number
  baseExenta: number
  taxAmount: number
  taxRate: number
  igtfApplies: boolean
  igtfRate: number
  igtfAmount: number
  total: number
  notes?: string | null
  invoiceDate: Date
  issuedBy?: string | null
  cancelledAt?: Date | null
  cancelledBy?: string | null
  cancellationReason?: string | null
  items: any[]
  preInvoice?: any
  payment?: any
  customer?: any
  createdAt: Date
  updatedAt: Date

  constructor(data: Record<string, unknown>) {
    this.id = String(data.id)
    this.invoiceNumber = String(data.invoiceNumber)
    this.status = String(data.status)
    this.preInvoiceId = String(data.preInvoiceId)
    this.paymentId = String(data.paymentId)
    this.customerId = String(data.customerId)
    this.currency = String(data.currency ?? 'USD')
    this.discountAmount = Number(data.discountAmount ?? 0)
    this.subtotalBruto = Number(data.subtotalBruto ?? 0)
    this.baseImponible = Number(data.baseImponible ?? 0)
    this.baseExenta = Number(data.baseExenta ?? 0)
    this.taxAmount = Number(data.taxAmount ?? 0)
    this.taxRate = Number(data.taxRate ?? 16)
    this.igtfApplies = Boolean(data.igtfApplies)
    this.igtfRate = Number(data.igtfRate ?? 3)
    this.igtfAmount = Number(data.igtfAmount ?? 0)
    this.total = Number(data.total ?? 0)
    this.items = (data.items as any[]) ?? []
    this.invoiceDate = data.invoiceDate as Date
    this.createdAt = data.createdAt as Date
    this.updatedAt = data.updatedAt as Date

    if (data.fiscalNumber != null) this.fiscalNumber = String(data.fiscalNumber)
    if (data.exchangeRate != null) this.exchangeRate = Number(data.exchangeRate)
    if (data.notes != null) this.notes = String(data.notes)
    if (data.issuedBy != null) this.issuedBy = String(data.issuedBy)
    if (data.cancelledAt != null) this.cancelledAt = data.cancelledAt as Date
    if (data.cancelledBy != null) this.cancelledBy = String(data.cancelledBy)
    if (data.cancellationReason != null) this.cancellationReason = String(data.cancellationReason)
    if (data.preInvoice != null) this.preInvoice = data.preInvoice
    if (data.payment != null) this.payment = data.payment
    if (data.customer != null) this.customer = data.customer
  }
}
