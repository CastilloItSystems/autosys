/**
 * Forecasting Service - Demand Forecasting using Time Series Analysis
 * Uses batch DB queries instead of N+1 (2 queries per call regardless of item count)
 */

import prisma from '../../../../services/prisma.service.js'
import { NotFoundError } from '../../../../shared/utils/errors.js'

// Movement types that represent actual demand outflow
const DEMAND_TYPES = ['SALE', 'ADJUSTMENT_OUT', 'LOAN_OUT']

export type StockoutRisk = 'low' | 'medium' | 'high'
export type TrendDirection = 'increasing' | 'decreasing' | 'stable'

export interface ForecastResult {
  itemId: string
  itemName: string
  sku: string
  code?: string
  currentStock: number
  estimatedDemand: {
    demand30Days: number
    demand60Days: number
    demand90Days: number
  }
  forecast: {
    daysForecast: Array<{ date: string; forecastedDemand: number; confidence: number }>
  }
  stockoutRisk: StockoutRisk
  trendDirection: TrendDirection
  recommendations: string[]
}

// ── Math helpers ──────────────────────────────────────────────────────────────

function exponentialSmoothing(values: number[], alpha = 0.3): number[] {
  if (values.length === 0) return []
  const result = [values[0]]
  for (let i = 1; i < values.length; i++) {
    result.push(alpha * values[i] + (1 - alpha) * result[i - 1])
  }
  return result
}

function classifyRisk(currentStock: number, forecast30: number): StockoutRisk {
  if (forecast30 === 0) return 'low'
  const ratio = currentStock / forecast30
  if (ratio < 0.5) return 'high'
  if (ratio < 1.0) return 'medium'
  return 'low'
}

function calcTrend(historicalDaily: number, forecast30: number): TrendDirection {
  if (historicalDaily === 0) return 'stable'
  const forecastDaily = forecast30 / 30
  const change = (forecastDaily - historicalDaily) / historicalDaily
  if (change > 0.05) return 'increasing'
  if (change < -0.05) return 'decreasing'
  return 'stable'
}

const RECOMMENDATIONS: Record<StockoutRisk, string[]> = {
  low: [
    'Stock suficiente para la demanda proyectada',
    'Monitorear tendencias estacionales',
  ],
  medium: [
    'Considerar aumentar el nivel de stock',
    'Revisar punto de reorden',
  ],
  high: [
    'Aumentar stock urgentemente',
    'Coordinar con proveedores para acelerar entrega',
  ],
}

// ── Core computation (pure function, no DB) ───────────────────────────────────

