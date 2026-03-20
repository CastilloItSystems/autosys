// backend/src/features/sales/invoices/invoices.interface.ts

export enum InvoiceStatus {
  ACTIVE = 'ACTIVE',
  CANCELLED = 'CANCELLED',
  CREDITED = 'CREDITED',
}

export interface IInvoiceItem {
  id: string
  invoiceId: string
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
  item?: { id: string; sku: string; name: string }
  createdAt: Date
}

export interface IInvoice {
  id: string
  invoiceNumber: string
  fiscalNumber?: string | null
  status: InvoiceStatus
  empresaId: string
  preInvoiceId: string
  paymentId: string
  customerId: string
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
  invoiceDate: Date
  issuedBy?: string | null
  cancelledAt?: Date | null
  cancelledBy?: string | null
  cancellationReason?: string | null
  items: IInvoiceItem[]
  preInvoice?: any
  payment?: any
  customer?: any
  createdAt: Date
  updatedAt: Date
}

export interface IInvoiceFilters {
  status?: InvoiceStatus
  customerId?: string
  preInvoiceId?: string
  search?: string
}
