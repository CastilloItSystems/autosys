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
