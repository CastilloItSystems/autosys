/**
 * Turnover Service - Inventory Turnover Analysis
 */

import { prisma } from '../../../../config/database.js'
import { NotFoundError } from '../../../../shared/utils/errors.js'

interface TurnoverMetrics {
  itemId: string
  itemSku: string
  itemName: string
  turnoverRatio: number
  daysInventoryOutstanding: number
  turnoverFrequency: number
  monthlyTurnoverRate: number
  quarterlyTurnoverRate: number
  annualTurnoverRate: number
  averageStockValue: number
  cogs30Days: number
  cogs90Days: number
  cogs365Days: number
  healthScore: number
  classification: 'FAST_MOVING' | 'MODERATE' | 'SLOW_MOVING' | 'STATIC'
  trend: 'IMPROVING' | 'DECLINING' | 'STABLE'
  recommendation: string
}

class TurnoverService {
  private static instance: TurnoverService

  public static getInstance(): TurnoverService {
    if (!TurnoverService.instance) {
      TurnoverService.instance = new TurnoverService()
    }
    return TurnoverService.instance
  }

  /**
   * Get turnover metrics for a specific item
   */
  async getTurnoverMetricsForItem(
    itemId: string,
    period: number = 365
  ): Promise<TurnoverMetrics> {
    const item = await prisma.item.findUnique({
      where: { id: itemId },
      include: {
        stocks: {
          include: { warehouse: true },
        },
      },
    })

    if (!item) throw new NotFoundError('Item not found')

    // Get movement data
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - period)

    const movements = await prisma.movement.findMany({
      where: {
        itemId,
        createdAt: { gte: startDate },
      },
      orderBy: { createdAt: 'asc' },
    })

    // Calculate COGS (Cost of Goods Sold) - approximated by outgoing movements
    const outgoingMovements = movements.filter((m) =>
      ['SALE', 'TRANSFER_OUT', 'WRITE_OFF'].includes(m.type)
    )
    const totalOutgoing = outgoingMovements.reduce(
      (sum, m) => sum + m.quantity,
      0
    )

    // Calculate period-specific COGS
    const cogs365Days = totalOutgoing

    const cogs90DaysDate = new Date()
    cogs90DaysDate.setDate(cogs90DaysDate.getDate() - 90)
    const outgoing90Days = outgoingMovements.filter(
      (m) => m.createdAt >= cogs90DaysDate
    )
    const cogs90Days = outgoing90Days.reduce((sum, m) => sum + m.quantity, 0)

    const cogs30DaysDate = new Date()
    cogs30DaysDate.setDate(cogs30DaysDate.getDate() - 30)
    const outgoing30Days = outgoingMovements.filter(
      (m) => m.createdAt >= cogs30DaysDate
    )
    const cogs30Days = outgoing30Days.reduce((sum, m) => sum + m.quantity, 0)

    // Calculate average stock
    const currentStock = item.stocks.reduce((sum, s) => sum + s.quantityReal, 0)
    const averageStock = this.calculateAverageStock(movements, currentStock)
    const averageStockValue = averageStock * (Number(item.costPrice) || 0)

    // Calculate turnover ratio = COGS / Average Inventory
    const turnoverRatio = averageStock > 0 ? cogs365Days / averageStock : 0

    // Calculate Days Inventory Outstanding (DIO) = 365 / Turnover Ratio
    const daysInventoryOutstanding =
      turnoverRatio > 0 ? Math.round((365 / turnoverRatio) * 10) / 10 : 365

    // Calculate monthly and quarterly rates
    const monthlyTurnoverRate = turnoverRatio / 12
    const quarterlyTurnoverRate = turnoverRatio / 4
    const annualTurnoverRate = turnoverRatio

    // Turnover frequency = number of months until current stock runs out
    const turnoverFrequency =
      monthlyTurnoverRate > 0 ? 1 / monthlyTurnoverRate : Infinity

    // Calculate health score (0-100)
    const healthScore = this.calculateHealthScore(
      turnoverRatio,
      daysInventoryOutstanding
    )

    // Classify item
    const classification = this.classifyTurnover(turnoverRatio)

    // Calculate trend
    const trend = this.calculateTrend(movements)

