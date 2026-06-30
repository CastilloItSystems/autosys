// backend/src/features/sales/orders/orders.shared.ts

import { PrismaClient, Prisma } from '../../../generated/prisma/client.js'
import { SALES_MESSAGES } from '../shared/constants/messages.js'

export type PrismaClientType = PrismaClient | Prisma.TransactionClient

export const MSG = SALES_MESSAGES?.order ?? {
  notFound: 'Orden no encontrada',
  cannotEdit: 'No se puede editar esta orden',
  created: 'Orden creada exitosamente',
  updated: 'Orden actualizada exitosamente',
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const ORDER_INCLUDE = {
  items: {
    include: {
      item: { select: { id: true, sku: true, name: true, salePrice: true } },
    },
  },
  customer: true,
  warehouse: { select: { id: true, name: true, code: true, empresaId: true } },
} as const

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function generateOrderNumber(): string {
  const year = new Date().getFullYear()
  const ts = Date.now().toString(36).toUpperCase()
  const rnd = Math.random().toString(36).substring(2, 5).toUpperCase()
  return `OV-${year}-${ts}${rnd}`
}

export function generatePreInvoiceNumber(): string {
  const year = new Date().getFullYear()
  const ts = Date.now().toString(36).toUpperCase()
  const rnd = Math.random().toString(36).substring(2, 5).toUpperCase()
  return `PF-${year}-${ts}${rnd}`
}

export function orderReplenishmentToken(orderId: string): string {
  return `[ORDER:${orderId}]`
}

export function salesOrderAuditMetadata(order: {
  orderNumber?: string | null
  customerId?: string | null
  warehouseId?: string | null
  total?: unknown
  currency?: unknown
}) {
  return {
    orderNumber: order.orderNumber ?? null,
    customerId: order.customerId ?? null,
    warehouseId: order.warehouseId ?? null,
    total: Number(order.total ?? 0),
    currency: order.currency ? String(order.currency) : null,
  }
}
