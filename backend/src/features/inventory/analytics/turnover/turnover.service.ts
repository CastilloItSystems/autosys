/**
 * Turnover Service - Inventory Turnover Analysis
 * Uses 4 parallel DB aggregations instead of N+1 queries
 */

import prisma from '../../../../services/prisma.service.js'

// Movement types that represent actual inventory outflow
const OUTGOING_TYPES = ['SALE', 'ADJUSTMENT_OUT', 'SUPPLIER_RETURN', 'LOAN_OUT']

export type TurnoverClassification = 'FAST_MOVING' | 'MODERATE' | 'SLOW_MOVING' | 'STATIC'
export type TurnoverTrend = 'improving' | 'declining' | 'stable'

export interface TurnoverMetrics {
  itemId: string
  itemName: string
  sku: string
  code?: string
  turnoverRatio: number
  daysInventoryOutstanding: number
  healthScore: number
  classification: TurnoverClassification
  trend: TurnoverTrend
  stockValue: number
  recommendations: string[]
}

const RECOMMENDATIONS: Record<TurnoverClassification, string[]> = {
  FAST_MOVING: [
    'Mantener stock de seguridad alto',
    'Aumentar frecuencia de compra para evitar quiebres',
  ],
  MODERATE: [
    'Control de inventario estándar',
    'Revisar punto de reorden periódicamente',
  ],
  SLOW_MOVING: [
    'Reducir niveles de stock',
    'Evaluar actividades promocionales para aumentar ventas',
  ],
  STATIC: [
    'Evaluar descontinuación del artículo',
    'Considerar liquidación por falta de movimiento',
  ],
}

function classifyTurnover(ratio: number): TurnoverClassification {
  if (ratio > 6) return 'FAST_MOVING'
  if (ratio > 2) return 'MODERATE'
  if (ratio > 0) return 'SLOW_MOVING'
  return 'STATIC'
}

function calcHealthScore(turnoverRatio: number, dio: number): number {
  let score = 50
  if (turnoverRatio >= 2 && turnoverRatio <= 6) score += 30
  else if (
    (turnoverRatio >= 1 && turnoverRatio < 2) ||
    (turnoverRatio > 6 && turnoverRatio <= 10)
  ) score += 15
  if (dio >= 60 && dio <= 180) score += 20
  else if ((dio >= 30 && dio < 60) || (dio > 180 && dio <= 360)) score += 10
  return Math.min(100, Math.max(0, score))
}

/**
 * Get turnover metrics for all items (or filtered by classification).
 * Uses 4 parallel queries instead of N+1.
 */
