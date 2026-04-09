/**
 * Inventory Aging Report Service
 * Groups stock by inactivity age brackets based on last movement date
 */

import prisma from '../../../../services/prisma.service.js'

const AGE_BRACKETS = [
  { label: '0–30 días', min: 0, max: 30 },
  { label: '31–60 días', min: 31, max: 60 },
  { label: '61–90 días', min: 61, max: 90 },
  { label: '91–180 días', min: 91, max: 180 },
  { label: '181–365 días', min: 181, max: 365 },
  { label: 'Más de 1 año', min: 366, max: Infinity },
]

export interface AgingItem {
  itemId: string
  itemName: string
  itemSKU: string
  warehouseId: string
  warehouseName: string
  quantity: number
  value: number
  lastMovement: Date | null
  daysOld: number
  ageBracket: string
}

export interface AgingSummary {
  bracket: string
  itemCount: number
  totalQuantity: number
  totalValue: number
}

export async function getAgingReport(
  page = 1,
  limit = 50,
  empresaId?: string,
  prismaClient?: any
) {
  const db = prismaClient || prisma

  // Get all active stocks with their items and warehouses
  const allStocks = await db.stock.findMany({
    where: {
      quantityReal: { gt: 0 },
      ...(empresaId ? { warehouse: { empresaId } } : {}),
    },
    include: { item: true, warehouse: true },
  })

  if (allStocks.length === 0) {
    return {
      data: [],
      summary: AGE_BRACKETS.map((b) => ({
        bracket: b.label,
        itemCount: 0,
        totalQuantity: 0,
        totalValue: 0,
      })),
      total: 0,
      page,
      limit,
      totalPages: 0,
    }
  }

  // Get last movement per item
  const itemIds = [...new Set(allStocks.map((s: any) => s.itemId))]
  const movementGroups = await db.movement.groupBy({
    by: ['itemId'],
    where: {
      itemId: { in: itemIds },
      ...(empresaId ? { item: { empresaId } } : {}),
    },
    _max: { movementDate: true },
  })

  const lastMovementByItem: Record<string, Date | null> = {}
  movementGroups.forEach((m: any) => {
    lastMovementByItem[m.itemId] = m._max.movementDate
  })

  const now = new Date()

  // Enrich stocks with age data
  const agingItems: AgingItem[] = allStocks.map((s: any) => {
    const lastMovement = lastMovementByItem[s.itemId] ?? null
    const daysOld = lastMovement
      ? Math.floor((now.getTime() - lastMovement.getTime()) / (1000 * 60 * 60 * 24))
      : Math.floor((now.getTime() - s.createdAt.getTime()) / (1000 * 60 * 60 * 24))

    const bracket =
      AGE_BRACKETS.find((b) => daysOld >= b.min && daysOld <= b.max)?.label ??
      'Más de 1 año'

    return {
      itemId: s.itemId,
      itemName: s.item.name,
      itemSKU: s.item.sku,
      warehouseId: s.warehouseId,
      warehouseName: s.warehouse.name,
      quantity: s.quantityReal,
      value: s.quantityReal * Number(s.item.costPrice || 0),
      lastMovement,
      daysOld,
      ageBracket: bracket,
    }
  })

  // Sort by daysOld descending
  agingItems.sort((a, b) => b.daysOld - a.daysOld)

  // Build summary by bracket
  const summaryMap: Record<string, AgingSummary> = {}
  AGE_BRACKETS.forEach((b) => {
    summaryMap[b.label] = { bracket: b.label, itemCount: 0, totalQuantity: 0, totalValue: 0 }
  })

  agingItems.forEach((item) => {
    if (summaryMap[item.ageBracket]) {
      summaryMap[item.ageBracket].itemCount++
      summaryMap[item.ageBracket].totalQuantity += item.quantity
      summaryMap[item.ageBracket].totalValue += item.value
    }
  })

  const summary = Object.values(summaryMap)
  const total = agingItems.length
  const paginated = agingItems.slice((page - 1) * limit, page * limit)

  return {
    data: paginated,
    summary,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  }
}

export default { getAgingReport }
