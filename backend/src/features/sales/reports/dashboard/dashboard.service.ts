/**
 * Sales Dashboard Report Service
 */

import prisma from '../../../../services/prisma.service.js'

export async function getSalesDashboard(empresaId?: string, prismaClient?: any) {
  const db = prismaClient || prisma
  const where: any = {}
  if (empresaId) where.empresaId = empresaId

  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const [
    todayInvoices,
    weekInvoices,
    monthInvoices,
    todayPayments,
    pendingOrders,
    pendingPreInvoices,
    byCurrency,
    recentInvoices,
  ] = await Promise.all([
    db.invoice.aggregate({
      where: { ...where, status: 'ACTIVE', invoiceDate: { gte: startOfToday } },
      _count: { id: true },
      _sum: { total: true },
    }),
    db.invoice.aggregate({
      where: { ...where, status: 'ACTIVE', invoiceDate: { gte: startOfWeek } },
      _count: { id: true },
      _sum: { total: true },
    }),
    db.invoice.aggregate({
      where: { ...where, status: 'ACTIVE', invoiceDate: { gte: startOfMonth } },
      _count: { id: true },
      _sum: { total: true },
    }),
    db.payment.aggregate({
      where: { ...where, status: 'COMPLETED', processedAt: { gte: startOfToday } },
      _count: { id: true },
      _sum: { amount: true },
    }),
    db.order.count({ where: { ...where, status: 'PENDING_APPROVAL' } }),
    db.preInvoice.count({
      where: {
        ...where,
        status: { in: ['PENDING_PREPARATION', 'IN_PREPARATION', 'READY_FOR_PAYMENT'] },
      },
    }),
    db.invoice.groupBy({
      by: ['currency'],
      where: { ...where, status: 'ACTIVE', invoiceDate: { gte: startOfMonth } },
      _sum: { total: true },
      _count: { id: true },
    }),
    db.invoice.findMany({
      where: { ...where, status: 'ACTIVE' },
      select: {
        id: true,
        invoiceNumber: true,
        total: true,
        currency: true,
        invoiceDate: true,
        customer: { select: { name: true } },
      },
      orderBy: { invoiceDate: 'desc' },
      take: 10,
    }),
  ])

  const currencyMap: Record<string, number> = { USD: 0, VES: 0, EUR: 0 }
  for (const c of byCurrency) {
    currencyMap[c.currency] = Number(c._sum.total ?? 0)
  }

  return {
    today: {
      invoices: todayInvoices._count.id,
      revenue: Number(todayInvoices._sum.total ?? 0),
      payments: todayPayments._count.id,
      paymentsAmount: Number(todayPayments._sum.amount ?? 0),
    },
    week: {
      invoices: weekInvoices._count.id,
      revenue: Number(weekInvoices._sum.total ?? 0),
    },
    month: {
      invoices: monthInvoices._count.id,
      revenue: Number(monthInvoices._sum.total ?? 0),
    },
    pending: {
      ordersAwaitingApproval: pendingOrders,
      preInvoicesAwaitingPayment: pendingPreInvoices,
    },
    byCurrency: currencyMap,
    recentInvoices: recentInvoices.map((inv: any) => ({
      id: inv.id,
      invoiceNumber: inv.invoiceNumber,
      customerName: inv.customer?.name ?? '—',
      total: Number(inv.total),
      currency: inv.currency,
      invoiceDate: inv.invoiceDate,
    })),
  }
}

export default { getSalesDashboard }
