/**
 * Dashboard Report Service
 * Generates comprehensive inventory dashboard metrics and KPIs
 */

import prisma from '../../../../services/prisma.service'


export interface DashboardMetrics {
  totalItems: number
  totalWarehouses: number
  totalStockValue: number
  stockHealth: {
    inStock: number
    lowStock: number
    outOfStock: number
  }
  movements: {
    today: number
    thisWeek: number
    thisMonth: number
  }
  alerts: {
    critical: number
    warning: number
    info: number
  }
  topMovingItems: Array<{
    itemId: string
    itemName: string
    movementCount: number
    lastMovement: Date
  }>
  topWarehouses: Array<{
    warehouseId: string
    warehouseName: string
    itemCount: number
    totalValue: number
  }>
  recentActivities: Array<{
    type: string
    description: string
    timestamp: Date
  }>
}

/**
 * Get dashboard metrics
 */
export async function getDashboardMetrics(prismaClient?: any): Promise<DashboardMetrics> {
  const db = prismaClient || prisma
  try {
    const [items, warehouses, stocks, movements] = await Promise.all([
      db.item.findMany(),
      db.warehouse.findMany(),
      db.stock.findMany({ include: { item: true } }),
      db.movement.findMany({
        orderBy: { createdAt: 'desc' },
        take: 1000,
      }),
    ])

    // Calculate stock health
    const stockHealth = {
      inStock: 0,
      lowStock: 0,
      outOfStock: 0,
    }

    let totalStockValue = 0

    stocks.forEach((stock) => {
      if (stock.quantityReal === 0) {
        stockHealth.outOfStock++
      } else if (
        stock.quantityAvailable <= ((stock.item as any).minStock || 10)
      ) {
        stockHealth.lowStock++
      } else {
        stockHealth.inStock++
      }

      totalStockValue +=
        stock.quantityReal * ((stock.item as any).unitPrice || 0)
    })

    // Calculate movements by period
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)

    const movementsToday = movements.filter(
      (m) => new Date(m.createdAt) >= today
    ).length
    const movementsThisWeek = movements.filter(
      (m) => new Date(m.createdAt) >= weekAgo
    ).length
    const movementsThisMonth = movements.filter(
      (m) => new Date(m.createdAt) >= monthAgo
    ).length

    // Top moving items
    const itemMovementCount: Record<
      string,
      { count: number; lastDate: Date; item: any }
    > = {}
    movements.forEach((m) => {
      if (!itemMovementCount[m.itemId]) {
        const item = items.find((i) => i.id === m.itemId)
        itemMovementCount[m.itemId] = { count: 0, lastDate: new Date(0), item }
      }
      itemMovementCount[m.itemId].count++
      if (new Date(m.createdAt) > itemMovementCount[m.itemId].lastDate) {
        itemMovementCount[m.itemId].lastDate = new Date(m.createdAt)
      }
    })

    const topMovingItems = Object.entries(itemMovementCount)
      .sort(([, a], [, b]) => b.count - a.count)
      .slice(0, 10)
      .map(([itemId, data]) => ({
        itemId,
        itemName: data.item?.name || 'Unknown',
        movementCount: data.count,
        lastMovement: data.lastDate,
      }))

    // Top warehouses by stock value
    const warehouseValues: Record<
      string,
      { value: number; warehouse: any; itemCount: number }
    > = {}
    stocks.forEach((stock) => {
      if (!warehouseValues[stock.warehouseId]) {
        const warehouse = warehouses.find((w) => w.id === stock.warehouseId)
        warehouseValues[stock.warehouseId] = {
          value: 0,
          warehouse,
          itemCount: 0,
        }
      }
      warehouseValues[stock.warehouseId].value +=
        stock.quantityReal * ((stock.item as any).unitPrice || 0)
      if (stock.quantityReal > 0) {
        warehouseValues[stock.warehouseId].itemCount++
      }
    })

    const topWarehouses = Object.entries(warehouseValues)
      .sort(([, a], [, b]) => b.value - a.value)
      .slice(0, 10)
      .map(([warehouseId, data]) => ({
        warehouseId,
        warehouseName: data.warehouse?.name || 'Unknown',
        itemCount: data.itemCount,
        totalValue: data.value,
      }))

    // Recent activities
    const recentActivities = movements.slice(0, 20).map((m) => ({
      type: m.movementType,
      description: `${m.movementType}: Reference ${m.reference}`,
      timestamp: new Date(m.createdAt),
    }))

    return {
      totalItems: items.length,
      totalWarehouses: warehouses.length,
      totalStockValue,
      stockHealth,
      movements: {
        today: movementsToday,
        thisWeek: movementsThisWeek,
        thisMonth: movementsThisMonth,
      },
      alerts: {
        critical: stockHealth.outOfStock,
        warning: stockHealth.lowStock,
        info: 0,
      },
      topMovingItems,
      topWarehouses,
      recentActivities,
    }
  } catch (error) {
    console.error('Error calculating dashboard metrics:', error)
    throw error
  }
}

export default {
  getDashboardMetrics,
}
