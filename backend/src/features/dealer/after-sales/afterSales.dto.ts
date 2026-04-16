import { IDealerAfterSale } from './afterSales.interface.js'

export class CreateDealerAfterSaleDTO {
  dealerUnitId?: string
  referenceType?: string
  referenceId?: string
  type: string
  status?: string
  customerName: string
  customerPhone?: string
  customerEmail?: string
  title: string
  description?: string
  dueAt?: Date | null
  assignedTo?: string
  resolutionNotes?: string
  satisfactionScore?: number | null

  constructor(data: Record<string, unknown>) {
    this.type = String(data.type).trim()
    this.customerName = String(data.customerName).trim()
    this.title = String(data.title).trim()
    if (data.dealerUnitId != null && String(data.dealerUnitId).trim() !== '') this.dealerUnitId = String(data.dealerUnitId).trim()
    if (data.referenceType != null && String(data.referenceType).trim() !== '') this.referenceType = String(data.referenceType).trim()
    if (data.referenceId != null && String(data.referenceId).trim() !== '') this.referenceId = String(data.referenceId).trim()
    if (data.status != null && String(data.status).trim() !== '') this.status = String(data.status).trim()
    if (data.customerPhone != null && String(data.customerPhone).trim() !== '') this.customerPhone = String(data.customerPhone).trim()
    if (data.customerEmail != null && String(data.customerEmail).trim() !== '') this.customerEmail = String(data.customerEmail).trim()
    if (data.description != null && String(data.description).trim() !== '') this.description = String(data.description).trim()
    if (data.dueAt !== undefined) this.dueAt = data.dueAt ? new Date(String(data.dueAt)) : null
    if (data.assignedTo != null && String(data.assignedTo).trim() !== '') this.assignedTo = String(data.assignedTo).trim()
    if (data.resolutionNotes != null && String(data.resolutionNotes).trim() !== '')
      this.resolutionNotes = String(data.resolutionNotes).trim()
    if (data.satisfactionScore !== undefined)
      this.satisfactionScore = data.satisfactionScore !== null ? Number(data.satisfactionScore) : null
  }
}

export class UpdateDealerAfterSaleDTO {
  dealerUnitId?: string | null
  referenceType?: string | null
  referenceId?: string | null
  type?: string
  status?: string
  customerName?: string
  customerPhone?: string | null
  customerEmail?: string | null
  title?: string
  description?: string | null
  dueAt?: Date | null
  assignedTo?: string | null
  resolutionNotes?: string | null
  satisfactionScore?: number | null
  isActive?: boolean

  constructor(data: Record<string, unknown>) {
    if (data.dealerUnitId !== undefined) this.dealerUnitId = data.dealerUnitId ? String(data.dealerUnitId).trim() : null
    if (data.referenceType !== undefined) this.referenceType = data.referenceType ? String(data.referenceType).trim() : null
    if (data.referenceId !== undefined) this.referenceId = data.referenceId ? String(data.referenceId).trim() : null
    if (data.type !== undefined) this.type = String(data.type).trim()
    if (data.status !== undefined) this.status = String(data.status).trim()
    if (data.customerName !== undefined) this.customerName = String(data.customerName).trim()
    if (data.customerPhone !== undefined) this.customerPhone = data.customerPhone ? String(data.customerPhone).trim() : null
    if (data.customerEmail !== undefined) this.customerEmail = data.customerEmail ? String(data.customerEmail).trim() : null
    if (data.title !== undefined) this.title = String(data.title).trim()
    if (data.description !== undefined) this.description = data.description ? String(data.description).trim() : null
    if (data.dueAt !== undefined) this.dueAt = data.dueAt ? new Date(String(data.dueAt)) : null
    if (data.assignedTo !== undefined) this.assignedTo = data.assignedTo ? String(data.assignedTo).trim() : null
    if (data.resolutionNotes !== undefined) this.resolutionNotes = data.resolutionNotes ? String(data.resolutionNotes).trim() : null
    if (data.satisfactionScore !== undefined)
      this.satisfactionScore = data.satisfactionScore !== null ? Number(data.satisfactionScore) : null
    if (data.isActive !== undefined) this.isActive = Boolean(data.isActive)
  }
}

export class DealerAfterSaleResponseDTO {
  id: string
  caseNumber: string
  type: string
  status: string
  customerName: string
  title: string
  dueAt?: Date | null
  satisfactionScore?: number | null
  createdAt: Date
  dealerUnit?: IDealerAfterSale['dealerUnit']

  constructor(data: IDealerAfterSale) {
    this.id = data.id
    this.caseNumber = data.caseNumber
    this.type = data.type
    this.status = data.status
    this.customerName = data.customerName
    this.title = data.title
    this.createdAt = data.createdAt
    if (data.dueAt != null) this.dueAt = data.dueAt
    if (data.satisfactionScore != null) this.satisfactionScore = data.satisfactionScore
    if (data.dealerUnit !== undefined) this.dealerUnit = data.dealerUnit
  }
}
