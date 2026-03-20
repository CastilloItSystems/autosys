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
