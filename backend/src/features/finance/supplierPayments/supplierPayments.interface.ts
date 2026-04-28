// backend/src/features/finance/supplierPayments/supplierPayments.interface.ts

export type SupplierPaymentMethod = 'CASH' | 'TRANSFER' | 'CARD' | 'MOBILE_PAYMENT' | 'CHECK' | 'CREDIT' | 'MIXED'
export type SupplierPaymentStatus = 'PENDING' | 'COMPLETED' | 'CANCELLED' | 'REFUNDED'

export interface ISupplierPayment {
  id: string
  paymentNumber: string
  status: SupplierPaymentStatus
  supplierId?: string | null
  supplierBillId?: string | null
  expenseId?: string | null
  bankAccountId: string
  method: SupplierPaymentMethod
  amount: number
  currency: string
  exchangeRate?: number | null
  igtfApplies: boolean
  igtfAmount: number
  totalWithIgtf: number
  details?: any
  reference?: string | null
  notes?: string | null
  processedBy?: string | null
  processedAt: Date
  empresaId: string
  createdAt: Date
  updatedAt: Date
}

export interface ICreateSupplierPaymentInput {
  supplierId?: string
  supplierBillId?: string
  expenseId?: string
  bankAccountId: string
  method: SupplierPaymentMethod
  amount: number
  currency: string
  exchangeRate?: number
  igtfApplies?: boolean
  details?: any
  reference?: string
  notes?: string
}

export interface ISupplierPaymentFilters {
  status?: SupplierPaymentStatus
  supplierId?: string
  supplierBillId?: string
  expenseId?: string
  from?: string
  to?: string
  page?: number
  limit?: number
}
