// backend/src/features/finance/supplierBills/supplierBills.dto.ts

import {
  ICreateSupplierBillInput,
  IRegisterSupplierInvoiceInput,
  IUpdateSupplierBillInput,
} from './supplierBills.interface.js'

type AnyRecord = Record<string, unknown>
const asRecord = (value: unknown): AnyRecord =>
  value != null && typeof value === 'object' && !Array.isArray(value)
    ? (value as AnyRecord)
    : {}

export class CreateSupplierBillDTO implements ICreateSupplierBillInput {
  billNumber: string
  supplierId: string
  purchaseOrderId?: string
  currency: string
  exchangeRate?: number
  subtotal: number
  taxAmount?: number
  total: number
  issueDate: Date | string
  dueDate?: Date | string
  attachmentUrl?: string
  notes?: string
  items: ICreateSupplierBillInput['items']

  constructor(data: unknown) {
    const r = asRecord(data)
    this.billNumber = String(r.billNumber ?? '')
    this.supplierId = String(r.supplierId ?? '')
    if (r.purchaseOrderId) this.purchaseOrderId = String(r.purchaseOrderId)
    this.currency = String(r.currency ?? 'USD')
    if (r.exchangeRate != null) this.exchangeRate = Number(r.exchangeRate)
    this.subtotal = Number(r.subtotal ?? 0)
    this.taxAmount = Number(r.taxAmount ?? 0)
    this.total = Number(r.total ?? 0)
    this.issueDate = new Date(r.issueDate as string)
    if (r.dueDate) this.dueDate = new Date(r.dueDate as string)
    if (r.attachmentUrl) this.attachmentUrl = String(r.attachmentUrl)
    if (r.notes) this.notes = String(r.notes)
    this.items = Array.isArray(r.items)
      ? (r.items as AnyRecord[]).map((item) => ({
          itemId: item.itemId ? String(item.itemId) : null,
          itemName: item.itemName ? String(item.itemName) : null,
          quantity: Number(item.quantity ?? 0),
          unitCost: Number(item.unitCost ?? 0),
          discountPercent: Number(item.discountPercent ?? 0),
          taxType: (item.taxType as any) ?? 'IVA',
          taxRate: Number(item.taxRate ?? 16),
          notes: item.notes ? String(item.notes) : null,
        }))
      : []
  }
}

export class UpdateSupplierBillDTO implements IUpdateSupplierBillInput {
  billNumber?: string
  currency?: string
  exchangeRate?: number
  subtotal?: number
  taxAmount?: number
  total?: number
  issueDate?: Date | string
  dueDate?: Date | string
  attachmentUrl?: string
  notes?: string
  status?: any
  items?: IUpdateSupplierBillInput['items']

  constructor(data: unknown) {
    const r = asRecord(data)
    if (r.billNumber != null) this.billNumber = String(r.billNumber)
    if (r.currency != null) this.currency = String(r.currency)
    if (r.exchangeRate != null) this.exchangeRate = Number(r.exchangeRate)
    if (r.subtotal != null) this.subtotal = Number(r.subtotal)
    if (r.taxAmount != null) this.taxAmount = Number(r.taxAmount)
    if (r.total != null) this.total = Number(r.total)
    if (r.issueDate != null) this.issueDate = new Date(r.issueDate as string)
    if ('dueDate' in r) this.dueDate = r.dueDate ? new Date(r.dueDate as string) : undefined
    if ('attachmentUrl' in r) this.attachmentUrl = r.attachmentUrl ? String(r.attachmentUrl) : undefined
    if ('notes' in r) this.notes = r.notes ? String(r.notes) : undefined
    if (r.status != null) this.status = r.status
    if (Array.isArray(r.items)) {
      this.items = (r.items as AnyRecord[]).map((item) => ({
        itemId: item.itemId ? String(item.itemId) : null,
        itemName: item.itemName ? String(item.itemName) : null,
        quantity: Number(item.quantity ?? 0),
        unitCost: Number(item.unitCost ?? 0),
        discountPercent: Number(item.discountPercent ?? 0),
        taxType: (item.taxType as any) ?? 'IVA',
        taxRate: Number(item.taxRate ?? 16),
        notes: item.notes ? String(item.notes) : null,
      }))
    }
  }
}

export class RegisterSupplierInvoiceDTO
  implements IRegisterSupplierInvoiceInput
{
  billNumber: string
  issueDate: Date | string
  dueDate?: Date | string | null
  attachmentUrl?: string | null
  notes?: string | null
  subtotal?: number
  taxAmount?: number
  total?: number

  constructor(data: unknown) {
    const r = asRecord(data)
    this.billNumber = String(r.billNumber ?? '')
    this.issueDate = new Date(r.issueDate as string)
    if ('dueDate' in r) {
      this.dueDate = r.dueDate ? new Date(r.dueDate as string) : null
    }
    if ('attachmentUrl' in r) {
      this.attachmentUrl = r.attachmentUrl ? String(r.attachmentUrl) : null
    }
    if ('notes' in r) {
      this.notes = r.notes ? String(r.notes) : null
    }
    if (r.subtotal != null) this.subtotal = Number(r.subtotal)
    if (r.taxAmount != null) this.taxAmount = Number(r.taxAmount)
    if (r.total != null) this.total = Number(r.total)
  }
}
