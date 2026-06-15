import { DealerCommissionStatus, OrderCurrency } from '../../../generated/prisma/client.js'

export interface IDealerCommission {
  id: string
  empresaId: string
  dealerQuoteId?: string | null
  salesOrderId?: string | null
  sellerId?: string | null
  sellerName?: string | null
  baseAmount: any
  commissionPct: any
  commissionAmount: any
  currency: OrderCurrency
  status: DealerCommissionStatus
  paidAt?: Date | null
  notes?: string | null
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  dealerQuote?: {
    id: string
    quoteNumber: string
    customerName: string
  } | null
}

export interface IDealerCommissionFilters {
  dealerQuoteId?: string
  sellerId?: string
  status?: string
  isActive?: boolean
  search?: string
}