function computeForecast(
  item: { id: string; name: string; sku: string | null; code: string | null },
  currentStock: number,
  movements: Array<{ quantity: number; movementDate: Date }>
): ForecastResult {
  // Build daily demand values for last 90 days
  const dailyMap: Record<string, number> = {}
  for (const m of movements) {
    const key = new Date(m.movementDate).toISOString().split('T')[0]
    dailyMap[key] = (dailyMap[key] ?? 0) + m.quantity
  }

  const demandValues: number[] = []
  for (let i = 89; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
    demandValues.push(dailyMap[d.toISOString().split('T')[0]] ?? 0)
  }

  const totalDemand = demandValues.reduce((a, b) => a + b, 0)
  const historicalDaily = totalDemand / 90

  const smoothed = exponentialSmoothing(demandValues)
  const lastSmoothed = smoothed[smoothed.length - 1] ?? historicalDaily

  const forecast30 = Math.round(lastSmoothed * 30)
  const forecast60 = Math.round(lastSmoothed * 60)
  const forecast90 = Math.round(lastSmoothed * 90)

  // Confidence: inverse of coefficient of variation (capped 0.5–0.95)
  const mean = Math.max(historicalDaily, 0.0001)
  const stdDev = Math.sqrt(
    demandValues.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / demandValues.length
  )
  const confidence = Math.round(Math.max(0.5, Math.min(0.95, 1 - stdDev / mean)) * 100) / 100

  const daysForecast = Array.from({ length: 30 }, (_, i) => ({
    date: new Date(Date.now() + (i + 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    forecastedDemand: Math.max(0, Math.round(lastSmoothed)),
    confidence,
  }))

  const risk = classifyRisk(currentStock, forecast30)

  return {
    itemId: item.id,
    itemName: item.name,
    sku: item.sku ?? '',
    code: item.code ?? undefined,
    currentStock,
    estimatedDemand: { demand30Days: forecast30, demand60Days: forecast60, demand90Days: forecast90 },
    forecast: { daysForecast },
    stockoutRisk: risk,
    trendDirection: calcTrend(historicalDaily, forecast30),
    recommendations: RECOMMENDATIONS[risk],
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function getAllDemandForecasts(
  page = 1,
  limit = 50,
  empresaId?: string,
  prismaClient?: any
): Promise<{ data: ForecastResult[]; total: number }> {
  const db = prismaClient || prisma

  const itemWhere = empresaId ? { empresaId, isActive: true } : { isActive: true }

  const [items, total] = await Promise.all([
    db.item.findMany({
      where: itemWhere,
      skip: (page - 1) * limit,
      take: limit,
      select: { id: true, name: true, sku: true, code: true },
      orderBy: { name: 'asc' },
    }),
    db.item.count({ where: itemWhere }),
  ])

  if ((items as any[]).length === 0) return { data: [], total }

  const itemIds = (items as any[]).map((i: any) => i.id)
  const date90 = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
  const stockWhere = empresaId
    ? { itemId: { in: itemIds }, warehouse: { empresaId } }
    : { itemId: { in: itemIds } }

  // ── 2 batch queries instead of N×2 ────────────────────────────────────────
  const [stocks, movements] = await Promise.all([
    db.stock.findMany({
      where: stockWhere,
      select: { itemId: true, quantityReal: true },
    }),
    db.movement.findMany({
      where: {
        itemId: { in: itemIds },
        movementDate: { gte: date90 },
        type: { in: DEMAND_TYPES },
      },
      select: { itemId: true, quantity: true, movementDate: true },
    }),
  ])

  // Group stocks and movements by item
  const stockByItem = new Map<string, number>()
  for (const s of stocks as any[]) {
    stockByItem.set(s.itemId, (stockByItem.get(s.itemId) ?? 0) + s.quantityReal)
  }

  const movsByItem = new Map<string, Array<{ quantity: number; movementDate: Date }>>()
  for (const m of movements as any[]) {
    if (!movsByItem.has(m.itemId)) movsByItem.set(m.itemId, [])
    movsByItem.get(m.itemId)!.push(m)
  }

  const data = (items as any[]).map((item: any) =>
    computeForecast(item, stockByItem.get(item.id) ?? 0, movsByItem.get(item.id) ?? [])
  )

  return { data, total }
}

export async function getDemandForecastForItem(
  itemId: string,
  empresaId?: string,
  prismaClient?: any
): Promise<ForecastResult> {
  const db = prismaClient || prisma

  const item = await db.item.findUnique({
    where: { id: itemId },
    select: { id: true, name: true, sku: true, code: true, empresaId: true },
  })

  if (!item) throw new NotFoundError('Item not found')
  if (empresaId && item.empresaId !== empresaId) throw new NotFoundError('Item not found')

  const date90 = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
  const stockWhere = empresaId
    ? { itemId, warehouse: { empresaId } }
    : { itemId }

  const [stocks, movements] = await Promise.all([
    db.stock.findMany({ where: stockWhere, select: { quantityReal: true } }),
    db.movement.findMany({
      where: { itemId, movementDate: { gte: date90 }, type: { in: DEMAND_TYPES } },
      select: { quantity: true, movementDate: true },
    }),
  ])

  const currentStock = (stocks as any[]).reduce((s: number, r: any) => s + r.quantityReal, 0)
  return computeForecast(item, currentStock, movements)
}

export async function calculateForecastAccuracy(
  itemId: string,
  daysBack = 30,
  empresaId?: string,
  prismaClient?: any
): Promise<{ itemId: string; accuracy: number; daysBack: number }> {
  const db = prismaClient || prisma
  const startDate = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000)
  const date90 = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)

  const movWhere = empresaId ? { item: { empresaId } } : {}

  const [recent, historical] = await Promise.all([
    db.movement.aggregate({
      where: { ...movWhere, itemId, movementDate: { gte: startDate }, type: { in: DEMAND_TYPES } },
      _sum: { quantity: true },
    }),
    db.movement.aggregate({
      where: { ...movWhere, itemId, movementDate: { gte: date90 }, type: { in: DEMAND_TYPES } },
      _sum: { quantity: true },
    }),
  ])

  const actual = recent._sum.quantity ?? 0
  const expected = ((historical._sum.quantity ?? 0) / 90) * daysBack

  if (expected === 0) return { itemId, accuracy: 1, daysBack }
  const accuracy = Math.max(0, Math.min(1, 1 - Math.abs(actual - expected) / expected))
  return { itemId, accuracy: Math.round(accuracy * 100) / 100, daysBack }
}

export default { getAllDemandForecasts, getDemandForecastForItem, calculateForecastAccuracy }
