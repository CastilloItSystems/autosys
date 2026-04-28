// backend/src/features/finance/supplierBills/supplierBills.interface.ts

export type SupplierBillStatus =
  | 'PENDING_INVOICE'
  | 'PENDING'
  | 'PARTIAL'
  | 'PAID'
  | 'CANCELLED'

export interface ISupplierBill {
  id: string
  billNumber: string | null
  internalNumber: string
  status: SupplierBillStatus
  supplierId: string
  purchaseOrderId?: string | null
  currency: string
  exchangeRate?: number | null
  subtotal: number
  taxAmount: number
  total: number
  paidAmount: number
  pendingAmount: number
  issueDate: Date | null
  dueDate?: Date | null
  attachmentUrl?: string | null
  notes?: string | null
  items?: ISupplierBillItem[]
  empresaId: string
  createdAt: Date
  updatedAt: Date
}

export interface ISupplierBillItem {
  id?: string
  supplierBillId?: string
  itemId?: string | null
  itemName?: string | null
  quantity: number
  unitCost: number
  discountPercent?: number
  discountAmount?: number
  taxType?: 'IVA' | 'EXEMPT' | 'REDUCED'
  taxRate?: number
  taxAmount?: number
  subtotal?: number
  totalLine?: number
  notes?: string | null
}

export interface ICreateSupplierBillInput {
  billNumber: string
  supplierId: string
  purchaseOrderId?: string
  currency: string
  exchangeRate?: number
  subtotal: number
  taxAmount?: number
  total: number
  issueDate: Date | string
  dueDate?: Date | string
  attachmentUrl?: string
  notes?: string
  items: ISupplierBillItem[]
}

export interface IUpdateSupplierBillInput {
  billNumber?: string
  currency?: string
  exchangeRate?: number
  subtotal?: number
  taxAmount?: number
  total?: number
  issueDate?: Date | string
  dueDate?: Date | string
  attachmentUrl?: string
  notes?: string
  status?: SupplierBillStatus
  items?: ISupplierBillItem[]
}

export interface IRegisterSupplierInvoiceInput {
  billNumber: string
  issueDate: Date | string
  dueDate?: Date | string | null
  attachmentUrl?: string | null
  notes?: string | null
  subtotal?: number
  taxAmount?: number
  total?: number
}

export interface ISupplierBillFilters {
  status?: SupplierBillStatus
  supplierId?: string
  purchaseOrderId?: string
  from?: string
  to?: string
  search?: string
  page?: number
  limit?: number
}
