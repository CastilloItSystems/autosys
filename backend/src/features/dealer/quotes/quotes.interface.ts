import { DealerQuoteStatus } from '../../../generated/prisma/client.js'

export interface IDealerQuoteUnit {
  id: string
  code?: string | null
  vin?: string | null
  plate?: string | null
  status: string
  brand: {
    id: string
    code: string
    name: string
  }
  model?: {
    id: string
    name: string
    year?: number | null
  } | null
}

export interface IDealerQuote {
  id: string
  empresaId: string
  dealerUnitId: string
  quoteNumber: string
  status: DealerQuoteStatus
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
  dealerUnit: IDealerQuoteUnit
}

export interface IDealerQuoteFilters {
  dealerUnitId?: string
  status?: string
  isActive?: boolean
  search?: string
  fromDate?: Date
  toDate?: Date
}
