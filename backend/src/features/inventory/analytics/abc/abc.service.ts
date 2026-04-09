/**
 * ABC Analysis Service
 * Classifies inventory by value contribution (Pareto principle)
 */

import prisma from '../../../../services/prisma.service.js'

const RECOMMENDATIONS: Record<'A' | 'B' | 'C', string[]> = {
  A: [
    'Mantener stock de seguridad alto',
    'Revisión frecuente de demanda',
    'Controlar rotación y evitar quiebres',
  ],
  B: [
    'Control de inventario estándar',
    'Revisar punto de reorden periódicamente',
  ],
  C: [
    'Minimizar stock de seguridad',
    'Evaluar descontinuación si sin movimiento',
    'Pedidos por lote para reducir costos',
  ],
}

export async function getABCAnalysis(
  page = 1,
  limit = 50,
  empresaId?: string,
  prismaClient?: any
) {
  const db = prismaClient || prisma

  const stockWhere = empresaId ? { warehouse: { empresaId } } : {}

  const stocks = await db.stock.findMany({
    where: stockWhere,
    select: {
      itemId: true,
      quantityReal: true,
      averageCost: true,
      item: { select: { name: true, sku: true, code: true, costPrice: true } },
    },
  })

  // Aggregate per item across all warehouses
  const itemMap = new Map<string, { name: string; sku: string; code: string; quantity: number; totalValue: number }>()

  for (const s of stocks as any[]) {
    const unitCost = Number(s.averageCost || s.item.costPrice || 0)
    const tv = s.quantityReal * unitCost
    const existing = itemMap.get(s.itemId)
    if (existing) {
      existing.quantity += s.quantityReal
      existing.totalValue += tv
    } else {
      itemMap.set(s.itemId, {
        name: s.item.name,
        sku: s.item.sku,
        code: s.item.code,
        quantity: s.quantityReal,
        totalValue: tv,
      })
    }
  }

  // Sort descending by value
  const sorted = Array.from(itemMap.entries())
    .map(([itemId, data]) => ({ itemId, ...data }))
    .sort((a, b) => b.totalValue - a.totalValue)

  const totalValue = sorted.reduce((sum, i) => sum + i.totalValue, 0)

  // Classify with cumulative %
  let cumulativeValue = 0
  const classified = sorted.map((item) => {
    cumulativeValue += item.totalValue
    const cumulativePercentage = totalValue > 0 ? cumulativeValue / totalValue : 0
    const percentageOfTotal = totalValue > 0 ? item.totalValue / totalValue : 0

    let classification: 'A' | 'B' | 'C'
    if (cumulativePercentage <= 0.80) {
      classification = 'A'
    } else if (cumulativePercentage <= 0.95) {
      classification = 'B'
    } else {
      classification = 'C'
    }

    return {
      itemId: item.itemId,
      itemName: item.name,
      sku: item.sku,
      code: item.code,
      quantity: item.quantity,
      totalMovementValue: item.totalValue,
      movementCount: 0,
      percentageOfTotal,
      cumulativePercentage,
      classification,
      trend: 'stable' as const,
      recommendations: RECOMMENDATIONS[classification],
    }
  })

  const paginated = classified.slice((page - 1) * limit, page * limit)

  // Top 50 for the Pareto chart (full dataset, sent in summary)
  const paretoData = classified.slice(0, 50).map((i) => ({
    itemName: i.itemName,
    totalMovementValue: i.totalMovementValue,
    cumulativePercentage: i.cumulativePercentage,
    classification: i.classification,
  }))

  const summary = {
    totalItems: classified.length,
    classA: classified.filter((i) => i.classification === 'A').length,
    classB: classified.filter((i) => i.classification === 'B').length,
    classC: classified.filter((i) => i.classification === 'C').length,
    totalMovementValue: totalValue,
    paretoData,
  }

  return { data: paginated, summary, page, limit, total: classified.length }
}

export default { getABCAnalysis }
