/**
 * Low Stock Report Service
 */

import prisma from '../../../../services/prisma.service'

export async function getLowStockReport(page = 1, limit = 50, prismaClient?: any) {
  const db = prismaClient || prisma
  try {
    const stocks = await db.stock.findMany({
      include: { item: true, warehouse: true },
      skip: (page - 1) * limit,
      take: limit,
    })

    const lowStockItems = stocks
      .filter(
        (s: any) => s.quantityAvailable <= ((s.item as any).minStock || 10)
      )
      .map((s: any) => ({
        itemId: s.itemId,
        itemName: s.item.name,
        itemSKU: s.item.sku,
        warehouseId: s.warehouseId,
        warehouseName: s.warehouse.name,
        currentStock: s.quantityAvailable,
        minimumStock: (s.item as any).minStock || 10,
        shortage: Math.max(
          0,
          ((s.item as any).minStock || 10) - s.quantityAvailable
        ),
        lastMovement: s.updatedAt,
      }))

    const total = await db.stock.count({
      where: {
        quantityAvailable: {
          lte: 10, // Assume conservative default
        },
      },
    })

    return {
      data: lowStockItems,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }
  } catch (error) {
    console.error('Error generating low stock report:', error)
    throw error
  }
}

export default { getLowStockReport }
