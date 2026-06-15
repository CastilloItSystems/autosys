import { IDealerCommission } from './commissions.interface.js'

export class UpdateDealerCommissionDTO {
  status?: string
  commissionPct?: number
  sellerId?: string | null
  sellerName?: string | null
  notes?: string | null
  isActive?: boolean

  constructor(data: Record<string, unknown>) {
    if (data.status !== undefined) this.status = String(data.status).trim()
    if (data.commissionPct !== undefined) this.commissionPct = Number(data.commissionPct)
    if (data.sellerId !== undefined) this.sellerId = data.sellerId ? String(data.sellerId).trim() : null
    if (data.sellerName !== undefined) this.sellerName = data.sellerName ? String(data.sellerName).trim() : null
    if (data.notes !== undefined) this.notes = data.notes ? String(data.notes).trim() : null
    if (data.isActive !== undefined) this.isActive = Boolean(data.isActive)
  }
}

export class DealerCommissionResponseDTO {
  id: string
  dealerQuoteId?: string | null
  salesOrderId?: string | null
  sellerId?: string | null
  sellerName?: string | null
  baseAmount: any
  commissionPct: any
  commissionAmount: any
  currency: string
  status: string
  paidAt?: Date | null
  notes?: string | null
  isActive: boolean
  createdAt: Date
  dealerQuote?: IDealerCommission['dealerQuote']

  constructor(data: IDealerCommission) {
    this.id = data.id
    this.dealerQuoteId = data.dealerQuoteId ?? null
    this.salesOrderId = data.salesOrderId ?? null
    this.sellerId = data.sellerId ?? null
    this.sellerName = data.sellerName ?? null
    this.baseAmount = data.baseAmount
    this.commissionPct = data.commissionPct
    this.commissionAmount = data.commissionAmount
    this.currency = data.currency
    this.status = data.status
    this.paidAt = data.paidAt ?? null
    this.notes = data.notes ?? null
    this.isActive = data.isActive
    this.createdAt = data.createdAt
    if (data.dealerQuote !== undefined) this.dealerQuote = data.dealerQuote
  }
}
