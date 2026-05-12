/**
 * Payment Methods Report Service
 */

import prisma from '../../../../services/prisma.service.js'
import {
  buildFallbackRateMap,
  toUSD,
} from '../../../../shared/utils/currency.js'

interface PaymentMethodsFilters {
  dateFrom?: string
  dateTo?: string
}

type Agg = {
  method: string
  count: number
  totalAmount: Record<string, number>
  igtfAmount: Record<string, number>
  totalAmountUSD: number
  igtfAmountUSD: number
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

  const fallback = await buildFallbackRateMap(db, empresaId)

  const payments = await db.payment.findMany({
    where,
    select: {
      method: true,
      currency: true,
      exchangeRate: true,
      amount: true,
      igtfAmount: true,
    },
  })

  const methodMap = new Map<string, Agg>()
  const byCurrencyMap = new Map<
    string,
    { currency: string; count: number; totalAmount: number; totalAmountUSD: number }
  >()
  let totalUSD = 0
  let igtfUSD = 0

  for (const p of payments) {
    const method = p.method
    const cur = p.currency
    const rate = p.exchangeRate != null ? Number(p.exchangeRate) : null
    const amt = Number(p.amount ?? 0)
    const igtf = Number(p.igtfAmount ?? 0)
    const amtUSD = toUSD(amt, cur, rate, fallback) ?? 0
    const igtfUSDp = toUSD(igtf, cur, rate, fallback) ?? 0

    const agg =
      methodMap.get(method) ?? {
        method,
        count: 0,
        totalAmount: {},
        igtfAmount: {},
        totalAmountUSD: 0,
        igtfAmountUSD: 0,
      }
    agg.count += 1
    agg.totalAmount[cur] = (agg.totalAmount[cur] ?? 0) + amt
    agg.igtfAmount[cur] = (agg.igtfAmount[cur] ?? 0) + igtf
    agg.totalAmountUSD += amtUSD
    agg.igtfAmountUSD += igtfUSDp
    methodMap.set(method, agg)

    const cAgg =
      byCurrencyMap.get(cur) ?? {
        currency: cur,
        count: 0,
        totalAmount: 0,
        totalAmountUSD: 0,
      }
    cAgg.count += 1
    cAgg.totalAmount += amt
    cAgg.totalAmountUSD += amtUSD
    byCurrencyMap.set(cur, cAgg)

    totalUSD += amtUSD
    igtfUSD += igtfUSDp
  }

  const data = Array.from(methodMap.values())
    .sort((a, b) => b.totalAmountUSD - a.totalAmountUSD)
    .map((m) => ({
      method: m.method,
      count: m.count,
      totalAmount: m.totalAmount,
      totalAmountUSD: m.totalAmountUSD,
      percentage: totalUSD > 0 ? (m.totalAmountUSD / totalUSD) * 100 : 0,
      igtfAmount: m.igtfAmount,
      igtfAmountUSD: m.igtfAmountUSD,
      avgAmountUSD: m.count > 0 ? m.totalAmountUSD / m.count : 0,
    }))

  const byCurrency = Array.from(byCurrencyMap.values()).sort(
    (a, b) => b.totalAmountUSD - a.totalAmountUSD,
  )

  return {
    data,
    byCurrency,
    fxRates: fallback,
    summary: {
      totalPayments: payments.length,
      totalAmountUSD: totalUSD,
      totalIgtfUSD: igtfUSD,
    },
  }
}

export default { getPaymentMethodsReport }
