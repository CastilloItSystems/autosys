// backend/src/features/inventory/purchaseOrders/purchaseOrders.dto.ts

import {
  IPurchaseOrder,
  IPurchaseOrderItem,
  IPurchaseOrderWithRelations,
  PurchaseOrderStatus,
  PurchaseOrderCurrency,
  TaxType,
} from './purchaseOrders.interface.js'

export class CreatePurchaseOrderDTO {
  supplierId: string
  warehouseId: string
  currency?: PurchaseOrderCurrency
  exchangeRate?: number | null
  paymentTerms?: string | null
  creditDays?: number | null
  deliveryTerms?: string | null
  discountAmount?: number
  igtfApplies?: boolean
  notes?: string
  expectedDate?: Date
  createdBy?: string
  items?: {
    itemId: string
    quantityOrdered: number
    unitCost: number
    discountPercent?: number
    taxType?: TaxType
  }[]

  constructor(data: Record<string, unknown>) {
    this.supplierId = String(data.supplierId)
    this.warehouseId = String(data.warehouseId)
    if (data.currency) this.currency = data.currency as PurchaseOrderCurrency
    if (data.exchangeRate !== undefined)
      this.exchangeRate = data.exchangeRate ? Number(data.exchangeRate) : null
    if (data.paymentTerms !== undefined)
      this.paymentTerms = data.paymentTerms ? String(data.paymentTerms) : null
    if (data.creditDays !== undefined)
      this.creditDays = data.creditDays ? Number(data.creditDays) : null
    if (data.deliveryTerms !== undefined)
      this.deliveryTerms = data.deliveryTerms
        ? String(data.deliveryTerms)
        : null
    if (data.discountAmount !== undefined)
      this.discountAmount = Number(data.discountAmount)
    if (data.igtfApplies !== undefined)
      this.igtfApplies = Boolean(data.igtfApplies)
    if (data.notes) this.notes = String(data.notes)
    if (data.expectedDate)
      this.expectedDate = new Date(data.expectedDate as string)
    if (data.createdBy) this.createdBy = String(data.createdBy)
    if (Array.isArray(data.items)) {
      this.items = (data.items as Record<string, unknown>[]).map((item) => ({
        itemId: String(item.itemId),
        itemName: item.itemName ? String(item.itemName) : undefined,
        quantityOrdered: Number(item.quantityOrdered),
        unitCost: Number(item.unitCost),
        discountPercent:
          item.discountPercent !== undefined
            ? Number(item.discountPercent)
            : undefined,
        taxType:
          item.taxType !== undefined ? (item.taxType as TaxType) : undefined,
      }))
    }
  }
}

export class UpdatePurchaseOrderDTO {
  status?: PurchaseOrderStatus
  currency?: PurchaseOrderCurrency
  exchangeRate?: number | null
  paymentTerms?: string | null
  creditDays?: number | null
  deliveryTerms?: string | null
  discountAmount?: number
  igtfApplies?: boolean
  notes?: string | null
  expectedDate?: Date | null
  items?: {
    itemId: string
    itemName?: string
    quantityOrdered: number
    unitCost: number
    discountPercent?: number
    taxType?: TaxType
  }[]

  constructor(data: Record<string, unknown>) {
    if (data.status !== undefined)
      this.status = data.status as PurchaseOrderStatus
    if (data.currency !== undefined)
      this.currency = data.currency as PurchaseOrderCurrency
    if (data.exchangeRate !== undefined)
      this.exchangeRate = data.exchangeRate ? Number(data.exchangeRate) : null
    if (data.paymentTerms !== undefined)
      this.paymentTerms = data.paymentTerms ? String(data.paymentTerms) : null
    if (data.creditDays !== undefined)
      this.creditDays = data.creditDays ? Number(data.creditDays) : null
    if (data.deliveryTerms !== undefined)
      this.deliveryTerms = data.deliveryTerms
        ? String(data.deliveryTerms)
        : null
    if (data.discountAmount !== undefined)
      this.discountAmount = Number(data.discountAmount)
    if (data.igtfApplies !== undefined)
      this.igtfApplies = Boolean(data.igtfApplies)
    if (data.notes !== undefined)
      this.notes = data.notes ? String(data.notes) : null
    if (data.expectedDate !== undefined)
      this.expectedDate = data.expectedDate
        ? new Date(data.expectedDate as string)
        : null
    if (Array.isArray(data.items)) {
      this.items = (data.items as Record<string, unknown>[]).map((item) => ({
        itemId: String(item.itemId),
        itemName: item.itemName ? String(item.itemName) : undefined,
        quantityOrdered: Number(item.quantityOrdered),
        unitCost: Number(item.unitCost),
        discountPercent:
          item.discountPercent !== undefined
            ? Number(item.discountPercent)
            : undefined,
        taxType:
          item.taxType !== undefined ? (item.taxType as TaxType) : undefined,
      }))
    }
  }
}

export class ApprovePurchaseOrderDTO {
  approvedBy?: string | null
  constructor(data: Record<string, unknown>) {
    this.approvedBy = data.approvedBy ? String(data.approvedBy) : null
  }
}

export class CreatePurchaseOrderItemDTO {
  itemId: string
  itemName?: string
  quantityOrdered: number
  unitCost: number
  discountPercent?: number
  taxType?: TaxType

