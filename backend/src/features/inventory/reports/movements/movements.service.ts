/**
 * Movements Report Service
 * Handles database queries and aggregations for inventory movement reports
 */

import prisma from '../../../../services/prisma.service.js'

interface MovementsFilter {
  page?: number
  limit?: number
  dateFrom?: Date | string
  dateTo?: Date | string
  warehouseId?: string
  itemId?: string
  type?: string
  empresaId?: string
}

export async function getMovementsReport(
  filters: MovementsFilter = {},
  prismaClient?: any
) {
  const db = prismaClient || prisma
  try {
    const page = filters.page || 1
    const limit = filters.limit || 50
    const skip = (page - 1) * limit

    // Build where clause dynamically
    const where: any = {}

    if (filters.empresaId) {
      where.item = { empresaId: filters.empresaId }
    }

    // Date range filter
    if (filters.dateFrom || filters.dateTo) {
      where.movementDate = {}
      if (filters.dateFrom) {
        const fromDate =
          typeof filters.dateFrom === 'string'
            ? new Date(filters.dateFrom)
            : filters.dateFrom
        where.movementDate.gte = fromDate
      }
      if (filters.dateTo) {
        const toDate =
          typeof filters.dateTo === 'string'
            ? new Date(filters.dateTo)
            : filters.dateTo
        // Add 1 day to include entire end date
        toDate.setDate(toDate.getDate() + 1)
        where.movementDate.lt = toDate
      }
    }

    // Warehouse filter (can be from or to warehouse)
    if (filters.warehouseId) {
      where.OR = [
        { warehouseFromId: filters.warehouseId },
        { warehouseToId: filters.warehouseId },
      ]
    }

    // Item filter
    if (filters.itemId) {
      where.itemId = filters.itemId
    }

    // Type filter (ENTRADA, SALIDA, etc.)
    if (filters.type) {
      where.type = filters.type
    }

    // Fetch paginated movements with relations
    const movements = await db.movement.findMany({
      where,
      include: {
        item: {
          select: {
            id: true,
            name: true,
            sku: true,
            costPrice: true,
          },
        },
        warehouseFrom: {
          select: {
            id: true,
            name: true,
          },
        },
        warehouseTo: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        movementDate: 'desc',
      },
      skip,
      take: limit,
    })

    // Count total for pagination
    const total = await db.movement.count({ where })

    // Map to API response format
    const data = movements.map((m: any) => ({
      id: m.id,
      movementNumber: m.movementNumber,
      movementDate: m.movementDate,
      type: m.type,
      itemId: m.itemId,
      itemName: m.item.name,
      itemSKU: m.item.sku,
      quantity: m.quantity,
      unitCost: m.unitCost,
      totalCost: m.totalCost,
      warehouseFromId: m.warehouseFromId,
      warehouseFromName: m.warehouseFrom?.name || 'N/A',
      warehouseToId: m.warehouseToId,
      warehouseToName: m.warehouseTo?.name || 'N/A',
      reference: m.reference || '',
      notes: m.notes || '',
    }))

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }
  } catch (error) {
    console.error('Error generating movements report:', error)
    throw error
  }
}

interface MovementsSummary {
  totalMovements: number
  byType: Record<string, number>
  byWarehouse: Record<string, number>
  totalQuantityMoved: number
  totalCostValue: number
}

export async function getMovementsSummary(
  dateFrom?: Date | string,
  dateTo?: Date | string,
  empresaId?: string,
  prismaClient?: any
): Promise<MovementsSummary> {
  const db = prismaClient || prisma
  try {
    const where: any = {}

    if (empresaId) {
      where.item = { empresaId }
    }

    // Build date range filter
    if (dateFrom || dateTo) {
      where.movementDate = {}
      if (dateFrom) {
        const fromDate =
          typeof dateFrom === 'string' ? new Date(dateFrom) : dateFrom
        where.movementDate.gte = fromDate
      }
      if (dateTo) {
        const toDate = typeof dateTo === 'string' ? new Date(dateTo) : dateTo
        toDate.setDate(toDate.getDate() + 1)
        where.movementDate.lt = toDate
      }
    }

    // Total movements count
    const totalMovements = await db.movement.count({ where })

    // Movements by type
    const movementsByType = await db.movement.groupBy({
      by: ['type'],
      where,
      _count: {
        id: true,
      },
    })

    const byType: Record<string, number> = {}
    movementsByType.forEach((group: any) => {
      byType[group.type] = group._count.id
    })

    // Movements by warehouse (combining from/to)
    const movementsFromWarehouse = await db.movement.groupBy({
      by: ['warehouseFromId'],
      where: {
        ...where,
        warehouseFromId: { not: null },
      },
      _count: {
        id: true,
      },
    })

    const movementsToWarehouse = await db.movement.groupBy({
      by: ['warehouseToId'],
      where: {
        ...where,
        warehouseToId: { not: null },
      },
      _count: {
        id: true,
      },
    })

    const byWarehouse: Record<string, number> = {}

    // Add from warehouse counts
    for (const group of movementsFromWarehouse) {
      const warehouseId = group.warehouseFromId
      if (warehouseId) {
        byWarehouse[warehouseId] =
          (byWarehouse[warehouseId] || 0) + group._count.id
      }
    }

    // Add to warehouse counts
    for (const group of movementsToWarehouse) {
      const warehouseId = group.warehouseToId
      if (warehouseId) {
        byWarehouse[warehouseId] =
          (byWarehouse[warehouseId] || 0) + group._count.id
      }
    }

    // Get warehouse names for response
    const warehouseIds = Object.keys(byWarehouse).filter((id) => id !== 'null')
    const warehouses = await db.warehouse.findMany({
      where: { id: { in: warehouseIds } },
      select: { id: true, name: true },
    })

    const warehouseMap: Record<string, string> = {}
    warehouses.forEach((w: any) => {
      warehouseMap[w.id] = w.name
    })

    const byWarehouseNamed: Record<string, number> = {}
    Object.entries(byWarehouse).forEach(([id, count]) => {
      const name = warehouseMap[id] || id
      byWarehouseNamed[name] = count
    })

    // Total quantity and cost
    const totals = await db.movement.aggregate({
      where,
      _sum: {
        quantity: true,
        totalCost: true,
      },
    })

    return {
      totalMovements,
      byType,
      byWarehouse: byWarehouseNamed,
      totalQuantityMoved: totals._sum.quantity || 0,
      totalCostValue: parseFloat(String(totals._sum.totalCost || 0)),
    }
  } catch (error) {
    console.error('Error generating movements summary:', error)
    throw error
  }
}

export default { getMovementsReport, getMovementsSummary }
