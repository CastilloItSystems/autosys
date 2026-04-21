// backend/src/features/sales/orders/orders.interface.ts

export enum OrderStatus {
  DRAFT = 'DRAFT',
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  APPROVED = 'APPROVED',
  CANCELLED = 'CANCELLED',
}

export enum OrderCurrency {
  USD = 'USD',
  VES = 'VES',
  EUR = 'EUR',
}

export interface IOrderItem {
  id: string
  orderId: string
  itemId: string
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
  notes?: string | null
  item?: { id: string; sku: string; name: string }
  createdAt: Date
  updatedAt: Date
}

export interface IOrder {
  id: string
  orderNumber: string
  status: OrderStatus
  empresaId: string
  customerId: string
  warehouseId: string
  currency: OrderCurrency
  exchangeRate?: number | null
  exchangeRateSource?: string | null
  paymentTerms?: string | null
  creditDays?: number | null
  deliveryTerms?: string | null
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
  approvedAt?: Date | null
  createdBy?: string | null
  approvedBy?: string | null
  items: IOrderItem[]
  customer?: any
  warehouse?: any
  preInvoice?: any
  createdAt: Date
  updatedAt: Date
}

export interface ICreateOrderItemInput {
  itemId: string
  itemName?: string | null
  quantity: number
  unitPrice: number
  discountPercent?: number
  taxType?: string
  notes?: string | null
}

export interface ICreateOrderInput {
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
  items: ICreateOrderItemInput[]
}

export interface IUpdateOrderInput {
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
  items?: ICreateOrderItemInput[]
}

export interface IOrderFilters {
  status?: OrderStatus
  customerId?: string
  warehouseId?: string
  startDate?: Date
  endDate?: Date
  search?: string
}

export interface IOrderSalesWarehouseRef {
  id: string
  code: string
  name: string
}

export interface IOrderStockOriginSuggestion {
  fromWarehouseId: string
  fromWarehouseCode: string
  fromWarehouseName: string
  availableToTransfer: number
  suggestedQuantity: number
}

export interface IOrderStockShortage {
  itemId: string
  itemSku: string
  itemName: string
  required: number
  available: number
  shortage: number
  suggestions: IOrderStockOriginSuggestion[]
  purchaseSuggestion?: IOrderPurchaseSuggestion | null
  coverage?: IOrderReplenishmentCoverage
}

export interface IOrderPurchaseSuggestion {
  supplierId: string
  supplierCode: string
  supplierName: string
  source: 'LAST_SUPPLIER' | 'PREFERRED_HISTORY' | 'GENERIC_DEFAULT'
  lastUnitCost?: number | null
  suggestedQuantity: number
}

export interface IOrderReplenishmentCoverage {
  transferCovered: number
  purchaseCovered: number
  remaining: number
}

export interface IOrderSalesStockDiagnosis {
  orderId: string
  orderNumber: string
  salesWarehouse: IOrderSalesWarehouseRef
  hasShortages: boolean
  shortages: IOrderStockShortage[]
}

export interface IOrderSuggestedTransfersResult {
  orderId: string
  orderNumber: string
  salesWarehouse: IOrderSalesWarehouseRef
  createdTransfers: Array<{
    id: string
    transferNumber: string
    fromWarehouseId: string
    fromWarehouseCode: string
    fromWarehouseName: string
    toWarehouseId: string
    status: string
    quantity: number
  }>
  shortages: IOrderStockShortage[]
}

export interface IOrderSuggestedPurchaseOrdersResult {
  orderId: string
  orderNumber: string
  salesWarehouse: IOrderSalesWarehouseRef
  created: Array<{
    purchaseOrderId: string
    orderNumber: string
    supplierId: string
    supplierCode: string
    supplierName: string
  }>
  reused: Array<{
    purchaseOrderId: string
    orderNumber: string
    supplierId: string
    supplierCode: string
    supplierName: string
  }>
  lineMerges: Array<{
    purchaseOrderId: string
    itemId: string
    quantityAdded: number
    merged: boolean
  }>
  shortages: IOrderStockShortage[]
}

export interface IOrderReplenishmentOverrideItem {
  itemId: string
  purchaseQuantity?: number
  supplierId?: string
}

export interface ICreateOrderReplenishmentInput {
  overrides?: IOrderReplenishmentOverrideItem[]
}

export interface IOrderReplenishmentLineAction {
  actionType: 'TRANSFER' | 'PURCHASE'
  targetType: 'CREATED' | 'REUSED' | 'MERGED'
  targetId: string
  itemId: string
  quantity: number
}

export interface IOrderSuggestedReplenishmentResult {
  orderId: string
  orderNumber: string
  salesWarehouse: IOrderSalesWarehouseRef
  shortages: Array<
    IOrderStockShortage & {
      transferPlan: IOrderStockOriginSuggestion[]
      purchasePlan: Array<{
        supplierId: string
        supplierCode: string
        supplierName: string
        quantity: number
      }>
      remainingAfterPlan: number
    }
  >
  createdTransfers: Array<{
    id: string
    transferNumber: string
    fromWarehouseId: string
    fromWarehouseCode: string
    fromWarehouseName: string
    toWarehouseId: string
    status: string
    quantity: number
  }>
  reusedTransfers: Array<{
    id: string
    transferNumber: string
    fromWarehouseId: string
    fromWarehouseCode: string
    fromWarehouseName: string
    toWarehouseId: string
    status: string
    quantity: number
  }>
  createdPOs: Array<{
    purchaseOrderId: string
    orderNumber: string
    supplierId: string
    supplierCode: string
    supplierName: string
    status: string
  }>
  reusedPOs: Array<{
    purchaseOrderId: string
    orderNumber: string
    supplierId: string
    supplierCode: string
    supplierName: string
    status: string
  }>
  lineActions: IOrderReplenishmentLineAction[]
  executionState: {
    linkedTransfers: Array<{ id: string; transferNumber: string; status: string }>
    linkedPOs: Array<{ id: string; orderNumber: string; status: string }>
    pendingTransfersCount: number
    pendingPOsCount: number
  }
}
