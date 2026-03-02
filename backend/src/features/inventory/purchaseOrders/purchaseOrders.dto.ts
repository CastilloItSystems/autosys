// backend/src/features/inventory/purchaseOrders/purchaseOrders.dto.ts

import {
  IPurchaseOrder,
  IPurchaseOrderItem,
  PurchaseOrderStatus,
} from './purchaseOrders.interface'

export class CreatePurchaseOrderDTO {
  supplierId: string
  warehouseId: string
  notes?: string | undefined
  expectedDate?: Date | undefined
  createdBy?: string | undefined
  items?: { itemId: string; quantityOrdered: number; unitCost: number }[]

  constructor(data: any) {
    this.supplierId = data.supplierId
    this.warehouseId = data.warehouseId
    this.notes = data.notes
    this.expectedDate = data.expectedDate
      ? new Date(data.expectedDate)
      : undefined
    this.createdBy = data.createdBy
    this.items = data.items
  }
}

export class UpdatePurchaseOrderDTO {
  status?: PurchaseOrderStatus | undefined
  notes?: string | null | undefined
  expectedDate?: Date | null | undefined

  constructor(data: any) {
    if (data.status !== undefined) this.status = data.status
    if (data.notes !== undefined) this.notes = data.notes ?? null
    if (data.expectedDate !== undefined)
      this.expectedDate = data.expectedDate ? new Date(data.expectedDate) : null
  }
}

export class ApprovePurchaseOrderDTO {
  approvedBy?: string | null

  constructor(data: any) {
    this.approvedBy = data.approvedBy || null
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
  notes?: string | null
  orderDate: Date
  expectedDate?: Date | null
  createdBy?: string | null
  approvedBy?: string | null
  approvedAt?: Date | null
  createdAt: Date
  updatedAt: Date
  supplier?: any
  warehouse?: any
  items?: PurchaseOrderItemResponseDTO[]

  constructor(po: IPurchaseOrder) {
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

    // Always include relations if present
    const relations = po as any
    if (relations.supplier) this.supplier = relations.supplier
    if (relations.warehouse) this.warehouse = relations.warehouse
    if (relations.items) {
      this.items = relations.items.map(
        (item: any) => new PurchaseOrderItemResponseDTO(item)
      )
    }
  }
}

export class CreatePurchaseOrderItemDTO {
  itemId: string
  quantityOrdered: number
  unitCost: number

  constructor(data: any) {
    this.itemId = data.itemId
    this.quantityOrdered = Number(data.quantityOrdered)
    this.unitCost = Number(data.unitCost)
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
  item?: any

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

    // Always include item relation if present
    const relations = item as any
    if (relations.item) this.item = relations.item
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

  constructor(data: any) {
    this.warehouseId = data.warehouseId
    this.notes = data.notes
    this.receivedBy = data.receivedBy
    this.items = (data.items || []).map((item: any) => ({
      itemId: item.itemId,
      quantityReceived: Number(item.quantityReceived),
      unitCost: Number(item.unitCost),
      batchNumber: item.batchNumber ?? null,
      expiryDate: item.expiryDate ? new Date(item.expiryDate) : null,
    }))
  }
}
