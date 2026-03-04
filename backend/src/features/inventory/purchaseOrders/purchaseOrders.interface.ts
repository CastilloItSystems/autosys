// backend/src/features/inventory/purchaseOrders/purchaseOrders.interface.ts

export enum PurchaseOrderStatus {
  DRAFT = 'DRAFT',
  SENT = 'SENT',
  PARTIAL = 'PARTIAL',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export interface IPurchaseOrder {
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
}

export interface IPurchaseOrderWithRelations extends IPurchaseOrder {
  supplier?: any
  warehouse?: any
  items?: any[]
  receives?: any[]
  entryNotes?: any[]
}

export interface ICreatePurchaseOrderInput {
  supplierId: string
  warehouseId: string
  notes?: string | undefined
  expectedDate?: Date | undefined
  createdBy?: string | undefined
}

export interface IUpdatePurchaseOrderInput {
  status?: PurchaseOrderStatus | undefined
  notes?: string | null | undefined
  expectedDate?: Date | null | undefined
}

export interface IApprovePurchaseOrderInput {
  approvedBy: string
}

export interface IPurchaseOrderFilters {
  status?: PurchaseOrderStatus
  supplierId?: string
  warehouseId?: string
  createdBy?: string
  orderFrom?: Date
  orderTo?: Date
}

export interface IPurchaseOrderItem {
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
}

export interface ICreatePurchaseOrderItemInput {
  itemId: string
  quantityOrdered: number
  unitCost: number
}

export interface IAddPurchaseOrderItemInput {
  purchaseOrderId: string
  itemId: string
  quantityOrdered: number
  unitCost: number
}

export interface ICreatePurchaseOrderWithItemsInput {
  supplierId: string
  warehouseId: string
  notes?: string
  expectedDate?: Date
  createdBy?: string
  items: ICreatePurchaseOrderItemInput[]
}

export interface IReceiveOrderItemInput {
  itemId: string
  purchaseOrderItemId?: string
  quantityReceived: number
  unitCost: number
  batchNumber?: string | null
  expiryDate?: Date | null
}

export interface IReceiveOrderInput {
  warehouseId?: string
  notes?: string
  receivedBy?: string
  items: IReceiveOrderItemInput[]
}
