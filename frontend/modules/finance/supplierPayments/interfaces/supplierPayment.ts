// frontend/libs/interfaces/finance/supplierPayment.ts

export type PaymentMethod = 'CASH' | 'TRANSFER' | 'CARD' | 'MOBILE_PAYMENT' | 'CHECK' | 'CREDIT' | 'MIXED'
export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'CANCELLED' | 'REFUNDED'

export interface SupplierPayment {
  id: string
  paymentNumber: string
  status: PaymentStatus
  supplierId: string
  supplier?: { id: string; name: string }
  supplierBillId: string | null
  supplierBill?: { id: string; internalNumber: string; billNumber: string } | null
  expenseId: string | null
  expense?: { id: string; expenseNumber: string; description: string } | null
  bankAccountId: string
  bankAccount?: { id: string; name: string; type: string }
  method: PaymentMethod
  amount: number
  currency: string
  exchangeRate: number | null
  igtfApplies: boolean
  igtfAmount: number
  totalWithIgtf: number
  details: any
  reference: string | null
  notes: string | null
  processedBy: string | null
  processedAt: string
  empresaId: string
  createdAt: string
  updatedAt: string
}

export interface CreateSupplierPaymentData {
  supplierId: string
  supplierBillId?: string
  expenseId?: string
  bankAccountId: string
  method: PaymentMethod
  amount: number
  currency: string
  exchangeRate?: number
  igtfApplies?: boolean
  details?: any
  reference?: string
  notes?: string
}
