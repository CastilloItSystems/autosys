import { DealerApprovalStatus, DealerApprovalType } from '../../../generated/prisma/client.js'

export interface IDealerApproval {
  id: string
  empresaId: string
  dealerUnitId?: string | null
  referenceType?: string | null
  referenceId?: string | null
  approvalNumber: string
  type: DealerApprovalType
  status: DealerApprovalStatus
  title: string
  reason?: string | null
  requestedBy?: string | null
  requestedAmount?: any | null
  requestedPct?: any | null
  resolvedBy?: string | null
  resolvedAt?: Date | null
  resolutionNotes?: string | null
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

export interface IDealerApprovalFilters {
  dealerUnitId?: string
  type?: string
  status?: string
  isActive?: boolean
  search?: string
}
