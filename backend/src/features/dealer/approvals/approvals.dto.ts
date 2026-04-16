import { IDealerApproval } from './approvals.interface.js'

export class CreateDealerApprovalDTO {
  dealerUnitId?: string
  referenceType?: string
  referenceId?: string
  type: string
  status?: string
  title: string
  reason?: string
  requestedBy?: string
  requestedAmount?: number | null
  requestedPct?: number | null
  resolutionNotes?: string

  constructor(data: Record<string, unknown>) {
    this.type = String(data.type).trim()
    this.title = String(data.title).trim()
    if (data.dealerUnitId != null && String(data.dealerUnitId).trim() !== '') this.dealerUnitId = String(data.dealerUnitId).trim()
    if (data.referenceType != null && String(data.referenceType).trim() !== '') this.referenceType = String(data.referenceType).trim()
    if (data.referenceId != null && String(data.referenceId).trim() !== '') this.referenceId = String(data.referenceId).trim()
    if (data.status != null && String(data.status).trim() !== '') this.status = String(data.status).trim()
    if (data.reason != null && String(data.reason).trim() !== '') this.reason = String(data.reason).trim()
    if (data.requestedBy != null && String(data.requestedBy).trim() !== '') this.requestedBy = String(data.requestedBy).trim()
    if (data.requestedAmount !== undefined) this.requestedAmount = data.requestedAmount !== null ? Number(data.requestedAmount) : null
    if (data.requestedPct !== undefined) this.requestedPct = data.requestedPct !== null ? Number(data.requestedPct) : null
    if (data.resolutionNotes != null && String(data.resolutionNotes).trim() !== '')
      this.resolutionNotes = String(data.resolutionNotes).trim()
  }
}

export class UpdateDealerApprovalDTO {
  dealerUnitId?: string | null
  referenceType?: string | null
  referenceId?: string | null
  type?: string
  status?: string
  title?: string
  reason?: string | null
  requestedBy?: string | null
  requestedAmount?: number | null
  requestedPct?: number | null
  resolutionNotes?: string | null
  isActive?: boolean

  constructor(data: Record<string, unknown>) {
    if (data.dealerUnitId !== undefined) this.dealerUnitId = data.dealerUnitId ? String(data.dealerUnitId).trim() : null
    if (data.referenceType !== undefined) this.referenceType = data.referenceType ? String(data.referenceType).trim() : null
    if (data.referenceId !== undefined) this.referenceId = data.referenceId ? String(data.referenceId).trim() : null
    if (data.type !== undefined) this.type = String(data.type).trim()
    if (data.status !== undefined) this.status = String(data.status).trim()
    if (data.title !== undefined) this.title = String(data.title).trim()
    if (data.reason !== undefined) this.reason = data.reason ? String(data.reason).trim() : null
    if (data.requestedBy !== undefined) this.requestedBy = data.requestedBy ? String(data.requestedBy).trim() : null
    if (data.requestedAmount !== undefined) this.requestedAmount = data.requestedAmount !== null ? Number(data.requestedAmount) : null
    if (data.requestedPct !== undefined) this.requestedPct = data.requestedPct !== null ? Number(data.requestedPct) : null
    if (data.resolutionNotes !== undefined) this.resolutionNotes = data.resolutionNotes ? String(data.resolutionNotes).trim() : null
    if (data.isActive !== undefined) this.isActive = Boolean(data.isActive)
  }
}

export class DealerApprovalResponseDTO {
  id: string
  approvalNumber: string
  type: string
  status: string
  title: string
  reason?: string | null
  requestedAmount?: any | null
  requestedPct?: any | null
  createdAt: Date
  dealerUnit?: IDealerApproval['dealerUnit']

  constructor(data: IDealerApproval) {
    this.id = data.id
    this.approvalNumber = data.approvalNumber
    this.type = data.type
    this.status = data.status
    this.title = data.title
    this.createdAt = data.createdAt
    if (data.reason != null) this.reason = data.reason
    if (data.requestedAmount != null) this.requestedAmount = data.requestedAmount
    if (data.requestedPct != null) this.requestedPct = data.requestedPct
    if (data.dealerUnit !== undefined) this.dealerUnit = data.dealerUnit
  }
}
