/**
 * ABC Analysis Service
 * Classifies inventory by value contribution (Pareto principle)
 */

import prisma from '../../../../services/prisma.service.js'

export async function getABCAnalysis(page = 1, limit = 50, prismaClient?: any) {
  const db = prismaClient || prisma
  try {
    const stocks = await db.stock.findMany({
      include: { item: true, warehouse: true },
    })

    // Calculate value for each item
    const itemValues = stocks
      .map((s) => ({
        itemId: s.itemId,
        itemName: s.item.name,
        warehouseId: s.warehouseId,
        quantity: s.quantityReal,
        unitPrice: (s.item as any).unitPrice || 0,
        totalValue: s.quantityReal * ((s.item as any).unitPrice || 0),
      }))
      .sort((a, b) => b.totalValue - a.totalValue)

    const totalValue = itemValues.reduce(
      (sum, item) => sum + item.totalValue,
      0
    )

    // Classify into A, B, C
    let cumulativeValue = 0
    const classified = itemValues.map((item) => {
      cumulativeValue += item.totalValue
      const cumPercent = (cumulativeValue / totalValue) * 100

      let class_: 'A' | 'B' | 'C'
      if (cumPercent <= 80) {
        class_ = 'A'
      } else if (cumPercent <= 95) {
        class_ = 'B'
      } else {
        class_ = 'C'
      }

      return {
        ...item,
        class: class_,
        valuePercent: ((item.totalValue / totalValue) * 100).toFixed(2),
      }
    })

    const paginated = classified.slice((page - 1) * limit, page * limit)

    const summary = {
      classA: classified.filter((i) => i.class === 'A').length,
      classB: classified.filter((i) => i.class === 'B').length,
      classC: classified.filter((i) => i.class === 'C').length,
      totalValue,
    }

    return {
      data: paginated,
      summary,
      page,
      limit,
      total: classified.length,
    }
  } catch (error) {
    console.error('Error calculating ABC analysis:', error)
    throw error
  }
}

export default { getABCAnalysis }
