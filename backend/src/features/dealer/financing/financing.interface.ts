import { DealerFinancingStatus } from '../../../generated/prisma/client.js'

export interface IDealerFinancing {
  id: string
  empresaId: string
  dealerUnitId: string
  financingNumber: string
  status: DealerFinancingStatus
  customerName: string
  customerDocument?: string | null
  customerPhone?: string | null
  customerEmail?: string | null
  bankName?: string | null
  planName?: string | null
  requestedAmount?: any | null
  downPaymentAmount?: any | null
  approvedAmount?: any | null
  termMonths?: number | null
  annualRatePct?: any | null
  installmentAmount?: any | null
  currency?: string | null
  notes?: string | null
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  dealerUnit: {
    id: string
    code?: string | null
    vin?: string | null
    brand: { id: string; code: string; name: string }
    model?: { id: string; name: string; year?: number | null } | null
  }
}

export interface IDealerFinancingFilters {
  dealerUnitId?: string
  status?: string
  isActive?: boolean
  search?: string
  fromDate?: Date
  toDate?: Date
}
