// frontend/libs/interfaces/finance/supplierBill.ts

export type SupplierBillStatus =
  | 'PENDING_INVOICE'
  | 'PENDING'
  | 'PARTIAL'
  | 'PAID'
  | 'CANCELLED'

export interface SupplierBill {
  id: string
  billNumber: string | null
  internalNumber: string
  status: SupplierBillStatus
  supplierId: string
  supplier?: { id: string; name: string; taxId: string | null }
  purchaseOrderId: string | null
  purchaseOrder?: { id: string; orderNumber: string; total: number } | null
  currency: string
  exchangeRate: number | null
  subtotal: number
  taxAmount: number
  total: number
  paidAmount: number
  pendingAmount: number
  issueDate: string | null
  dueDate: string | null
  attachmentUrl: string | null
  notes: string | null
  items?: SupplierBillItem[]
  payments?: SupplierPaymentSummary[]
  empresaId: string
  createdAt: string
  updatedAt: string
}

export interface SupplierBillItem {
  id?: string
  supplierBillId?: string
  itemId?: string | null
  itemName?: string | null
  quantity: number
  unitCost: number
  discountPercent: number
  discountAmount: number
  taxType: 'IVA' | 'EXEMPT' | 'REDUCED'
  taxRate: number
  taxAmount: number
  subtotal: number
  totalLine: number
  notes?: string | null
  item?: {
    id: string
    sku: string
    name: string
  } | null
}

export interface SupplierPaymentSummary {
  id: string
  paymentNumber: string
  amount: number
  status: string
  processedAt: string
}

export interface AccountsPayableEntry {
  supplier: { id: string; name: string; taxId: string | null }
  totalPending: number
  totalPendingByCurrency: Record<string, number>
  overdueCount: number
  bills: (SupplierBill & { isOverdue?: boolean })[]
}

export interface CreateSupplierBillData {
  billNumber: string
  supplierId: string
  purchaseOrderId?: string
  currency: string
  exchangeRate?: number
  subtotal: number
  taxAmount?: number
  total: number
  issueDate: string
  dueDate?: string
  notes?: string
  items: SupplierBillItemInput[]
}

export interface UpdateSupplierBillData {
  billNumber?: string
  currency?: string
  exchangeRate?: number
  subtotal?: number
  taxAmount?: number
  total?: number
  issueDate?: string
  dueDate?: string
  notes?: string
  items?: SupplierBillItemInput[]
}

export interface SupplierBillItemInput {
  itemId?: string | null
  itemName?: string | null
  quantity: number
  unitCost: number
  discountPercent?: number
  taxType?: 'IVA' | 'EXEMPT' | 'REDUCED'
  taxRate?: number
  notes?: string | null
}

export interface RegisterSupplierInvoiceData {
  billNumber: string
  issueDate: string
  dueDate?: string | null
  attachmentUrl?: string | null
  notes?: string | null
  subtotal?: number
  taxAmount?: number
  total?: number
}
