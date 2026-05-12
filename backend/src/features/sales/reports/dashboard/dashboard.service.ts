/**
 * Sales Dashboard Report Service
 */

import prisma from '../../../../services/prisma.service.js'
import {
  buildFallbackRateMap,
  toUSD,
  accumulate,
  emptyBreakdown,
  type FallbackRateMap,
} from '../../../../shared/utils/currency.js'

type InvoiceRow = {
  total: any
  currency: string
  exchangeRate: any | null
  invoiceDate: Date
}

type PaymentRow = {
  amount: any
  currency: string
  exchangeRate: any | null
  processedAt: Date | null
}

function reduceInvoices(rows: InvoiceRow[], fallback: FallbackRateMap) {
  const acc = emptyBreakdown()
  for (const r of rows) {
    accumulate(
      acc,
      Number(r.total),
      r.currency,
      r.exchangeRate != null ? Number(r.exchangeRate) : null,
      fallback,
    )
  }
  return { ...acc, invoices: rows.length }
}

function reducePayments(rows: PaymentRow[], fallback: FallbackRateMap) {
  const amount: Record<string, number> = {}
  let amountUSD = 0
  for (const r of rows) {
    const amt = Number(r.amount)
    amount[r.currency] = (amount[r.currency] ?? 0) + amt
    const usd = toUSD(
      amt,
      r.currency,
      r.exchangeRate != null ? Number(r.exchangeRate) : null,
      fallback,
    )
    if (usd != null) amountUSD += usd
  }
  return { amount, amountUSD, payments: rows.length }
}

export async function getSalesDashboard(empresaId?: string, prismaClient?: any) {
  const db = prismaClient || prisma
  const where: any = {}
  if (empresaId) where.empresaId = empresaId

  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const fallbackRates = await buildFallbackRateMap(db, empresaId)

  const invoiceSelect = {
    total: true,
    currency: true,
    exchangeRate: true,
    invoiceDate: true,
  }

  const [
    monthInvoiceRows,
    todayPaymentRows,
    pendingOrders,
    pendingPreInvoices,
    recentInvoices,
  ] = await Promise.all([
    db.invoice.findMany({
      where: { ...where, status: 'ACTIVE', invoiceDate: { gte: startOfMonth } },
      select: invoiceSelect,
    }),
    db.payment.findMany({
      where: { ...where, status: 'COMPLETED', processedAt: { gte: startOfToday } },
      select: { amount: true, currency: true, exchangeRate: true, processedAt: true },
    }),
    db.order.count({ where: { ...where, status: 'PENDING_APPROVAL' } }),
    db.preInvoice.count({
      where: {
        ...where,
        status: { in: ['PENDING_PREPARATION', 'IN_PREPARATION', 'READY_FOR_PAYMENT'] },
      },
    }),
    db.invoice.findMany({
      where: { ...where, status: 'ACTIVE' },
      select: {
        id: true,
        invoiceNumber: true,
        total: true,
        currency: true,
        exchangeRate: true,
        invoiceDate: true,
        customer: { select: { name: true } },
      },
      orderBy: { invoiceDate: 'desc' },
      take: 10,
    }),
  ])

  const weekRows = monthInvoiceRows.filter((r: InvoiceRow) => r.invoiceDate >= startOfWeek)
  const todayRows = monthInvoiceRows.filter((r: InvoiceRow) => r.invoiceDate >= startOfToday)

  const today = reduceInvoices(todayRows, fallbackRates)
  const week = reduceInvoices(weekRows, fallbackRates)
  const month = reduceInvoices(monthInvoiceRows, fallbackRates)
  const todayPay = reducePayments(todayPaymentRows, fallbackRates)

  return {
    today: {
      invoices: today.invoices,
      revenue: today.revenue,
      revenueUSD: today.revenueUSD,
      payments: todayPay.payments,
      paymentsAmount: todayPay.amount,
      paymentsAmountUSD: todayPay.amountUSD,
    },
    week: {
      invoices: week.invoices,
      revenue: week.revenue,
      revenueUSD: week.revenueUSD,
    },
    month: {
      invoices: month.invoices,
      revenue: month.revenue,
      revenueUSD: month.revenueUSD,
    },
    pending: {
      ordersAwaitingApproval: pendingOrders,
      preInvoicesAwaitingPayment: pendingPreInvoices,
    },
    byCurrency: month.revenue,
    byCurrencyUSD: month.revenueUSD,
    fxRates: fallbackRates,
    recentInvoices: recentInvoices.map((inv: any) => ({
      id: inv.id,
      invoiceNumber: inv.invoiceNumber,
      customerName: inv.customer?.name ?? '—',
      total: Number(inv.total),
      currency: inv.currency,
      exchangeRate: inv.exchangeRate != null ? Number(inv.exchangeRate) : null,
      totalUSD: toUSD(
        Number(inv.total),
        inv.currency,
        inv.exchangeRate != null ? Number(inv.exchangeRate) : null,
        fallbackRates,
      ),
      invoiceDate: inv.invoiceDate,
    })),
  }
}

export default { getSalesDashboard }
