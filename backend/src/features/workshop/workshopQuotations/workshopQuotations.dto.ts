// backend/src/features/workshop/workshopQuotations/workshopQuotations.dto.ts
import type {
  QuotationItemType,
  QuotationStatus,
  ApprovalChannel,
  ApprovalType,
  IQuotationItem,
} from './workshopQuotations.interface.js'

export class CreateQuotationDTO {
  receptionId?: string
  diagnosisId?: string
  customerId: string
  customerVehicleId?: string
  isSupplementary: boolean
  parentQuotationId?: string
  validUntil?: Date
  notes?: string
  internalNotes?: string
  items: IQuotationItem[]

  constructor(data: any) {
    this.receptionId = data.receptionId || undefined
    this.diagnosisId = data.diagnosisId || undefined
    this.customerId = data.customerId
    this.customerVehicleId = data.customerVehicleId || undefined
    this.isSupplementary = Boolean(data.isSupplementary ?? false)
    this.parentQuotationId = data.parentQuotationId || undefined
    this.validUntil = data.validUntil ? new Date(data.validUntil) : undefined
    this.notes = data.notes ? String(data.notes).trim() : undefined
    this.internalNotes = data.internalNotes
      ? String(data.internalNotes).trim()
      : undefined
    this.items = (data.items ?? []).map((it: any) => ({
      id: it.id || undefined,
      type: it.type as QuotationItemType,
      referenceId: it.referenceId || null,
      description: String(it.description).trim(),
      quantity: Number(it.quantity),
      unitPrice: Number(it.unitPrice),
      unitCost: Number(it.unitCost ?? 0),
      discountPct: Number(it.discountPct ?? 0),
      taxType: it.taxType || 'IVA',
      taxRate: Number(it.taxRate ?? 0.16),
      taxAmount: Number(it.taxAmount ?? 0),
      approved: it.approved !== false,
      order: Number(it.order ?? 0),
    }))
  }
}

export class UpdateQuotationDTO {
  validUntil?: Date | null
  notes?: string | null
  internalNotes?: string | null
  items?: IQuotationItem[]

  constructor(data: any) {
    if ('validUntil' in data)
      this.validUntil = data.validUntil ? new Date(data.validUntil) : null
    if ('notes' in data)
      this.notes = data.notes ? String(data.notes).trim() : null
    if ('internalNotes' in data)
      this.internalNotes = data.internalNotes
        ? String(data.internalNotes).trim()
        : null
    if (data.items) {
      this.items = data.items.map((it: any) => ({
        id: it.id || undefined,
        type: it.type as QuotationItemType,
        referenceId: it.referenceId || null,
        description: String(it.description).trim(),
        quantity: Number(it.quantity),
        unitPrice: Number(it.unitPrice),
        unitCost: Number(it.unitCost ?? 0),
        discountPct: Number(it.discountPct ?? 0),
        taxType: it.taxType || 'IVA',
        taxRate: Number(it.taxRate ?? 0.16),
        taxAmount: Number(it.taxAmount ?? 0),
        approved: it.approved !== false,
        order: Number(it.order ?? 0),
      }))
    }
  }
}

export class QuotationResponseDTO {
  id: string
  quotationNumber: string
  status: QuotationStatus
  version: number
  isSupplementary: boolean
  parentQuotationId: string | null
  receptionId: string | null
  reception: any | null
  diagnosisId: string | null
  serviceOrderId: string | null
  serviceOrder: any | null
  customerId: string
  customer: any | null
  customerVehicleId: string | null
  customerVehicle: any | null
  validUntil: Date | null
  expiredAt: Date | null
  convertedAt: Date | null
  laborTotal: number
  partsTotal: number
  otherTotal: number
  subtotal: number
  discount: number
  taxAmt: number
  total: number
  notes: string | null
  internalNotes: string | null
  items: any[]
  approvals: any[]
  supplementaries: any[]
  createdBy: string
  createdAt: Date
  updatedAt: Date

  constructor(data: any) {
    this.id = data.id
    this.quotationNumber = data.quotationNumber
    this.status = data.status
    this.version = data.version
    this.isSupplementary = data.isSupplementary
    this.parentQuotationId = data.parentQuotationId ?? null
    this.receptionId = data.receptionId ?? null
    this.reception = data.reception ?? null
    this.diagnosisId = data.diagnosisId ?? null
    this.serviceOrderId = data.serviceOrderId ?? null
    this.serviceOrder = data.serviceOrder ?? null
    this.customerId = data.customerId
    this.customer = data.customer ?? null
    this.customerVehicleId = data.customerVehicleId ?? null
    this.customerVehicle = data.customerVehicle ?? null
    this.validUntil = data.validUntil ?? null
    this.expiredAt = data.expiredAt ?? null
    this.convertedAt = data.convertedAt ?? null
    this.laborTotal = Number(data.laborTotal ?? 0)
    this.partsTotal = Number(data.partsTotal ?? 0)
    this.otherTotal = Number(data.otherTotal ?? 0)
    this.subtotal = Number(data.subtotal ?? 0)
    this.discount = Number(data.discount ?? 0)
    this.taxAmt = Number(data.taxAmt ?? 0)
    this.total = Number(data.total ?? 0)
    this.notes = data.notes ?? null
    this.internalNotes = data.internalNotes ?? null
    this.items = (data.items ?? []).map((it: any) => ({
      ...it,
      quantity: Number(it.quantity),
      unitPrice: Number(it.unitPrice),
      unitCost: Number(it.unitCost),
      discountPct: Number(it.discountPct),
      taxRate: Number(it.taxRate),
      taxAmount: Number(it.taxAmount),
      subtotal: Number(it.subtotal),
      total: Number(it.total),
    }))
    this.approvals = data.approvals ?? []
    this.supplementaries = (data.supplementaries ?? []).map(
      (s: any) => new QuotationResponseDTO(s)
    )
    this.createdBy = data.createdBy
    this.createdAt = data.createdAt
    this.updatedAt = data.updatedAt
  }
}
