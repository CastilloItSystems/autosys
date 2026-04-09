// backend/src/features/crm/quotes/quotes.interface.ts

export type QuoteStatus = 'DRAFT' | 'ISSUED' | 'SENT' | 'NEGOTIATING' | 'APPROVED' | 'REJECTED' | 'EXPIRED' | 'CONVERTED'
export type QuoteType = 'VEHICLE' | 'PARTS' | 'SERVICE' | 'CORPORATE'

export interface IQuoteItem {
  id: string
  quoteId: string
  description: string
  quantity: number
  unitPrice: number
  discountPct: number
  taxPct: number
  total: number
  itemId?: string | null
  notes?: string | null
}

export interface IQuote {
  id: string
  quoteNumber: string
  version: number
  parentId?: string | null
  type: QuoteType
  status: QuoteStatus
  customerId: string
  customer?: { id: string; name: string; code: string } | null
  leadId?: string | null
  lead?: { id: string; title: string; channel: string } | null
  title: string
  description?: string | null
  subtotal: number
  discountPct: number
  discountAmt: number
  taxPct: number
  taxAmt: number
  total: number
  currency: string
  issuedAt?: string | null
  validUntil?: string | null
  paymentTerms?: string | null
  deliveryTerms?: string | null
  notes?: string | null
  convertedAt?: string | null
  convertedTo?: string | null
  convertedRefId?: string | null
  assignedTo?: string | null
  createdBy: string
  empresaId: string
  items: IQuoteItem[]
  versions?: IQuote[]
  createdAt: string
  updatedAt: string
}

export interface IQuoteFilters {
  type?: string
  status?: string
  customerId?: string
  leadId?: string
  assignedTo?: string
  search?: string
  dateFrom?: string
  dateTo?: string
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}
