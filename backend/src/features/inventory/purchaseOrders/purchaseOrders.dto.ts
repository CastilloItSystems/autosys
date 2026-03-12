// backend/src/features/inventory/purchaseOrders/purchaseOrders.dto.ts

import {
  IPurchaseOrder,
  IPurchaseOrderItem,
  IPurchaseOrderWithRelations,
  PurchaseOrderStatus,
} from './purchaseOrders.interface.js'

export class CreatePurchaseOrderDTO {
  supplierId: string
  warehouseId: string
  notes?: string
  expectedDate?: Date
  createdBy?: string
  items?: { itemId: string; quantityOrdered: number; unitCost: number }[]

  constructor(data: Record<string, unknown>) {
    this.supplierId = String(data.supplierId)
    this.warehouseId = String(data.warehouseId)
    if (data.notes) this.notes = String(data.notes)
    if (data.expectedDate)
      this.expectedDate = new Date(data.expectedDate as string)
    if (data.createdBy) this.createdBy = String(data.createdBy)
    if (Array.isArray(data.items)) {
      this.items = (data.items as Record<string, unknown>[]).map((item) => ({
        itemId: String(item.itemId),
        quantityOrdered: Number(item.quantityOrdered),
        unitCost: Number(item.unitCost),
      }))
    }
  }
}

export class UpdatePurchaseOrderDTO {
  status?: PurchaseOrderStatus
  notes?: string | null
  expectedDate?: Date | null

  constructor(data: Record<string, unknown>) {
    if (data.status !== undefined)
      this.status = data.status as PurchaseOrderStatus
    if (data.notes !== undefined)
      this.notes = data.notes ? String(data.notes) : null
    if (data.expectedDate !== undefined)
      this.expectedDate = data.expectedDate
        ? new Date(data.expectedDate as string)
        : null
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
  quantityOrdered: number
  unitCost: number
  constructor(data: Record<string, unknown>) {
    this.itemId = String(data.itemId)
    this.quantityOrdered = Number(data.quantityOrdered)
    this.unitCost = Number(data.unitCost)
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
  subtotal: number
  tax: number
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
    this.subtotal = po.subtotal
    this.tax = po.tax
    this.total = po.total
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
  quantityOrdered: number
  quantityReceived: number
  quantityPending: number
  unitCost: number
  subtotal: number
  createdAt: Date
  updatedAt: Date
  item?: unknown

  constructor(item: IPurchaseOrderItem) {
    this.id = item.id
    this.purchaseOrderId = item.purchaseOrderId
    this.itemId = item.itemId
    this.quantityOrdered = item.quantityOrdered
    this.quantityReceived = item.quantityReceived
    this.quantityPending = item.quantityPending
    this.unitCost = item.unitCost
    this.subtotal = item.subtotal
    this.createdAt = item.createdAt
    this.updatedAt = item.updatedAt
    const r = item as IPurchaseOrderItem & { item?: unknown }
    if (r.item !== undefined) this.item = r.item
  }
}
