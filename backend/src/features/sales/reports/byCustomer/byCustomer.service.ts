/**
 * Sales by Customer Report Service
 */

import prisma from '../../../../services/prisma.service.js'

interface ByCustomerFilters {
  dateFrom?: string
  dateTo?: string
  search?: string
}

export async function getByCustomerReport(
  page = 1,
  limit = 50,
  empresaId?: string,
  prismaClient?: any,
  filters?: ByCustomerFilters
) {
  const db = prismaClient || prisma
  const invoiceWhere: any = { status: 'ACTIVE' }
  if (empresaId) invoiceWhere.empresaId = empresaId
  if (filters?.dateFrom || filters?.dateTo) {
    invoiceWhere.invoiceDate = {}
    if (filters?.dateFrom) invoiceWhere.invoiceDate.gte = new Date(filters.dateFrom)
    if (filters?.dateTo) invoiceWhere.invoiceDate.lte = new Date(filters.dateTo)
  }

  const grouped = await db.invoice.groupBy({
    by: ['customerId'],
    where: invoiceWhere,
    _count: { id: true },
    _sum: { total: true, discountAmount: true },
    _avg: { total: true },
    _max: { invoiceDate: true },
    orderBy: { _sum: { total: 'desc' } },
  })

  const customerIds = grouped.map((g: any) => g.customerId)
  const customers = await db.customer.findMany({
    where: { id: { in: customerIds } },
    select: { id: true, name: true, taxId: true, type: true },
  })
  const customerMap = new Map(customers.map((c: any) => [c.id, c]))

  let rows = grouped.map((g: any) => {
    const customer = customerMap.get(g.customerId) as any
    return {
      customerId: g.customerId,
      customerName: customer?.name ?? '—',
      taxId: customer?.taxId ?? '—',
      customerType: customer?.type ?? '—',
      invoiceCount: g._count.id,
      totalRevenue: Number(g._sum.total ?? 0),
      avgTicket: Number(g._avg.total ?? 0),
      lastInvoiceDate: g._max.invoiceDate,
      totalDiscount: Number(g._sum.discountAmount ?? 0),
    }
  })

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

  return { data, total, page, limit, totalPages: Math.ceil(total / limit) }
}

export default { getByCustomerReport }