    // Generate recommendation
    const recommendation = this.generateRecommendation(
      classification,
      trend,
      currentStock,
      cogs30Days
    )

    return {
      itemId,
      itemSku: item.sku,
      itemName: item.name,
      turnoverRatio: Math.round(turnoverRatio * 100) / 100,
      daysInventoryOutstanding: Math.round(daysInventoryOutstanding * 10) / 10,
      turnoverFrequency: Math.round(turnoverFrequency * 10) / 10,
      monthlyTurnoverRate: Math.round(monthlyTurnoverRate * 100) / 100,
      quarterlyTurnoverRate: Math.round(quarterlyTurnoverRate * 100) / 100,
      annualTurnoverRate: Math.round(annualTurnoverRate * 100) / 100,
      averageStockValue: Math.round(averageStockValue * 100) / 100,
      cogs30Days,
      cogs90Days,
      cogs365Days,
      healthScore,
      classification,
      trend,
      recommendation,
    }
  }

  /**
   * Calculate average stock from movements
   */
  private calculateAverageStock(
    movements: any[],
    currentStock: number
  ): number {
    if (movements.length === 0) return currentStock

    // Group movements by date and calculate running balance
    const dailyBalances: { [key: string]: number } = {}
    let runningBalance = 0

    // Get starting balance
    const firstMovementDate = movements[0]?.createdAt || new Date()
    const today = new Date()
    const daysDiff = Math.floor(
      (today.getTime() - firstMovementDate.getTime()) / (1000 * 60 * 60 * 24)
    )

    movements.forEach((movement) => {
      const dateKey = movement.createdAt.toISOString().split('T')[0]
      if (movement.type.includes('IN') || movement.type === 'PURCHASE_IN') {
        runningBalance += movement.quantity
      } else {
        runningBalance -= movement.quantity
      }
      dailyBalances[dateKey] = Math.max(0, runningBalance)
    })

    // Calculate average
    const balances = Object.values(dailyBalances)
    if (balances.length === 0) return currentStock

    const sum = balances.reduce((a, b) => a + b, 0)
    return sum / balances.length
  }

  /**
   * Calculate health score based on turnover metrics
   */
  private calculateHealthScore(
    turnoverRatio: number,
    daysInventoryOutstanding: number
  ): number {
    // Ideal turnover ratio is between 2-6 (turns 2-6 times per year)
    // Ideal DIO is between 60-180 days

    let score = 50 // Base score

    // Adjust for turnover ratio (closer to 4 is better)
    if (turnoverRatio >= 2 && turnoverRatio <= 6) {
      score += 30 // Good turnover
    } else if (turnoverRatio >= 1 && turnoverRatio < 2) {
      score += 15
    } else if (turnoverRatio > 6 && turnoverRatio <= 10) {
      score += 15
    }

    // Adjust for DIO (closer to 120 is better)
    if (daysInventoryOutstanding >= 60 && daysInventoryOutstanding <= 180) {
      score += 20
    } else if (
      daysInventoryOutstanding >= 30 &&
      daysInventoryOutstanding < 60
    ) {
      score += 10
    } else if (
      daysInventoryOutstanding > 180 &&
      daysInventoryOutstanding <= 360
    ) {
      score += 10
    }

    return Math.min(100, Math.max(0, score))
  }

  /**
   * Classify turnover
   */
  private classifyTurnover(
    turnoverRatio: number
  ): 'FAST_MOVING' | 'MODERATE' | 'SLOW_MOVING' | 'STATIC' {
    if (turnoverRatio > 6) return 'FAST_MOVING'
    if (turnoverRatio > 2) return 'MODERATE'
    if (turnoverRatio > 0) return 'SLOW_MOVING'
    return 'STATIC'
  }

  /**
   * Calculate trend
   */
  private calculateTrend(
    movements: any[]
  ): 'IMPROVING' | 'DECLINING' | 'STABLE' {
    if (movements.length < 60) return 'STABLE'

    const midpoint = Math.floor(movements.length / 2)
    const firstHalf = movements.slice(0, midpoint)
    const secondHalf = movements.slice(midpoint)

    const firstHalfOutgoing = firstHalf.filter((m) =>
      ['SALE', 'TRANSFER_OUT', 'WRITE_OFF'].includes(m.type)
    ).length
    const secondHalfOutgoing = secondHalf.filter((m) =>
      ['SALE', 'TRANSFER_OUT', 'WRITE_OFF'].includes(m.type)
    ).length

    if (secondHalfOutgoing > firstHalfOutgoing * 1.1) return 'IMPROVING'
    if (secondHalfOutgoing < firstHalfOutgoing * 0.9) return 'DECLINING'
    return 'STABLE'
  }

  /**
   * Generate recommendation
   */
  private generateRecommendation(
    classification: string,
    trend: string,
    currentStock: number,
    cogs30Days: number
  ): string {
    if (classification === 'FAST_MOVING') {
      return 'Maintain high stock levels and increase purchase frequency to prevent stockouts.'
    }
    if (classification === 'STATIC') {
      return 'Consider discontinuing or liquidating this item due to no movement.'
    }
    if (classification === 'SLOW_MOVING' && trend === 'DECLINING') {
      return 'Reduce stock levels and consider promotional activities to increase sales.'
    }
    if (classification === 'MODERATE' && currentStock > cogs30Days * 3) {
      return 'Current stock exceeds 3 months of demand. Consider reducing purchase orders.'
    }
    return 'Monitor inventory levels and adjust orders based on seasonal trends.'
  }

  /**
   * Get turnover metrics for all items (paginated)
   */
  async getAllTurnoverMetrics(
    page: number = 1,
    limit: number = 50
  ): Promise<{ data: TurnoverMetrics[]; total: number; summary: any }> {
    const skip = (page - 1) * limit

    const items = await prisma.item.findMany({
      where: { isActive: true },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    })

    const metrics = await Promise.all(
      items.map((item) => this.getTurnoverMetricsForItem(item.id))
    )

    const total = await prisma.item.count({ where: { isActive: true } })

    const summary = {
      averageTurnover: metrics.length > 0
        ? metrics.reduce((sum, m) => sum + m.turnoverRatio, 0) / metrics.length
        : 0,
      fastMovingCount: metrics.filter((m) => m.classification === 'FAST_MOVING').length,
      moderateCount: metrics.filter((m) => m.classification === 'MODERATE').length,
      slowMovingCount: metrics.filter((m) => m.classification === 'SLOW_MOVING').length,
      staticCount: metrics.filter((m) => m.classification === 'STATIC').length,
      totalItems: total,
    }

    return { data: metrics, total, summary }
  }

  /**
   * Get items by classification
   */
  async getItemsByClassification(
    classification: 'FAST_MOVING' | 'MODERATE' | 'SLOW_MOVING' | 'STATIC',
    page: number = 1,
    limit: number = 50
  ): Promise<{ data: TurnoverMetrics[]; total: number; summary: any }> {
    const skip = (page - 1) * limit

    const items = await prisma.item.findMany({
      where: { isActive: true },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    })

    const metrics = await Promise.all(
      items.map((item) => this.getTurnoverMetricsForItem(item.id))
    )

    const filtered = metrics.filter((m) => m.classification === classification)
    const total = metrics.length

    const summary = {
      averageTurnover: filtered.length > 0
        ? filtered.reduce((sum, m) => sum + m.turnoverRatio, 0) / filtered.length
        : 0,
      fastMovingCount: metrics.filter((m) => m.classification === 'FAST_MOVING').length,
      moderateCount: metrics.filter((m) => m.classification === 'MODERATE').length,
      slowMovingCount: metrics.filter((m) => m.classification === 'SLOW_MOVING').length,
      staticCount: metrics.filter((m) => m.classification === 'STATIC').length,
      totalItems: total,
    }

    return { data: filtered, total, summary }
  }
}

export const getTurnoverMetricsForItem = (itemId: string) =>
  TurnoverService.getInstance().getTurnoverMetricsForItem(itemId)

export const getAllTurnoverMetrics = (page?: number, limit?: number) =>
  TurnoverService.getInstance().getAllTurnoverMetrics(page, limit)

export const getItemsByClassification = (
  classification: 'FAST_MOVING' | 'MODERATE' | 'SLOW_MOVING' | 'STATIC',
  page?: number,
  limit?: number
) =>
  TurnoverService.getInstance().getItemsByClassification(
    classification,
    page,
    limit
  )

export default TurnoverService
