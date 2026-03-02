/**
 * Stock Value Report Service
 */

import prisma from '../../../../services/prisma.service'


export async function getStockValueReport(page = 1, limit = 50) {
  try {
    const stocks = await prisma.stock.findMany({
      include: { item: true, warehouse: true },
      skip: (page - 1) * limit,
      take: limit,
    })

    const stockValues = stocks
      .map((s) => {
        const unitPrice = (s.item as any).unitPrice || 0
        const totalValue = s.quantityReal * unitPrice
        return {
          itemId: s.itemId,
          itemName: s.item.name,
          itemSKU: s.item.sku,
          warehouseId: s.warehouseId,
          warehouseName: s.warehouse.name,
          quantity: s.quantityReal,
          unitPrice,
          totalValue,
          percentageOfTotal: 0, // Will calculate below
        }
      })
      .sort((a, b) => b.totalValue - a.totalValue)

    const totalInventoryValue = stockValues.reduce(
      (sum, s) => sum + s.totalValue,
      0
    )

    const enrichedValues = stockValues.map((s) => ({
      ...s,
      percentageOfTotal:
        totalInventoryValue > 0
          ? ((s.totalValue / totalInventoryValue) * 100).toFixed(2)
          : '0.00',
    }))

    const total = await prisma.stock.count()

    return {
      data: enrichedValues,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      totalInventoryValue,
    }
  } catch (error) {
    console.error('Error generating stock value report:', error)
    throw error
  }
}

export default { getStockValueReport }