  constructor(data: Record<string, unknown>) {
    this.itemId = String(data.itemId)
    if (data.itemName) this.itemName = String(data.itemName)
    this.quantityOrdered = Number(data.quantityOrdered)
    this.unitCost = Number(data.unitCost)
    if (data.discountPercent !== undefined)
      this.discountPercent = Number(data.discountPercent)
    if (data.taxType !== undefined) this.taxType = data.taxType as TaxType
  }
}

export class ReceiveOrderDTO {
  warehouseId?: string
  notes?: string
  receivedBy?: string
  items: {
    itemId: string
    quantityReceived: number
    unitCost: number
    location?: string | null
    batchNumber?: string | null
    expiryDate?: Date | null
  }[]

  constructor(data: Record<string, unknown>) {
    if (data.warehouseId) this.warehouseId = String(data.warehouseId)
    if (data.notes) this.notes = String(data.notes)
    if (data.receivedBy) this.receivedBy = String(data.receivedBy)
    this.items = (
      Array.isArray(data.items) ? (data.items as Record<string, unknown>[]) : []
    ).map((item) => ({
      itemId: String(item.itemId),
      quantityReceived: Number(item.quantityReceived),
      unitCost: Number(item.unitCost),
      location:
        item.location !== undefined
          ? item.location === null
            ? null
            : String(item.location)
          : null,
      batchNumber: item.batchNumber ? String(item.batchNumber) : null,
      expiryDate: item.expiryDate ? new Date(item.expiryDate as string) : null,
    }))
  }
}

export class PurchaseOrderResponseDTO {
  id: string
  orderNumber: string
  supplierId: string
  warehouseId: string
  status: PurchaseOrderStatus
  currency: PurchaseOrderCurrency
  exchangeRate: number | null
  paymentTerms: string | null
  creditDays: number | null
  deliveryTerms: string | null
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
  notes: string | null
  orderDate: Date
  expectedDate: Date | null
  createdBy: string | null
  approvedBy: string | null
  approvedAt: Date | null
  createdAt: Date
  updatedAt: Date
  supplier?: unknown
  warehouse?: unknown
  items?: PurchaseOrderItemResponseDTO[]

  constructor(po: IPurchaseOrder | IPurchaseOrderWithRelations) {
    this.id = po.id
    this.orderNumber = po.orderNumber
    this.supplierId = po.supplierId
    this.warehouseId = po.warehouseId
    this.status = po.status
    this.currency = po.currency
    this.exchangeRate = po.exchangeRate ? Number(po.exchangeRate) : null
    this.paymentTerms = po.paymentTerms ?? null
    this.creditDays = po.creditDays ?? null
    this.deliveryTerms = po.deliveryTerms ?? null
    this.discountAmount = Number(po.discountAmount)
    this.subtotalBruto = Number(po.subtotalBruto)
    this.baseImponible = Number(po.baseImponible)
    this.baseExenta = Number(po.baseExenta)
    this.taxAmount = Number(po.taxAmount)
    this.taxRate = Number(po.taxRate)
    this.igtfApplies = po.igtfApplies
    this.igtfRate = Number(po.igtfRate)
    this.igtfAmount = Number(po.igtfAmount)
    this.total = Number(po.total)
    this.notes = po.notes ?? null
    this.orderDate = po.orderDate
    this.expectedDate = po.expectedDate ?? null
    this.createdBy = po.createdBy ?? null
    this.approvedBy = po.approvedBy ?? null
    this.approvedAt = po.approvedAt ?? null
    this.createdAt = po.createdAt
    this.updatedAt = po.updatedAt
    const r = po as IPurchaseOrderWithRelations
    if (r.supplier !== undefined) this.supplier = r.supplier
    if (r.warehouse !== undefined) this.warehouse = r.warehouse
    if (r.items !== undefined)
      this.items = r.items.map(
        (i) => new PurchaseOrderItemResponseDTO(i as IPurchaseOrderItem)
      )
  }
}

export class PurchaseOrderItemResponseDTO {
  id: string
  purchaseOrderId: string
  itemId: string
  itemName: string | null
  quantityOrdered: number
  quantityReceived: number
  quantityPending: number
  unitCost: number
  discountPercent: number
  discountAmount: number
  taxType: TaxType
  taxRate: number
  taxAmount: number
  subtotal: number
  totalLine: number
  createdAt: Date
  updatedAt: Date
  item?: unknown

  constructor(item: IPurchaseOrderItem) {
    this.id = item.id
    this.purchaseOrderId = item.purchaseOrderId
    this.itemId = item.itemId
    this.itemName = item.itemName ?? null
    this.quantityOrdered = item.quantityOrdered
    this.quantityReceived = item.quantityReceived
    this.quantityPending = item.quantityPending
    this.unitCost = Number(item.unitCost)
    this.discountPercent = Number(item.discountPercent)
    this.discountAmount = Number(item.discountAmount)
    this.taxType = item.taxType
    this.taxRate = Number(item.taxRate)
    this.taxAmount = Number(item.taxAmount)
    this.subtotal = Number(item.subtotal)
    this.totalLine = Number(item.totalLine)
    this.createdAt = item.createdAt
    this.updatedAt = item.updatedAt
    const r = item as IPurchaseOrderItem & { item?: unknown }
    if (r.item !== undefined) this.item = r.item
  }
}
