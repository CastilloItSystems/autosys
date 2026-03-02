/**
 * Update Stock Levels Job
 * Recalculates optimal stock levels and reorder points based on demand patterns
 */

import prisma from '../../../../services/prisma.service'
import { EventService } from '../../../shared/events/event.service'
import { EventType } from '../../../shared/types/event.types'

const eventService = EventService.getInstance()

export interface StockLevel {
  itemId: string
  itemName: string
  warehouseId: string
  currentLevel: number
  reorderPoint: number
  reorderQuantity: number
  minStock: number
  maxStock: number
  optimalLevel: number
  recommendation: 'ORDER' | 'REVIEW' | 'HOLD' | 'REDUCE'
}

/**
 * Calculate stock levels based on demand history
 */
export async function updateStockLevels(): Promise<StockLevel[]> {
  const levels: StockLevel[] = []

  try {
    const items = await prisma.item.findMany()
    const warehouses = await prisma.warehouse.findMany()

    for (const item of items) {
      for (const warehouse of warehouses) {
        const stock = await prisma.stock.findUnique({
          where: {
            itemId_warehouseId: {
              itemId: item.id,
              warehouseId: warehouse.id,
            },
          },
        })

        if (!stock) continue

        // Get last 90 days of movement data
        const ninetyDaysAgo = new Date()
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

        const movements = await prisma.movement.findMany({
          where: {
            itemId: item.id,
            warehouseId: warehouse.id,
            createdAt: { gte: ninetyDaysAgo },
            movementType: {
              in: ['SALE', 'EXIT_NOTE', 'TRANSFER_OUT'],
            },
          },
        })

        // Calculate average daily consumption
        const totalOut = movements.reduce((sum, m) => sum + m.quantity, 0)
        const daysInPeriod = 90
        const averageDailyConsumption = totalOut / daysInPeriod

        // Lead time assumption (days)
        const leadTime = (item as any).leadTime || 7

        // Recent variance (for safety stock calculation)
        const dailyConsumptions = movements.reduce(
          (acc, m) => {
            const day = Math.floor(
              (new Date().getTime() - m.createdAt.getTime()) /
                (1000 * 60 * 60 * 24)
            )
            acc[day] = (acc[day] || 0) + m.quantity
            return acc
          },
          {} as Record<number, number>
        )

        const values = Object.values(dailyConsumptions)
        const variance =
          values.length > 1
            ? Math.sqrt(
                values.reduce(
                  (sum, v) => sum + Math.pow(v - averageDailyConsumption, 2),
                  0
                ) / values.length
              )
            : 0

        // Calculate optimal levels
        // Reorder point = (average consumption × lead time) + safety stock
        const safetyStock = 2 * variance // 2σ safety margin
        const reorderPoint = averageDailyConsumption * leadTime + safetyStock

        // Reorder quantity - enough for 14 days of demand
        const reorderQuantity = Math.ceil(averageDailyConsumption * 14)

        // Min/Max levels
        const minStock = Math.max(reorderPoint, (item as any).minStock || 10)
        const maxStock = Math.max(
          reorderPoint + reorderQuantity,
          (item as any).maxStock || 1000
        )

        // Optimal level (average between min and max)
        const optimalLevel = Math.ceil((minStock + maxStock) / 2)

        // Recommendation
        let recommendation: 'ORDER' | 'REVIEW' | 'HOLD' | 'REDUCE' = 'HOLD'
        if (stock.quantityAvailable <= reorderPoint) {
          recommendation = 'ORDER'
        } else if (stock.quantityReal > maxStock) {
          recommendation = 'REDUCE'
        } else if (
          Math.abs(stock.quantityReal - optimalLevel) >
          optimalLevel * 0.2
        ) {
          recommendation = 'REVIEW'
        }

        levels.push({
          itemId: item.id,
          itemName: item.name,
          warehouseId: warehouse.id,
          currentLevel: stock.quantityReal,
          reorderPoint: Math.ceil(reorderPoint),
          reorderQuantity,
          minStock,
          maxStock,
          optimalLevel,
          recommendation,
        })

        // Update item with new min/max if significantly different
        if (Math.abs(reorderPoint - ((item as any).minStock || 10)) > 5) {
          await prisma.item.update({
            where: { id: item.id },
            data: {
              minStock: Math.ceil(reorderPoint),
              maxStock: Math.ceil(maxStock),
            },
          })
        }
      }
    }

    // Emit event with updates
    const ordersNeeded = levels.filter((l) => l.recommendation === 'ORDER')
    const reviewsNeeded = levels.filter((l) => l.recommendation === 'REVIEW')
    const reductionsNeeded = levels.filter((l) => l.recommendation === 'REDUCE')

    if (ordersNeeded.length > 0 || reviewsNeeded.length > 0) {
      eventService.emit(EventType.STOCK_LEVELS_UPDATED, {
        updatedCount: levels.length,
        ordersNeeded: ordersNeeded.length,
        reviewsNeeded: reviewsNeeded.length,
        reductionsNeeded: reductionsNeeded.length,
        timestamp: new Date(),
      })
    }

    return levels
  } catch (error) {
    console.error('Error updating stock levels:', error)
    throw error
  }
}

