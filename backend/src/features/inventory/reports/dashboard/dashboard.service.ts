/**
 * Dashboard Report Service
 * Uses targeted DB aggregations instead of loading everything into memory
 */

import prisma from '../../../../services/prisma.service.js'

export interface DashboardMetrics {
  totalItems: number
  totalWarehouses: number
  totalStockValue: number
  stockHealth: { inStock: number; lowStock: number; outOfStock: number }
  movements: { today: number; thisWeek: number; thisMonth: number }
  dailyMovements: Array<{ date: string; count: number }>
  alerts: { critical: number; warning: number; info: number }
  topMovingItems: Array<{ itemId: string; itemName: string; movementCount: number; lastMovement: Date }>
  topWarehouses: Array<{ warehouseId: string; warehouseName: string; itemCount: number; totalValue: number }>
  recentActivities: Array<{ type: string; description: string; timestamp: Date }>
}

const MOVEMENT_LABELS: Record<string, string> = {
  PURCHASE:            'Compra',
  SALE:                'Venta',
  ADJUSTMENT_IN:       'Ajuste entrada',
  ADJUSTMENT_OUT:      'Ajuste salida',
  TRANSFER:            'Transferencia',
  SUPPLIER_RETURN:     'Dev. proveedor',
  WORKSHOP_RETURN:     'Dev. taller',
  RESERVATION_RELEASE: 'Liberación reserva',
  LOAN_OUT:            'Préstamo salida',
  LOAN_RETURN:         'Préstamo retorno',
}

export async function getDashboardMetrics(
  empresaId: string,
  prismaClient?: any
): Promise<DashboardMetrics> {
  const db = prismaClient || prisma

  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
  const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)

  const movWhere = { item: { empresaId } }

  // ── All queries run in parallel ──────────────────────────────────────────
  const [
    totalItems,
    totalWarehouses,
    stocks,
    movToday,
    movWeek,
    movMonth,
    movLast7Days,       // lightweight: only dates, no JOINs
    topMovingRaw,       // groupBy aggregate
    recentRaw,          // last 20 movements with item name only
  ] = await Promise.all([
    // 1. Count items (DB-level, no data loaded)
    db.item.count({ where: { empresaId } }),

    // 2. Count warehouses
    db.warehouse.count({ where: { empresaId } }),

    // 3. Stocks — select only what we need (no full item JOIN)
    db.stock.findMany({
      where: { warehouse: { empresaId } },
      select: {
        warehouseId: true,
        quantityReal: true,
        quantityAvailable: true,
        averageCost: true,
        item: { select: { minStock: true, costPrice: true } },
        warehouse: { select: { id: true, name: true } },
      },
    }),

    // 4-6. Movement counts at DB level
    db.movement.count({ where: { ...movWhere, createdAt: { gte: today } } }),
    db.movement.count({ where: { ...movWhere, createdAt: { gte: weekAgo } } }),
    db.movement.count({ where: { ...movWhere, createdAt: { gte: monthAgo } } }),

    // 7. Daily movements: only timestamps for last 7 days (no item JOIN)
    db.movement.findMany({
      where: { ...movWhere, createdAt: { gte: weekAgo } },
      select: { createdAt: true },
    }),

    // 8. Top moving items: groupBy aggregate + last movement date
    db.movement.groupBy({
      by: ['itemId'],
      where: movWhere,
      _count: { id: true },
      _max: { createdAt: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    }),

    // 9. Recent 20 movements: only needed fields + item name
    db.movement.findMany({
      where: movWhere,
      select: {
        type: true,
        reference: true,
        createdAt: true,
        item: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
  ])

  // ── Stock health & value (in-memory but with minimal data) ────────────────
  const stockHealth = { inStock: 0, lowStock: 0, outOfStock: 0 }
  let totalStockValue = 0
  const warehouseMap = new Map<string, { name: string; value: number; itemCount: number }>()

  for (const s of stocks) {
    const unitCost = Number(s.averageCost || s.item.costPrice || 0)
    totalStockValue += s.quantityReal * unitCost

    if (s.quantityReal === 0) {
      stockHealth.outOfStock++
    } else if (s.quantityAvailable <= (s.item.minStock ?? 10)) {
      stockHealth.lowStock++
    } else {
      stockHealth.inStock++
    }

    const wh = warehouseMap.get(s.warehouseId)
    if (wh) {
      wh.value += s.quantityReal * unitCost
      if (s.quantityReal > 0) wh.itemCount++
    } else {
      warehouseMap.set(s.warehouseId, {
        name: s.warehouse.name,
        value: s.quantityReal * unitCost,
        itemCount: s.quantityReal > 0 ? 1 : 0,
      })
    }
  }

  // ── Daily movements map ───────────────────────────────────────────────────
  const dailyMap: Record<string, number> = {}
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today.getTime() - i * 24 * 60 * 60 * 1000)
    dailyMap[d.toISOString().split('T')[0]] = 0
  }
  for (const m of movLast7Days) {
    const key = new Date(m.createdAt).toISOString().split('T')[0]
    if (key in dailyMap) dailyMap[key]++
  }
  const dailyMovements = Object.entries(dailyMap).map(([date, count]) => ({ date, count }))

  // ── Top moving items: resolve names with a single IN query ────────────────
  const topItemIds = topMovingRaw.map((r: any) => r.itemId)
  const topItemNames = topItemIds.length > 0
    ? await db.item.findMany({
        where: { id: { in: topItemIds } },
        select: { id: true, name: true },
      })
    : []
  const nameById = new Map(topItemNames.map((i: any) => [i.id, i.name]))

  const topMovingItems = topMovingRaw.map((r: any) => ({
    itemId: r.itemId,
    itemName: nameById.get(r.itemId) ?? 'Desconocido',
    movementCount: r._count.id,
    lastMovement: r._max.createdAt,
  }))

  // ── Top warehouses ────────────────────────────────────────────────────────
  const topWarehouses = Array.from(warehouseMap.entries())
    .map(([warehouseId, data]) => ({ warehouseId, warehouseName: data.name, totalValue: data.value, itemCount: data.itemCount }))
    .sort((a, b) => b.totalValue - a.totalValue)
    .slice(0, 10)

  // ── Recent activities ─────────────────────────────────────────────────────
  const recentActivities = recentRaw.map((m: any) => {
    const label = MOVEMENT_LABELS[m.type] ?? m.type
    const ref = m.reference ? ` (${m.reference})` : ''
    return {
      type: m.type,
      description: `${label}: ${m.item?.name ?? 'Artículo'}${ref}`,
      timestamp: new Date(m.createdAt),
    }
  })

  return {
    totalItems,
    totalWarehouses,
    totalStockValue,
    stockHealth,
    movements: { today: movToday, thisWeek: movWeek, thisMonth: movMonth },
    dailyMovements,
    alerts: { critical: stockHealth.outOfStock, warning: stockHealth.lowStock, info: 0 },
    topMovingItems,
    topWarehouses,
    recentActivities,
  }
}

export default { getDashboardMetrics }
