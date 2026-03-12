/**
 * Dead Stock Report Service
 */

import prisma from '../../../../services/prisma.service.js'

export async function getDeadStockReport(
  page = 1,
  limit = 50,
  prismaClient?: any
) {
  const db = prismaClient || prisma
  try {
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    const stocks = await db.stock.findMany({
      include: { item: true, warehouse: true },
      where: {
        quantityReal: { gt: 0 },
        lastCountDate: { lt: sixMonthsAgo },
      },
      skip: (page - 1) * limit,
      take: limit,
    })

    const deadStockItems = stocks.map((s) => ({
      itemId: s.itemId,
      itemName: s.item.name,
      itemSKU: s.item.sku,
      warehouseId: s.warehouseId,
      warehouseName: s.warehouse.name,
      quantity: s.quantityReal,
      value: s.quantityReal * ((s.item as any).unitPrice || 0),
      lastMovement: s.lastCountDate,
      daysInactive: Math.floor(
        (new Date().getTime() - s.lastCountDate.getTime()) /
          (1000 * 60 * 60 * 24)
      ),
    }))

    const total = await db.stock.count({
      where: {
        quantityReal: { gt: 0 },
        lastCountDate: { lt: sixMonthsAgo },
      },
    })

    return {
      data: deadStockItems,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }
  } catch (error) {
    console.error('Error generating dead stock report:', error)
    throw error
  }
}

export default { getDeadStockReport }
