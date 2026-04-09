/**
 * Payment Methods Report Service
 */

import prisma from '../../../../services/prisma.service.js'

interface PaymentMethodsFilters {
  dateFrom?: string
  dateTo?: string
}

export async function getPaymentMethodsReport(
  empresaId?: string,
  prismaClient?: any,
  filters?: PaymentMethodsFilters
) {
  const db = prismaClient || prisma
  const where: any = { status: 'COMPLETED' }
  if (empresaId) where.empresaId = empresaId
  if (filters?.dateFrom || filters?.dateTo) {
    where.processedAt = {}
    if (filters?.dateFrom) where.processedAt.gte = new Date(filters.dateFrom)
    if (filters?.dateTo) where.processedAt.lte = new Date(filters.dateTo)
  }

  const [byMethod, byCurrency, totals] = await Promise.all([
    db.payment.groupBy({
      by: ['method'],
      where,
      _count: { id: true },
      _sum: { amount: true, igtfAmount: true },
      _avg: { amount: true },
      orderBy: { _sum: { amount: 'desc' } },
    }),
    db.payment.groupBy({
      by: ['currency'],
      where,
      _count: { id: true },
      _sum: { amount: true },
      orderBy: { _sum: { amount: 'desc' } },
    }),
    db.payment.aggregate({
      where,
      _count: { id: true },
      _sum: { amount: true, igtfAmount: true },
    }),
  ])

  const totalAmount = Number(totals._sum.amount ?? 0)

  const data = byMethod.map((m: any) => ({
    method: m.method,
    count: m._count.id,
    totalAmount: Number(m._sum.amount ?? 0),
    percentage: totalAmount > 0 ? (Number(m._sum.amount ?? 0) / totalAmount) * 100 : 0,
    igtfAmount: Number(m._sum.igtfAmount ?? 0),
    avgAmount: Number(m._avg.amount ?? 0),
  }))

  return {
    data,
    byCurrency: byCurrency.map((c: any) => ({
      currency: c.currency,
      count: c._count.id,
      totalAmount: Number(c._sum.amount ?? 0),
    })),
    summary: {
      totalPayments: totals._count.id,
      totalAmount,
      totalIgtf: Number(totals._sum.igtfAmount ?? 0),
    },
  }
}

export default { getPaymentMethodsReport }
