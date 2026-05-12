// backend/src/features/sales/creditNotes/creditNotes.dto.ts

import { ICreditNoteWithRelations, ICreditNoteItem } from './creditNotes.interface.js'

export class CreditNoteItemResponseDTO {
  id: string
  creditNoteId: string
  itemId?: string | null
  itemName?: string | null
  quantity: number
  unitPrice: number
  discountPercent: number
  discountAmount: number
  taxType: string
  taxRate: number
  taxAmount: number
  subtotal: number
  totalLine: number
  item?: { id: string; name: string; code: string } | null
  createdAt: Date

  constructor(data: ICreditNoteItem) {
    this.id = String(data.id)
    this.creditNoteId = String(data.creditNoteId)
    this.quantity = Number(data.quantity)
    this.unitPrice = Number(data.unitPrice)
    this.discountPercent = Number(data.discountPercent ?? 0)
    this.discountAmount = Number(data.discountAmount ?? 0)
    this.taxType = String(data.taxType ?? 'IVA')
    this.taxRate = Number(data.taxRate ?? 0)
    this.taxAmount = Number(data.taxAmount ?? 0)
    this.subtotal = Number(data.subtotal ?? 0)
    this.totalLine = Number(data.totalLine ?? 0)
    this.createdAt = data.createdAt as Date

    if (data.itemId != null) this.itemId = String(data.itemId)
    if (data.itemName != null) this.itemName = String(data.itemName)
    if (data.item != null) this.item = data.item
  }
}

export class CreditNoteResponseDTO {
  id: string
  creditNoteNumber: string
  status: string
  empresaId: string
  invoiceId: string
  customerId: string
  reason: string
  currency: string
  exchangeRate?: number | null
  discountAmount: number
  subtotalBruto: number
  baseImponible: number
  baseExenta: number
  taxAmount: number
  taxRate: number
  igtfApplies: boolean
  igtfRate: number
  igtfAmount: number
  total: number
  notes?: string | null
  issuedBy?: string | null
  issuedByName?: string | null
  issuedAt?: Date | null
  cancelledAt?: Date | null
  cancelledBy?: string | null
  cancelledByName?: string | null
  cancellationReason?: string | null
  items?: CreditNoteItemResponseDTO[]
  invoice?: unknown
  customer?: unknown
  createdAt: Date
  updatedAt: Date

  constructor(data: ICreditNoteWithRelations) {
    this.id = String(data.id)
    this.creditNoteNumber = String(data.creditNoteNumber)
    this.status = String(data.status)
    this.empresaId = String(data.empresaId)
    this.invoiceId = String(data.invoiceId)
    this.customerId = String(data.customerId)
    this.reason = String(data.reason)
    this.currency = String(data.currency ?? 'USD')
    this.discountAmount = Number(data.discountAmount ?? 0)
    this.subtotalBruto = Number(data.subtotalBruto ?? 0)
    this.baseImponible = Number(data.baseImponible ?? 0)
    this.baseExenta = Number(data.baseExenta ?? 0)
    this.taxAmount = Number(data.taxAmount ?? 0)
    this.taxRate = Number(data.taxRate ?? 0)
    this.igtfApplies = Boolean(data.igtfApplies)
    this.igtfRate = Number(data.igtfRate ?? 0)
    this.igtfAmount = Number(data.igtfAmount ?? 0)
    this.total = Number(data.total ?? 0)
    this.createdAt = data.createdAt as Date
    this.updatedAt = data.updatedAt as Date

    if (data.exchangeRate != null) this.exchangeRate = Number(data.exchangeRate)
    if (data.notes != null) this.notes = String(data.notes)
    if (data.issuedBy != null) this.issuedBy = String(data.issuedBy)
    if ((data as any).issuedByName != null) this.issuedByName = String((data as any).issuedByName)
    if (data.issuedAt != null) this.issuedAt = data.issuedAt as Date
    if (data.cancelledAt != null) this.cancelledAt = data.cancelledAt as Date
    if (data.cancelledBy != null) this.cancelledBy = String(data.cancelledBy)
    if ((data as any).cancelledByName != null) this.cancelledByName = String((data as any).cancelledByName)
    if (data.cancellationReason != null) this.cancellationReason = String(data.cancellationReason)
    if (data.items != null) this.items = data.items.map((item) => new CreditNoteItemResponseDTO(item))
    if (data.invoice != null) this.invoice = data.invoice
    if (data.customer != null) this.customer = data.customer
  }
}