export async function getAllTurnoverMetrics(
  page = 1,
  limit = 50,
  classification?: TurnoverClassification | null,
  empresaId?: string,
  prismaClient?: any
) {
  const db = prismaClient || prisma

  const now = new Date()
  const date365 = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
  const date90  = new Date(now.getTime() -  90 * 24 * 60 * 60 * 1000)
  const date30  = new Date(now.getTime() -  30 * 24 * 60 * 60 * 1000)

  const movWhere   = empresaId ? { item: { empresaId } } : {}
  const stockWhere = empresaId ? { warehouse: { empresaId } } : {}

  // ── 4 parallel queries (replaces N+1) ────────────────────────────────────
  const [stocks, mov365raw, mov90raw, mov30raw] = await Promise.all([
    // 1. Stocks: per item across all warehouses
    db.stock.findMany({
      where: stockWhere,
      select: {
        itemId: true,
        quantityReal: true,
        averageCost: true,
        item: { select: { name: true, sku: true, code: true, costPrice: true } },
      },
    }),

    // 2-4. Outgoing movement totals for 3 time windows
    db.movement.groupBy({
      by: ['itemId'],
      where: { ...movWhere, movementDate: { gte: date365 }, type: { in: OUTGOING_TYPES } },
      _sum: { quantity: true },
    }),
    db.movement.groupBy({
      by: ['itemId'],
      where: { ...movWhere, movementDate: { gte: date90 }, type: { in: OUTGOING_TYPES } },
      _sum: { quantity: true },
    }),
    db.movement.groupBy({
      by: ['itemId'],
      where: { ...movWhere, movementDate: { gte: date30 }, type: { in: OUTGOING_TYPES } },
      _sum: { quantity: true },
    }),
  ])

  // ── Aggregate stock per item across warehouses ────────────────────────────
  const stockMap = new Map<string, {
    name: string; sku: string; code: string; quantity: number; unitCost: number
  }>()
  for (const s of stocks as any[]) {
    const unitCost = Number(s.averageCost || s.item.costPrice || 0)
    const existing = stockMap.get(s.itemId)
    if (existing) {
      const newQty = existing.quantity + s.quantityReal
      existing.unitCost = newQty > 0
        ? (existing.unitCost * existing.quantity + unitCost * s.quantityReal) / newQty
        : unitCost
      existing.quantity = newQty
    } else {
      stockMap.set(s.itemId, {
        name: s.item.name,
        sku: s.item.sku ?? '',
        code: s.item.code ?? '',
        quantity: s.quantityReal,
        unitCost,
      })
    }
  }

  // ── Build outgoing maps ───────────────────────────────────────────────────
  const toMap = (raw: any[]) => {
    const m = new Map<string, number>()
    for (const r of raw) m.set(r.itemId, r._sum.quantity ?? 0)
    return m
  }
  const out365 = toMap(mov365raw)
  const out30  = toMap(mov30raw)

  // ── Compute metrics per item ──────────────────────────────────────────────
  const results: TurnoverMetrics[] = []
  for (const [itemId, stock] of stockMap) {
    const cogs365 = out365.get(itemId) ?? 0
    const cogs30  = out30.get(itemId) ?? 0

    // Use current stock as average inventory (simplified but consistent)
    const avgStock = stock.quantity
    const turnoverRatio = avgStock > 0 ? cogs365 / avgStock : 0
    const dio = turnoverRatio > 0
      ? Math.round((365 / turnoverRatio) * 10) / 10
      : 999
    const healthScore = calcHealthScore(turnoverRatio, dio)
    const cls = classifyTurnover(turnoverRatio)

    // Trend: compare annualized 30-day rate vs full 365-day rate
    const rate365 = cogs365 / 365
    const rate30  = cogs30 / 30
    let trend: TurnoverTrend = 'stable'
    if (rate365 > 0) {
      if (rate30 > rate365 * 1.15) trend = 'improving'
      else if (rate30 < rate365 * 0.85) trend = 'declining'
    }

    results.push({
      itemId,
      itemName: stock.name,
      sku: stock.sku,
      code: stock.code,
      turnoverRatio: Math.round(turnoverRatio * 100) / 100,
      daysInventoryOutstanding: Math.min(dio, 999),
      healthScore,
      classification: cls,
      trend,
      stockValue: Math.round(stock.quantity * stock.unitCost * 100) / 100,
      recommendations: RECOMMENDATIONS[cls],
    })
  }

  // Sort by turnover ratio descending
  results.sort((a, b) => b.turnoverRatio - a.turnoverRatio)

  // ── Summary (always from full dataset, not filtered) ──────────────────────
  const summary = {
    totalItems: results.length,
    averageTurnover: results.length > 0
      ? Math.round((results.reduce((s, r) => s + r.turnoverRatio, 0) / results.length) * 100) / 100
      : 0,
    fastMovingCount: results.filter((r) => r.classification === 'FAST_MOVING').length,
    moderateCount:   results.filter((r) => r.classification === 'MODERATE').length,
    slowMovingCount: results.filter((r) => r.classification === 'SLOW_MOVING').length,
    staticCount:     results.filter((r) => r.classification === 'STATIC').length,
  }

  // Filter after computing (ensures correct pagination per classification)
  const filtered = classification
    ? results.filter((r) => r.classification === classification)
    : results

  const paginated = filtered.slice((page - 1) * limit, page * limit)

  return { data: paginated, total: filtered.length, summary, page, limit }
}

export async function getTurnoverMetricsForItem(
  itemId: string,
  empresaId?: string,
  prismaClient?: any
) {
  const result = await getAllTurnoverMetrics(1, 100_000, null, empresaId, prismaClient)
  const item = result.data.find((r) => r.itemId === itemId)
  if (!item) throw new Error('Item not found')
  return item
}

export default { getAllTurnoverMetrics, getTurnoverMetricsForItem }
