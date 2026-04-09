// backend/src/features/sales/payments/payments.interface.ts

export enum PaymentMethod {
  CASH = 'CASH',
  TRANSFER = 'TRANSFER',
  CARD = 'CARD',
  MOBILE_PAYMENT = 'MOBILE_PAYMENT',
  CHECK = 'CHECK',
  CREDIT = 'CREDIT',
  MIXED = 'MIXED',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
}

export interface IPaymentDetail {
  method: PaymentMethod
  amount: number
  reference?: string
  currency?: string
}

export interface IPayment {
  id: string
  paymentNumber: string
  status: PaymentStatus
  empresaId: string
  preInvoiceId: string
  customerId: string
  method: PaymentMethod
  amount: number
  currency: string
  exchangeRate?: number | null
  igtfApplies: boolean
  igtfAmount: number
  totalWithIgtf: number
  details?: IPaymentDetail[] | null
  reference?: string | null
  notes?: string | null
  processedBy?: string | null
  processedAt: Date
  preInvoice?: any
  customer?: any
  invoice?: any
  createdAt: Date
  updatedAt: Date
}

export interface ICreatePaymentInput {
  preInvoiceId: string
  method: PaymentMethod
  amount: number
  currency?: string
  exchangeRate?: number
  igtfApplies?: boolean
  details?: IPaymentDetail[]
  reference?: string
  notes?: string
}

export interface IPaymentFilters {
  status?: PaymentStatus
  method?: PaymentMethod
  customerId?: string
  preInvoiceId?: string
  search?: string
}
