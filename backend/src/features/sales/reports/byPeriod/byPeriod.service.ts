/**
 * Sales by Period Report Service
 */

import prisma from '../../../../services/prisma.service.js'
import {
  buildFallbackRateMap,
  toUSD,
} from '../../../../shared/utils/currency.js'

type Granularity = 'day' | 'week' | 'month'

interface ByPeriodFilters {
  dateFrom?: string
  dateTo?: string
  granularity?: Granularity
  customerId?: string
  currency?: string
}

function getPeriodKey(date: Date, granularity: Granularity): string {
  if (granularity === 'month') {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
  }
  if (granularity === 'week') {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1)
    d.setDate(diff)
    return d.toISOString().split('T')[0]
  }
  return date.toISOString().split('T')[0]
}

type Agg = {
  invoiceCount: number
  subtotal: Record<string, number>
  taxAmount: Record<string, number>
  igtfAmount: Record<string, number>
  total: Record<string, number>
  subtotalUSD: number
  taxAmountUSD: number
  igtfAmountUSD: number
  totalUSD: number
}

const emptyAgg = (): Agg => ({
  invoiceCount: 0,
  subtotal: {},
  taxAmount: {},
  igtfAmount: {},
  total: {},
  subtotalUSD: 0,
  taxAmountUSD: 0,
  igtfAmountUSD: 0,
  totalUSD: 0,
})

function addToBucket(map: Record<string, number>, currency: string, amount: number) {
  map[currency] = (map[currency] ?? 0) + amount
}

export async function getByPeriodReport(
  page = 1,
  limit = 50,
  empresaId?: string,
  prismaClient?: any,
  filters?: ByPeriodFilters
) {
  const db = prismaClient || prisma
  const where: any = { status: 'ACTIVE' }
  if (empresaId) where.empresaId = empresaId
  if (filters?.customerId) where.customerId = filters.customerId
  if (filters?.currency) where.currency = filters.currency
  if (filters?.dateFrom || filters?.dateTo) {
    where.invoiceDate = {}
    if (filters?.dateFrom) where.invoiceDate.gte = new Date(filters.dateFrom)
    if (filters?.dateTo) where.invoiceDate.lte = new Date(filters.dateTo)
  }

  const fallback = await buildFallbackRateMap(db, empresaId)

  const invoices = await db.invoice.findMany({
    where,
    select: {
      invoiceDate: true,
      currency: true,
      exchangeRate: true,
      subtotalBruto: true,
      taxAmount: true,
      igtfAmount: true,
      total: true,
    },
    orderBy: { invoiceDate: 'asc' },
  })

  const granularity: Granularity = filters?.granularity ?? 'day'
  const periodMap = new Map<string, Agg>()

  for (const inv of invoices) {
    const key = getPeriodKey(new Date(inv.invoiceDate), granularity)
    const agg = periodMap.get(key) ?? emptyAgg()
    const cur = inv.currency
    const rate = inv.exchangeRate != null ? Number(inv.exchangeRate) : null

    const sub = Number(inv.subtotalBruto)
    const tax = Number(inv.taxAmount)
    const igtf = Number(inv.igtfAmount)
    const tot = Number(inv.total)

    agg.invoiceCount += 1
    addToBucket(agg.subtotal, cur, sub)
    addToBucket(agg.taxAmount, cur, tax)
    addToBucket(agg.igtfAmount, cur, igtf)
    addToBucket(agg.total, cur, tot)

    agg.subtotalUSD += toUSD(sub, cur, rate, fallback) ?? 0
    agg.taxAmountUSD += toUSD(tax, cur, rate, fallback) ?? 0
    agg.igtfAmountUSD += toUSD(igtf, cur, rate, fallback) ?? 0
    agg.totalUSD += toUSD(tot, cur, rate, fallback) ?? 0

    periodMap.set(key, agg)
  }

  const allData = Array.from(periodMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([period, agg]) => ({ period, ...agg }))

  const total = allData.length
  const data = allData.slice((page - 1) * limit, page * limit)
  const grandTotalUSD = allData.reduce((acc, d) => acc + d.totalUSD, 0)

  const summary = {
    totalPeriods: total,
    totalInvoices: invoices.length,
    totalRevenueUSD: grandTotalUSD,
    avgRevenuePerPeriodUSD: total > 0 ? grandTotalUSD / total : 0,
  }

  return {
    data,
    summary,
    fxRates: fallback,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  }
}

export default { getByPeriodReport }
