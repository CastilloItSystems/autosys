/**
 * Sales by Period Report Service
 */

import prisma from '../../../../services/prisma.service.js'

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

  const invoices = await db.invoice.findMany({
    where,
    select: {
      invoiceDate: true,
      subtotalBruto: true,
      taxAmount: true,
      igtfAmount: true,
      total: true,
    },
    orderBy: { invoiceDate: 'asc' },
  })

  const granularity: Granularity = filters?.granularity ?? 'day'
  const periodMap = new Map<
    string,
    { invoiceCount: number; subtotal: number; taxAmount: number; igtfAmount: number; total: number }
  >()

  for (const inv of invoices) {
    const key = getPeriodKey(new Date(inv.invoiceDate), granularity)
    const existing = periodMap.get(key) ?? {
      invoiceCount: 0,
      subtotal: 0,
      taxAmount: 0,
      igtfAmount: 0,
      total: 0,
    }
    existing.invoiceCount += 1
    existing.subtotal += Number(inv.subtotalBruto)
    existing.taxAmount += Number(inv.taxAmount)
    existing.igtfAmount += Number(inv.igtfAmount)
    existing.total += Number(inv.total)
    periodMap.set(key, existing)
  }

  const allData = Array.from(periodMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([period, agg]) => ({ period, ...agg }))

  const total = allData.length
  const data = allData.slice((page - 1) * limit, page * limit)
  const grandTotal = allData.reduce((acc, d) => acc + d.total, 0)

  const summary = {
    totalPeriods: total,
    totalInvoices: invoices.length,
    totalRevenue: grandTotal,
    avgRevenuePerPeriod: total > 0 ? grandTotal / total : 0,
  }

  return { data, summary, total, page, limit, totalPages: Math.ceil(total / limit) }
}

export default { getByPeriodReport }
