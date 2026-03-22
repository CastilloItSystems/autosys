/**
 * Low Stock Report Service
 */

import prisma from '../../../../services/prisma.service.js'

export async function getLowStockReport(
  page = 1,
  limit = 50,
  empresaId?: string,
  prismaClient?: any
) {
  const db = prismaClient || prisma
  try {
    // Fetch all matching stocks where quantityAvailable <= item.minStock
    // We need the item relation to compare, so we fetch with include and filter in app layer.
    // To keep pagination accurate we first get all IDs that qualify, then paginate.
    const allStocks = await db.stock.findMany({
      where: empresaId ? { warehouse: { empresaId } } : undefined,
      include: { item: true, warehouse: true },
    })

    const qualifying = allStocks.filter(
      (s: any) => s.quantityAvailable <= ((s.item as any).minStock ?? 10)
    )

    const total = qualifying.length
    const paginated = qualifying.slice((page - 1) * limit, page * limit)

    const lowStockItems = paginated.map((s: any) => ({
      itemId: s.itemId,
      itemName: s.item.name,
      itemSKU: s.item.sku,
      warehouseId: s.warehouseId,
      warehouseName: s.warehouse.name,
      currentStock: s.quantityAvailable,
      minimumStock: (s.item as any).minStock ?? 10,
      shortage: Math.max(0, ((s.item as any).minStock ?? 10) - s.quantityAvailable),
      lastMovement: s.updatedAt,
    }))

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
