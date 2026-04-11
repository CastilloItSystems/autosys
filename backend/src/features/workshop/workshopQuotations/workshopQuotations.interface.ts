// backend/src/features/workshop/workshopQuotations/workshopQuotations.interface.ts

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

export interface IQuotationItem {
  id?: string
  type: QuotationItemType
  referenceId?: string | null
  description: string
  quantity: number
  unitPrice: number
  unitCost?: number
  discountPct?: number
  taxType?: string
  taxRate?: number
  taxAmount?: number
  approved?: boolean
  order?: number
}

export interface ICreateQuotationInput {
  receptionId?: string
  diagnosisId?: string
  customerId: string
  customerVehicleId?: string
  isSupplementary?: boolean
  parentQuotationId?: string
  validUntil?: Date
  notes?: string
  internalNotes?: string
  items: IQuotationItem[]
}

export interface IUpdateQuotationInput {
  validUntil?: Date | null
  notes?: string
  internalNotes?: string
  items?: IQuotationItem[]
}

export interface IRegisterApprovalInput {
  type: ApprovalType
  channel: ApprovalChannel
  approvedByName: string
  notes?: string
  rejectionReason?: string
  approvedItemIds?: string[] // Para aprobación parcial
}

export interface IConvertToSOInput {
  advisorId?: string
  notes?: string
}

export interface IQuotationFilters {
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