/**
 * Calculate reorder suggestions
 */
export async function getReorderSuggestions(): Promise<
  Array<{
    itemId: string
    itemName: string
    supplier: string
    quantityToOrder: number
    estimateCost: number
    priority: 'URGENT' | 'NORMAL' | 'SCHEDULED'
  }>
> {
  const suggestions: Array<{
    itemId: string
    itemName: string
    supplier: string
    quantityToOrder: number
    estimateCost: number
    priority: 'URGENT' | 'NORMAL' | 'SCHEDULED'
  }> = []

  try {
    const levels = await updateStockLevels()

    for (const level of levels) {
      if (level.recommendation === 'ORDER') {
        const item = await prisma.item.findUnique({
          where: { id: level.itemId },
          include: {
            itemSuppliers: {
              orderBy: { priority: 'asc' },
              take: 1,
            },
          },
        })

        if (item && item.itemSuppliers && item.itemSuppliers.length > 0) {
          const supplier = item.itemSuppliers[0]
          const priority =
            level.currentLevel <= level.reorderPoint / 2 ? 'URGENT' : 'NORMAL'

          suggestions.push({
            itemId: level.itemId,
            itemName: level.itemName,
            supplier: supplier.name,
            quantityToOrder: level.reorderQuantity,
            estimateCost:
              level.reorderQuantity * ((supplier as any).unitPrice || 0),
            priority,
          })
        }
      }
    }

    return suggestions
  } catch (error) {
    console.error('Error calculating reorder suggestions:', error)
    return []
  }
}

/**
 * Job processor for queue system
 */
export async function processUpdateStockLevelsJob(data?: any): Promise<any> {
  console.log('📊 Processing update stock levels job...')

  try {
    const [levels, suggestions] = await Promise.all([
      updateStockLevels(),
      getReorderSuggestions(),
    ])

    const summary = {
      levelsUpdated: levels.length,
      recommendations: {
        order: levels.filter((l) => l.recommendation === 'ORDER').length,
        review: levels.filter((l) => l.recommendation === 'REVIEW').length,
        reduce: levels.filter((l) => l.recommendation === 'REDUCE').length,
      },
      reorderSuggestions: suggestions.length,
      urgentOrders: suggestions.filter((s) => s.priority === 'URGENT').length,
      estimatedOrderValue: suggestions.reduce(
        (sum, s) => sum + s.estimateCost,
        0
      ),
      suggestions,
      timestamp: new Date(),
    }

    console.log('✅ Stock levels updated:', summary)

    return summary
  } catch (error) {
    console.error('❌ Stock level update failed:', error)
    throw error
  }
}

export default {
  updateStockLevels,
  getReorderSuggestions,
  processUpdateStockLevelsJob,
}
