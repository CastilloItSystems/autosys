// backend/src/features/sales/preInvoices/preInvoices.interface.ts

export enum PreInvoiceStatus {
  PENDING_PREPARATION = 'PENDING_PREPARATION',
  IN_PREPARATION = 'IN_PREPARATION',
  READY_FOR_PAYMENT = 'READY_FOR_PAYMENT',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED',
}

export interface IPreInvoiceItem {
  id: string
  preInvoiceId: string
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
  batchId?: string | null
  serialNumberId?: string | null
  notes?: string | null
  item?: { id: string; sku: string; name: string }
  createdAt: Date
  updatedAt: Date
}

export interface IPreInvoice {
  id: string
  preInvoiceNumber: string
  status: PreInvoiceStatus
  empresaId: string
  orderId?: string | null
  serviceOrderId?: string | null
  customerId: string
  warehouseId?: string | null
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
  preparedAt?: Date | null
  paidAt?: Date | null
  preparedBy?: string | null
  items: IPreInvoiceItem[]
  order?: any
  serviceOrder?: any
  consolidatedServiceOrders?: any[]
  customer?: any
  warehouse?: any
  exitNote?: any
  invoice?: any
  createdAt: Date
  updatedAt: Date
}

export interface IPreInvoiceFilters {
  status?: PreInvoiceStatus
  customerId?: string
  orderId?: string
  serviceOrderId?: string
  hasServiceOrder?: boolean
  origin?: 'ORDER' | 'WORKSHOP'
  search?: string
}

export interface ISalesWarehouseRef {
  id: string
  code: string
  name: string
}

export interface IStockOriginSuggestion {
  fromWarehouseId: string
  fromWarehouseCode: string
  fromWarehouseName: string
  availableToTransfer: number
  suggestedQuantity: number
}

export interface IPreInvoiceStockShortage {
  itemId: string
  itemSku: string
  itemName: string
  required: number
  available: number
  shortage: number
  suggestions: IStockOriginSuggestion[]
}

export interface IPreInvoiceSalesStockDiagnosis {
  preInvoiceId: string
  preInvoiceNumber: string
  isWorkshopPreInvoice: boolean
  salesWarehouse: ISalesWarehouseRef | null
  hasShortages: boolean
  shortages: IPreInvoiceStockShortage[]
}

export interface ICreateSuggestedTransfersResult {
  preInvoiceId: string
  preInvoiceNumber: string
  salesWarehouse: ISalesWarehouseRef
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
  shortages: IPreInvoiceStockShortage[]
}
