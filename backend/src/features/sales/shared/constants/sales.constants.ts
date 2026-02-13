// backend/src/features/sales/shared/constants/sales.constants.ts

export const ORDER_STATUS = {
  DRAFT: 'DRAFT',
  PENDING_APPROVAL: 'PENDING_APPROVAL',
  APPROVED: 'APPROVED',
  CANCELLED: 'CANCELLED',
} as const

export type OrderStatus = (typeof ORDER_STATUS)[keyof typeof ORDER_STATUS]

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  DRAFT: 'Borrador',
  PENDING_APPROVAL: 'Pendiente de Aprobación',
  APPROVED: 'Aprobado',
  CANCELLED: 'Cancelado',
}

export const PRE_INVOICE_STATUS = {
  PENDING_PREPARATION: 'PENDING_PREPARATION',
  IN_PREPARATION: 'IN_PREPARATION',
  READY_FOR_PAYMENT: 'READY_FOR_PAYMENT',
  PAID: 'PAID',
  CANCELLED: 'CANCELLED',
} as const

export type PreInvoiceStatus =
  (typeof PRE_INVOICE_STATUS)[keyof typeof PRE_INVOICE_STATUS]

export const PRE_INVOICE_STATUS_LABELS: Record<PreInvoiceStatus, string> = {
  PENDING_PREPARATION: 'Pendiente de Preparación',
  IN_PREPARATION: 'En Preparación',
  READY_FOR_PAYMENT: 'Listo para Pago',
  PAID: 'Pagado',
  CANCELLED: 'Cancelado',
}

export const PAYMENT_METHOD = {
  CASH: 'CASH',
  TRANSFER: 'TRANSFER',
  CARD: 'CARD',
  MOBILE_PAYMENT: 'MOBILE_PAYMENT',
  CHECK: 'CHECK',
  CREDIT: 'CREDIT',
  MIXED: 'MIXED',
} as const

export type PaymentMethod = (typeof PAYMENT_METHOD)[keyof typeof PAYMENT_METHOD]

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  CASH: 'Efectivo',
  TRANSFER: 'Transferencia',
  CARD: 'Tarjeta',
  MOBILE_PAYMENT: 'Pago Móvil',
  CHECK: 'Cheque',
  CREDIT: 'Crédito',
  MIXED: 'Mixto',
}

export const PAYMENT_STATUS = {
  PENDING: 'PENDING',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  REFUNDED: 'REFUNDED',
} as const

export type PaymentStatus = (typeof PAYMENT_STATUS)[keyof typeof PAYMENT_STATUS]

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  PENDING: 'Pendiente',
  COMPLETED: 'Completado',
  CANCELLED: 'Cancelado',
  REFUNDED: 'Reembolsado',
}

export const INVOICE_STATUS = {
  ACTIVE: 'ACTIVE',
  CANCELLED: 'CANCELLED',
  CREDITED: 'CREDITED',
} as const

export type InvoiceStatus = (typeof INVOICE_STATUS)[keyof typeof INVOICE_STATUS]

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  ACTIVE: 'Activa',
  CANCELLED: 'Anulada',
  CREDITED: 'Con Nota de Crédito',
}

export const CUSTOMER_TYPE = {
  INDIVIDUAL: 'INDIVIDUAL',
  COMPANY: 'COMPANY',
} as const

export type CustomerType = (typeof CUSTOMER_TYPE)[keyof typeof CUSTOMER_TYPE]

export const CUSTOMER_TYPE_LABELS: Record<CustomerType, string> = {
  INDIVIDUAL: 'Persona Natural',
  COMPANY: 'Empresa',
}

export const TAX_RATES = {
  IVA: 16, // IVA en Venezuela (puede cambiar)
  IGTF: 3, // Impuesto a las Grandes Transacciones Financieras
} as const
