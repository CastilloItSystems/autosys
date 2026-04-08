// libs/interfaces/workshop/quotation.interface.ts
import type { CustomerRef, VehicleRef, WorkshopPagedResponse, WorkshopResponse } from './shared.interface'

export type QuotationStatus =
  | 'DRAFT'
  | 'ISSUED'
  | 'SENT'
  | 'PENDING_APPROVAL'
  | 'APPROVED_TOTAL'
  | 'APPROVED_PARTIAL'
  | 'REJECTED'
  | 'EXPIRED'
  | 'CONVERTED'

export type QuotationItemType =
  | 'LABOR'
  | 'PART'
  | 'CONSUMABLE'
  | 'EXTERNAL_SERVICE'
  | 'COURTESY'

export type ApprovalChannel =
  | 'PRESENTIAL'
  | 'WHATSAPP'
  | 'EMAIL'
  | 'CALL'
  | 'DIGITAL_SIGNATURE'

export type ApprovalType = 'TOTAL' | 'PARTIAL' | 'REJECTION'

export interface QuotationItem {
  id: string
  type: QuotationItemType
  referenceId: string | null
  description: string
  quantity: number
  unitPrice: number
  unitCost: number
  discount: number
  tax: number
  subtotal: number
  total: number
  approved: boolean
  order: number
}

export interface QuotationApproval {
  id: string
  type: ApprovalType
  channel: ApprovalChannel
  approvedByName: string
  notes: string | null
  rejectionReason: string | null
  approvedAt: string
}

export interface WorkshopQuotation {
  id: string
  quotationNumber: string
  status: QuotationStatus
  version: number
  isSupplementary: boolean
  parentQuotationId: string | null
  receptionId: string | null
  reception: { id: string; folio: string; status: string } | null
  diagnosisId: string | null
  serviceOrderId: string | null
  serviceOrder: { id: string; folio: string; status: string } | null
  customerId: string
  customer: CustomerRef | null
  customerVehicleId: string | null
  customerVehicle: VehicleRef | null
  validUntil: string | null
  expiredAt: string | null
  convertedAt: string | null
  subtotal: number
  discount: number
  tax: number
  total: number
  notes: string | null
  internalNotes: string | null
  items: QuotationItem[]
  approvals: QuotationApproval[]
  supplementaries: Partial<WorkshopQuotation>[]
  createdBy: string
  createdAt: string
  updatedAt: string
}

export interface QuotationFilters {
  status?: QuotationStatus
  customerId?: string
  receptionId?: string
  isSupplementary?: boolean
  search?: string
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface CreateQuotationItemInput {
  id?: string
  type: QuotationItemType
  referenceId?: string
  description: string
  quantity: number
  unitPrice: number
  unitCost?: number
  discount?: number
  tax?: number
  approved?: boolean
  order?: number
}

export interface CreateQuotationInput {
  receptionId?: string
  diagnosisId?: string
  customerId: string
  customerVehicleId?: string
  isSupplementary?: boolean
  parentQuotationId?: string
  validUntil?: string
  notes?: string
  internalNotes?: string
  items: CreateQuotationItemInput[]
}

export interface UpdateQuotationInput {
  validUntil?: string | null
  notes?: string | null
  internalNotes?: string | null
  items?: CreateQuotationItemInput[]
}

export interface RegisterApprovalInput {
  type: ApprovalType
  channel: ApprovalChannel
  approvedByName: string
  notes?: string
  rejectionReason?: string
  approvedItemIds?: string[]
}

export interface ConvertToSOInput {
  advisorId?: string
  branchId?: string
  notes?: string
}

export type QuotationPagedResponse = WorkshopPagedResponse<WorkshopQuotation>
export type QuotationResponse = WorkshopResponse<WorkshopQuotation>
