// backend/src/features/inventory/purchaseOrders/purchaseOrders.interface.ts

export enum PurchaseOrderStatus {
  DRAFT = 'DRAFT',
  SENT = 'SENT',
  PARTIAL = 'PARTIAL',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum PurchaseOrderCurrency {
  USD = 'USD',
  VES = 'VES',
  EUR = 'EUR',
}

export enum TaxType {
  IVA = 'IVA',
  EXEMPT = 'EXEMPT',
  REDUCED = 'REDUCED',
}

export interface IPurchaseOrder {
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
  currency?: PurchaseOrderCurrency | undefined
  exchangeRate?: number | null | undefined
  paymentTerms?: string | null | undefined
  creditDays?: number | null | undefined
  deliveryTerms?: string | null | undefined
  discountAmount?: number | undefined
  subtotalBruto?: number | undefined
  baseImponible?: number | undefined
  baseExenta?: number | undefined
  taxAmount?: number | undefined
  taxRate?: number | undefined
  igtfApplies?: boolean | undefined
  igtfRate?: number | undefined
  igtfAmount?: number | undefined
  total?: number | undefined
  notes?: string | undefined
  expectedDate?: Date | undefined
  createdBy?: string | undefined
}

export interface IUpdatePurchaseOrderInput {
  status?: PurchaseOrderStatus | undefined
  currency?: PurchaseOrderCurrency | undefined
  exchangeRate?: number | null | undefined
  paymentTerms?: string | null | undefined
  creditDays?: number | null | undefined
  deliveryTerms?: string | null | undefined
  discountAmount?: number | undefined
  igtfApplies?: boolean | undefined
  notes?: string | null | undefined
  expectedDate?: Date | null | undefined
  items?: ICreatePurchaseOrderItemInput[]
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
}

export interface ICreatePurchaseOrderItemInput {
  itemId: string
  itemName?: string
  quantityOrdered: number
  unitCost: number
  discountPercent?: number
  discountAmount?: number
  taxType?: TaxType
  taxRate?: number
  taxAmount?: number
  subtotal?: number
  totalLine?: number
}

export interface IAddPurchaseOrderItemInput {
  purchaseOrderId: string
  itemId: string
  itemName?: string
  quantityOrdered: number
  unitCost: number
  discountPercent?: number
  discountAmount?: number
  taxType?: TaxType
  taxRate?: number
  taxAmount?: number
  subtotal?: number
  totalLine?: number
}

export interface ICreatePurchaseOrderWithItemsInput extends ICreatePurchaseOrderInput {
  items: ICreatePurchaseOrderItemInput[]
}

export interface IReceiveOrderItemInput {
  itemId: string
  purchaseOrderItemId?: string
  quantityReceived: number
  unitCost: number
  location?: string | null
  batchNumber?: string | null
  expiryDate?: Date | null
}

export interface IReceiveOrderInput {
  warehouseId?: string
  notes?: string
  receivedBy?: string
  items: IReceiveOrderItemInput[]
}
