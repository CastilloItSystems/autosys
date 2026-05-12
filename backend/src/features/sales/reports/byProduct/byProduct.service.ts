/**
 * Sales by Product Report Service
 */

import prisma from '../../../../services/prisma.service.js'
import {
  buildFallbackRateMap,
  toUSD,
} from '../../../../shared/utils/currency.js'

interface ByProductFilters {
  dateFrom?: string
  dateTo?: string
  search?: string
}

type Agg = {
  itemId: string
  invoiceIds: Set<string>
  totalQuantity: number
  totalRevenue: Record<string, number>
  totalDiscount: Record<string, number>
  totalRevenueUSD: number
  totalDiscountUSD: number
  // avgUnitPrice se calcula por moneda — almacenamos suma/count
  unitPriceSum: Record<string, number>
  unitPriceCount: Record<string, number>
}

export async function getByProductReport(
  page = 1,
  limit = 50,
  empresaId?: string,
  prismaClient?: any,
  filters?: ByProductFilters
) {
  const db = prismaClient || prisma
  const invoiceWhere: any = { status: 'ACTIVE' }
  if (empresaId) invoiceWhere.empresaId = empresaId
  if (filters?.dateFrom || filters?.dateTo) {
    invoiceWhere.invoiceDate = {}
    if (filters?.dateFrom) invoiceWhere.invoiceDate.gte = new Date(filters.dateFrom)
    if (filters?.dateTo) invoiceWhere.invoiceDate.lte = new Date(filters.dateTo)
  }

  const fallback = await buildFallbackRateMap(db, empresaId)

  // Traemos facturas con currency/exchangeRate y sus items, para no asumir
  // que el item hereda la moneda del invoice (lo hace, pero hay que mapear).
  const invoices = await db.invoice.findMany({
    where: invoiceWhere,
    select: {
      id: true,
      currency: true,
      exchangeRate: true,
      items: {
        select: {
          itemId: true,
          quantity: true,
          unitPrice: true,
          totalLine: true,
          discountAmount: true,
        },
      },
    },
  })

  const aggMap = new Map<string, Agg>()
  for (const inv of invoices) {
    const cur = inv.currency
    const rate = inv.exchangeRate != null ? Number(inv.exchangeRate) : null
    for (const it of inv.items as any[]) {
      const id = it.itemId
      if (!id) continue
      const agg =
        aggMap.get(id) ?? {
          itemId: id,
          invoiceIds: new Set<string>(),
          totalQuantity: 0,
          totalRevenue: {},
          totalDiscount: {},
          totalRevenueUSD: 0,
          totalDiscountUSD: 0,
          unitPriceSum: {},
          unitPriceCount: {},
        }
      const qty = Number(it.quantity ?? 0)
      const rev = Number(it.totalLine ?? 0)
      const disc = Number(it.discountAmount ?? 0)
      const up = Number(it.unitPrice ?? 0)

      agg.invoiceIds.add(inv.id)
      agg.totalQuantity += qty
      agg.totalRevenue[cur] = (agg.totalRevenue[cur] ?? 0) + rev
      agg.totalDiscount[cur] = (agg.totalDiscount[cur] ?? 0) + disc
      agg.totalRevenueUSD += toUSD(rev, cur, rate, fallback) ?? 0
      agg.totalDiscountUSD += toUSD(disc, cur, rate, fallback) ?? 0
      agg.unitPriceSum[cur] = (agg.unitPriceSum[cur] ?? 0) + up
      agg.unitPriceCount[cur] = (agg.unitPriceCount[cur] ?? 0) + 1

      aggMap.set(id, agg)
    }
  }

  const itemIds = Array.from(aggMap.keys())
  const items = await db.item.findMany({
    where: { id: { in: itemIds } },
    select: { id: true, name: true, sku: true, code: true },
  })
  const itemMap = new Map(items.map((i: any) => [i.id, i]))

  let rows = Array.from(aggMap.values()).map((g) => {
    const item = itemMap.get(g.itemId) as any
    const avgUnitPrice: Record<string, number> = {}
    for (const cur of Object.keys(g.unitPriceSum)) {
      const n = g.unitPriceCount[cur] || 1
      avgUnitPrice[cur] = g.unitPriceSum[cur] / n
    }
    return {
      itemId: g.itemId,
      itemName: item?.name ?? '—',
      sku: item?.sku ?? item?.code ?? '—',
      totalQuantity: g.totalQuantity,
      totalRevenue: g.totalRevenue,
      totalRevenueUSD: g.totalRevenueUSD,
      avgUnitPrice,
      invoiceCount: g.invoiceIds.size,
      totalDiscount: g.totalDiscount,
      totalDiscountUSD: g.totalDiscountUSD,
    }
  })

  rows.sort((a, b) => b.totalRevenueUSD - a.totalRevenueUSD)

  if (filters?.search) {
    const s = filters.search.toLowerCase()
    rows = rows.filter(
      (r) => r.itemName.toLowerCase().includes(s) || r.sku.toLowerCase().includes(s)
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

export default { getByProductReport }
