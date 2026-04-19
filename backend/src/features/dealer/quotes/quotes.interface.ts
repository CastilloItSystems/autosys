import { DealerQuoteStatus } from '../../../generated/prisma/client.js'

export interface IDealerQuoteUnit {
  id: string
  code?: string | null
  vin?: string | null
  plate?: string | null
  itemId: string
  warehouseId: string
  item: {
    id: string
    code: string
    sku: string
    name: string
  }
  warehouse: {
    id: string
    code: string
    name: string
  }
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
  customerId: string
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
  currency: 'USD' | 'VES' | 'EUR'
  exchangeRate?: any | null
  exchangeRateSource?: 'BCV_AUTO' | 'MANUAL' | null
  fiscalStatus: 'NOT_REQUESTED' | 'ORDER_DRAFT' | 'ORDER_APPROVED' | 'PREINVOICE_READY' | 'PAID' | 'INVOICED' | 'ERROR'
  fiscalError?: string | null
  salesOrderId?: string | null
  preInvoiceId?: string | null
  invoiceId?: string | null
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
  customer: {
    id: string
    code: string
    name: string
    phone?: string | null
    email?: string | null
    taxId?: string | null
  }
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
