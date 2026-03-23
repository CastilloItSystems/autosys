/**
 * Sales by Product Report Service
 */

import prisma from '../../../../services/prisma.service.js'

interface ByProductFilters {
  dateFrom?: string
  dateTo?: string
  search?: string
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

  // Get qualifying invoice IDs
  const invoiceIds = (
    await db.invoice.findMany({ where: invoiceWhere, select: { id: true } })
  ).map((i: any) => i.id)

  const grouped = await db.invoiceItem.groupBy({
    by: ['itemId'],
    where: { invoiceId: { in: invoiceIds } },
    _count: { id: true },
    _sum: { quantity: true, totalLine: true, discountAmount: true },
    _avg: { unitPrice: true },
    orderBy: { _sum: { totalLine: 'desc' } },
  })

  const itemIds = grouped.map((g: any) => g.itemId)
  const items = await db.item.findMany({
    where: { id: { in: itemIds } },
    select: { id: true, name: true, sku: true, code: true },
  })
  const itemMap = new Map(items.map((i: any) => [i.id, i]))

  let rows = grouped.map((g: any) => {
    const item = itemMap.get(g.itemId) as any
    return {
      itemId: g.itemId,
      itemName: item?.name ?? '—',
      sku: item?.sku ?? item?.code ?? '—',
      totalQuantity: Number(g._sum.quantity ?? 0),
      totalRevenue: Number(g._sum.totalLine ?? 0),
      avgUnitPrice: Number(g._avg.unitPrice ?? 0),
      invoiceCount: g._count.id,
      totalDiscount: Number(g._sum.discountAmount ?? 0),
    }
  })

  if (filters?.search) {
    const s = filters.search.toLowerCase()
    rows = rows.filter(
      (r) => r.itemName.toLowerCase().includes(s) || r.sku.toLowerCase().includes(s)
    )
  }

  const total = rows.length
  const data = rows.slice((page - 1) * limit, page * limit)

  return { data, total, page, limit, totalPages: Math.ceil(total / limit) }
}

export default { getByProductReport }
