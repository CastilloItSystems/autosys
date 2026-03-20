// backend/src/features/sales/preInvoices/preInvoices.dto.ts

import { IPreInvoice } from './preInvoices.interface.js'

export class PreInvoiceResponseDTO {
  id: string
  preInvoiceNumber: string
  status: string
  orderId: string
  customerId: string
  warehouseId: string
  currency: string
  exchangeRate?: number
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
  preparedAt?: Date | null
  paidAt?: Date | null
  preparedBy?: string | null
  items: any[]
  order?: any
  customer?: any
  warehouse?: any
  createdAt: Date
  updatedAt: Date

  constructor(data: Record<string, unknown>) {
    this.id = String(data.id)
    this.preInvoiceNumber = String(data.preInvoiceNumber)
    this.status = String(data.status)
    this.orderId = String(data.orderId)
    this.customerId = String(data.customerId)
    this.warehouseId = String(data.warehouseId)
    this.currency = String(data.currency ?? 'USD')
    this.discountAmount = Number(data.discountAmount ?? 0)
    this.subtotalBruto = Number(data.subtotalBruto ?? 0)
    this.baseImponible = Number(data.baseImponible ?? 0)
    this.baseExenta = Number(data.baseExenta ?? 0)
    this.taxAmount = Number(data.taxAmount ?? 0)
    this.taxRate = Number(data.taxRate ?? 16)
    this.igtfApplies = Boolean(data.igtfApplies)
    this.igtfRate = Number(data.igtfRate ?? 3)
    this.igtfAmount = Number(data.igtfAmount ?? 0)
    this.total = Number(data.total ?? 0)
    this.items = (data.items as any[]) ?? []
    this.createdAt = data.createdAt as Date
    this.updatedAt = data.updatedAt as Date

    if (data.exchangeRate != null) this.exchangeRate = Number(data.exchangeRate)
    if (data.notes != null) this.notes = String(data.notes)
    if (data.preparedAt != null) this.preparedAt = data.preparedAt as Date
    if (data.paidAt != null) this.paidAt = data.paidAt as Date
    if (data.preparedBy != null) this.preparedBy = String(data.preparedBy)
    if (data.order != null) this.order = data.order
    if (data.customer != null) this.customer = data.customer
    if (data.warehouse != null) this.warehouse = data.warehouse
  }
}
