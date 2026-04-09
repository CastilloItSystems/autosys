// backend/src/features/sales/orders/orders.dto.ts

import { OrderStatus, OrderCurrency } from './orders.interface.js'

// ---------------------------------------------------------------------------
// Item DTO
// ---------------------------------------------------------------------------

export class CreateOrderItemDTO {
  itemId: string
  itemName?: string
  quantity: number
  unitPrice: number
  discountPercent?: number
  taxType?: string
  notes?: string

  constructor(data: Record<string, unknown>) {
    this.itemId = String(data.itemId)
    this.quantity = Number(data.quantity)
    this.unitPrice = Number(data.unitPrice)
    if (data.itemName != null && String(data.itemName).trim() !== '')
      this.itemName = String(data.itemName).trim()
    if (data.discountPercent !== undefined)
      this.discountPercent = Number(data.discountPercent)
    if (data.taxType !== undefined) this.taxType = String(data.taxType)
    if (data.notes != null && String(data.notes).trim() !== '')
      this.notes = String(data.notes)
  }
}

// ---------------------------------------------------------------------------
// Create DTO
// ---------------------------------------------------------------------------

export class CreateOrderDTO {
  customerId: string
  warehouseId: string
  currency?: string
  exchangeRate?: number
  exchangeRateSource?: string
  paymentTerms?: string
  creditDays?: number
  deliveryTerms?: string
  discountAmount?: number
  igtfApplies?: boolean
  taxRate?: number
  igtfRate?: number
  notes?: string
  expectedDate?: Date
  items: CreateOrderItemDTO[]

  constructor(data: Record<string, unknown>) {
    this.customerId = String(data.customerId)
    this.warehouseId = String(data.warehouseId)
    if (data.currency !== undefined) this.currency = String(data.currency)
    if (data.exchangeRate !== undefined)
      this.exchangeRate = Number(data.exchangeRate)
    if (data.exchangeRateSource != null)
      this.exchangeRateSource = String(data.exchangeRateSource)
    if (data.paymentTerms != null) this.paymentTerms = String(data.paymentTerms)
    if (data.creditDays !== undefined) this.creditDays = Number(data.creditDays)
    if (data.deliveryTerms != null)
      this.deliveryTerms = String(data.deliveryTerms)
    if (data.discountAmount !== undefined)
      this.discountAmount = Number(data.discountAmount)
    if (data.igtfApplies !== undefined)
      this.igtfApplies = Boolean(data.igtfApplies)
    if (data.taxRate !== undefined) this.taxRate = Number(data.taxRate)
    if (data.igtfRate !== undefined) this.igtfRate = Number(data.igtfRate)
    if (data.notes != null) this.notes = String(data.notes)
    if (data.expectedDate !== undefined)
      this.expectedDate = new Date(data.expectedDate as string)
    this.items = Array.isArray(data.items)
      ? (data.items as Record<string, unknown>[]).map(
          (i) => new CreateOrderItemDTO(i)
        )
      : []
  }
}

// ---------------------------------------------------------------------------
// Update DTO
// ---------------------------------------------------------------------------

export class UpdateOrderDTO {
  customerId?: string
  warehouseId?: string
  currency?: string
  exchangeRate?: number
  exchangeRateSource?: string
  paymentTerms?: string
  creditDays?: number
  deliveryTerms?: string
  discountAmount?: number
  igtfApplies?: boolean
  taxRate?: number
  igtfRate?: number
  notes?: string
  expectedDate?: Date
  items?: CreateOrderItemDTO[]

  constructor(data: Record<string, unknown>) {
    if (data.customerId !== undefined) this.customerId = String(data.customerId)
    if (data.warehouseId !== undefined)
      this.warehouseId = String(data.warehouseId)
    if (data.currency !== undefined) this.currency = String(data.currency)
    if (data.exchangeRate !== undefined)
      this.exchangeRate = Number(data.exchangeRate)
    if (data.exchangeRateSource != null)
      this.exchangeRateSource = String(data.exchangeRateSource)
    if (data.paymentTerms != null) this.paymentTerms = String(data.paymentTerms)
    if (data.creditDays !== undefined) this.creditDays = Number(data.creditDays)
    if (data.deliveryTerms != null)
      this.deliveryTerms = String(data.deliveryTerms)
    if (data.discountAmount !== undefined)
      this.discountAmount = Number(data.discountAmount)
    if (data.igtfApplies !== undefined)
      this.igtfApplies = Boolean(data.igtfApplies)
    if (data.taxRate !== undefined) this.taxRate = Number(data.taxRate)
    if (data.igtfRate !== undefined) this.igtfRate = Number(data.igtfRate)
    if (data.notes != null) this.notes = String(data.notes)
    if (data.expectedDate !== undefined)
      this.expectedDate = new Date(data.expectedDate as string)
    if (Array.isArray(data.items)) {
      this.items = (data.items as Record<string, unknown>[]).map(
        (i) => new CreateOrderItemDTO(i)
      )
    }
  }
}

// ---------------------------------------------------------------------------
// Response DTO
// ---------------------------------------------------------------------------

export class OrderResponseDTO {
  id: string
  orderNumber: string
  status: string
  customerId: string
  warehouseId: string
  currency: string
  exchangeRate?: number
  paymentTerms?: string
  creditDays?: number
  deliveryTerms?: string
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
  notes?: string
  orderDate: Date
  approvedAt?: Date
  createdBy?: string
  approvedBy?: string
  items: any[]
  customer?: any
  warehouse?: any
  createdAt: Date
  updatedAt: Date

  constructor(data: Record<string, unknown>) {
    this.id = String(data.id)
    this.orderNumber = String(data.orderNumber)
    this.status = String(data.status)
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
    this.orderDate = data.orderDate as Date
    this.createdAt = data.createdAt as Date
    this.updatedAt = data.updatedAt as Date

    if (data.exchangeRate != null) this.exchangeRate = Number(data.exchangeRate)
    if (data.paymentTerms != null) this.paymentTerms = String(data.paymentTerms)
    if (data.creditDays != null) this.creditDays = Number(data.creditDays)
    if (data.deliveryTerms != null)
      this.deliveryTerms = String(data.deliveryTerms)
    if (data.notes != null) this.notes = String(data.notes)
    if (data.approvedAt != null) this.approvedAt = data.approvedAt as Date
    if (data.createdBy != null) this.createdBy = String(data.createdBy)
    if (data.approvedBy != null) this.approvedBy = String(data.approvedBy)
    if (data.customer != null) this.customer = data.customer
    if (data.warehouse != null) this.warehouse = data.warehouse
  }
}
