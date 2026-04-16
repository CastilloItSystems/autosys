import { DealerAfterSaleStatus, DealerAfterSaleType } from '../../../generated/prisma/client.js'

export interface IDealerAfterSale {
  id: string
  empresaId: string
  dealerUnitId?: string | null
  referenceType?: string | null
  referenceId?: string | null
  caseNumber: string
  type: DealerAfterSaleType
  status: DealerAfterSaleStatus
  customerName: string
  customerPhone?: string | null
  customerEmail?: string | null
  title: string
  description?: string | null
  openedAt: Date
  dueAt?: Date | null
  resolvedAt?: Date | null
  closedAt?: Date | null
  assignedTo?: string | null
  resolutionNotes?: string | null
  satisfactionScore?: number | null
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  dealerUnit?: {
    id: string
    code?: string | null
    vin?: string | null
    brand: { id: string; code: string; name: string }
    model?: { id: string; name: string; year?: number | null } | null
  } | null
}

export interface IDealerAfterSaleFilters {
  dealerUnitId?: string
  type?: string
  status?: string
  isActive?: boolean
  search?: string
}
