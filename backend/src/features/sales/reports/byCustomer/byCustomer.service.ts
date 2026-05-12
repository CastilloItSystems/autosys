/**
 * Sales by Customer Report Service
 */

import prisma from '../../../../services/prisma.service.js'
import {
  buildFallbackRateMap,
  toUSD,
} from '../../../../shared/utils/currency.js'

interface ByCustomerFilters {
  dateFrom?: string
  dateTo?: string
  search?: string
}

type Agg = {
  customerId: string
  invoiceCount: number
  totalRevenue: Record<string, number>
  totalDiscount: Record<string, number>
  totalRevenueUSD: number
  totalDiscountUSD: number
  lastInvoiceDate: Date | null
}

export async function getByCustomerReport(
  page = 1,
  limit = 50,
  empresaId?: string,
  prismaClient?: any,
  filters?: ByCustomerFilters
) {
  const db = prismaClient || prisma
  const where: any = { status: 'ACTIVE' }
  if (empresaId) where.empresaId = empresaId
  if (filters?.dateFrom || filters?.dateTo) {
    where.invoiceDate = {}
    if (filters?.dateFrom) where.invoiceDate.gte = new Date(filters.dateFrom)
    if (filters?.dateTo) where.invoiceDate.lte = new Date(filters.dateTo)
  }

  const fallback = await buildFallbackRateMap(db, empresaId)

  const invoices = await db.invoice.findMany({
    where,
    select: {
      customerId: true,
      currency: true,
      exchangeRate: true,
      total: true,
      discountAmount: true,
      invoiceDate: true,
    },
  })

  const aggMap = new Map<string, Agg>()
  for (const inv of invoices) {
    const id = inv.customerId
    const agg =
      aggMap.get(id) ?? {
        customerId: id,
        invoiceCount: 0,
        totalRevenue: {},
        totalDiscount: {},
        totalRevenueUSD: 0,
        totalDiscountUSD: 0,
        lastInvoiceDate: null,
      }
    const cur = inv.currency
    const rate = inv.exchangeRate != null ? Number(inv.exchangeRate) : null
    const tot = Number(inv.total)
    const disc = Number(inv.discountAmount ?? 0)

    agg.invoiceCount += 1
    agg.totalRevenue[cur] = (agg.totalRevenue[cur] ?? 0) + tot
    agg.totalDiscount[cur] = (agg.totalDiscount[cur] ?? 0) + disc
    agg.totalRevenueUSD += toUSD(tot, cur, rate, fallback) ?? 0
    agg.totalDiscountUSD += toUSD(disc, cur, rate, fallback) ?? 0
    if (!agg.lastInvoiceDate || inv.invoiceDate > agg.lastInvoiceDate) {
      agg.lastInvoiceDate = inv.invoiceDate
    }
    aggMap.set(id, agg)
  }

  const customerIds = Array.from(aggMap.keys())
  const customers = await db.customer.findMany({
    where: { id: { in: customerIds } },
    select: { id: true, name: true, taxId: true, type: true },
  })
  const customerMap = new Map(customers.map((c: any) => [c.id, c]))

  let rows = Array.from(aggMap.values()).map((g) => {
    const customer = customerMap.get(g.customerId) as any
    return {
      customerId: g.customerId,
      customerName: customer?.name ?? '—',
      taxId: customer?.taxId ?? '—',
      customerType: customer?.type ?? '—',
      invoiceCount: g.invoiceCount,
      totalRevenue: g.totalRevenue,
      totalRevenueUSD: g.totalRevenueUSD,
      avgTicketUSD: g.invoiceCount > 0 ? g.totalRevenueUSD / g.invoiceCount : 0,
      totalDiscount: g.totalDiscount,
      totalDiscountUSD: g.totalDiscountUSD,
      lastInvoiceDate: g.lastInvoiceDate,
    }
  })

  rows.sort((a, b) => b.totalRevenueUSD - a.totalRevenueUSD)

  if (filters?.search) {
    const s = filters.search.toLowerCase()
    rows = rows.filter(
      (r) =>
        r.customerName.toLowerCase().includes(s) ||
        r.taxId.toLowerCase().includes(s)
    )
  }

  const total = rows.length
  const data = rows.slice((page - 1) * limit, page * limit)

  return {
    data,
    fxRates: fallback,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  }
}

export default { getByCustomerReport }
