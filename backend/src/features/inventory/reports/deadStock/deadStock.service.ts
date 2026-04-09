/**
 * Dead Stock Report Service
 */

import prisma from '../../../../services/prisma.service.js'

export async function getDeadStockReport(
  page = 1,
  limit = 50,
  empresaId?: string,
  prismaClient?: any
) {
  const db = prismaClient || prisma
  try {
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    const baseWhere: any = {
      quantityReal: { gt: 0 },
      ...(empresaId ? { warehouse: { empresaId } } : {}),
    }

    // Use last actual movement date per stock entry via a subquery approach:
    // Find stocks that have no movement in the last 6 months (or never had one).
    const stocksWithLastMovement = await db.stock.findMany({
      where: baseWhere,
      include: {
        item: true,
        warehouse: true,
      },
    })

    // For each stock, check last movement date
    const stockItemIds = stocksWithLastMovement.map((s: any) => ({
      itemId: s.itemId,
      warehouseFromId: s.warehouseId,
      warehouseToId: s.warehouseId,
    }))

    // Fetch last movement per (itemId, warehouseId) pair
    const movements = await db.movement.groupBy({
      by: ['itemId'],
      where: {
        itemId: { in: stocksWithLastMovement.map((s: any) => s.itemId) },
        ...(empresaId ? { item: { empresaId } } : {}),
      },
      _max: { movementDate: true },
    })

    const lastMovementByItem: Record<string, Date | null> = {}
    movements.forEach((m: any) => {
      lastMovementByItem[m.itemId] = m._max.movementDate
    })

    const now = new Date()

    const qualifying = stocksWithLastMovement.filter((s: any) => {
      const lastMovement = lastMovementByItem[s.itemId]
      if (!lastMovement) return true // never had a movement
      return lastMovement < sixMonthsAgo
    })

    const total = qualifying.length
    const paginated = qualifying.slice((page - 1) * limit, page * limit)

    const deadStockItems = paginated.map((s: any) => {
      const lastMovement = lastMovementByItem[s.itemId] ?? null
      const daysInactive = lastMovement
        ? Math.floor((now.getTime() - lastMovement.getTime()) / (1000 * 60 * 60 * 24))
        : Math.floor((now.getTime() - s.createdAt.getTime()) / (1000 * 60 * 60 * 24))
      return {
        itemId: s.itemId,
        itemName: s.item.name,
        itemSKU: s.item.sku,
        warehouseId: s.warehouseId,
        warehouseName: s.warehouse.name,
        quantity: s.quantityReal,
        value: s.quantityReal * ((s.item as any).costPrice || 0),
        lastMovement,
        daysInactive,
      }
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
