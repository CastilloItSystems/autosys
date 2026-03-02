/**
 * Forecasting Service - Demand Forecasting using Time Series Analysis
 */

import { prisma } from '../../../../config/database'
import {
  EventService,
  EventType,
} from '../../../../shared/services/event.service'
import { BadRequestError, NotFoundError } from '../../../../shared/utils/errors'

interface ForecastData {
  date: string
  quantity: number
  confidence: number
}

interface ForecastResult {
  itemId: string
  itemSku: string
  itemName: string
  currentStock: number
  historicalAverageDailyDemand: number
  forecastedDemand30Days: number
  forecastedDemand60Days: number
  forecastedDemand90Days: number
  forecastVariance: number
  confidenceLevel: number
  trend: 'INCREASING' | 'DECREASING' | 'STABLE'
  recommended30DaysStock: number
  stockoutRisk: number
  recommendedAction: 'INCREASE_STOCK' | 'MAINTAIN' | 'REDUCE_STOCK' | 'MONITOR'
  forecastData: ForecastData[]
}

class ForecastingService {
  private static instance: ForecastingService

  public static getInstance(): ForecastingService {
    if (!ForecastingService.instance) {
      ForecastingService.instance = new ForecastingService()
    }
    return ForecastingService.instance
  }

  /**
   * Calculate moving average for demand forecasting
   */
  private calculateMovingAverage(values: number[], period: number): number[] {
    const result: number[] = []
    for (let i = 0; i < values.length; i++) {
      if (i < period - 1) {
        result.push(0)
      } else {
        const sum = values
          .slice(i - period + 1, i + 1)
          .reduce((a, b) => a + b, 0)
        result.push(sum / period)
      }
    }
    return result
  }

  /**
   * Calculate exponential smoothing for forecasting
   */
  private exponentialSmoothing(
    values: number[],
    alpha: number = 0.3
  ): number[] {
    if (values.length === 0) return []
    const result: number[] = [values[0]]
    for (let i = 1; i < values.length; i++) {
      result.push(alpha * values[i] + (1 - alpha) * result[i - 1])
    }
    return result
  }

  /**
   * Calculate trend direction
   */
  private calculateTrend(
    historicalDemand: number,
    forecast30Days: number
  ): 'INCREASING' | 'DECREASING' | 'STABLE' {
    const percentChange =
      ((forecast30Days - historicalDemand) / historicalDemand) * 100
    if (percentChange > 5) return 'INCREASING'
    if (percentChange < -5) return 'DECREASING'
    return 'STABLE'
  }

  /**
   * Get demand forecast for an item
   */
  async getDemandForecastForItem(itemId: string): Promise<ForecastResult> {
    const item = await prisma.item.findUnique({
      where: { id: itemId },
      include: {
        stock: {
          include: { warehouse: true },
        },
      },
    })

    if (!item) throw new NotFoundError('Item not found')

    // Get last 90 days of movement data
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - 90)

    const movements = await prisma.movement.findMany({
      where: {
        itemId,
        createdAt: { gte: startDate },
        type: { in: ['SALE', 'TRANSFER_OUT'] },
      },
      orderBy: { createdAt: 'asc' },
    })

    // Calculate daily demand
    const dailyDemand: { [key: string]: number } = {}
    movements.forEach((mov) => {
      const dateKey = mov.createdAt.toISOString().split('T')[0]
      dailyDemand[dateKey] = (dailyDemand[dateKey] || 0) + mov.quantity
    })

    // Get last 90 days including zero-demand days
    const demandValues: number[] = []
    for (let i = 0; i < 90; i++) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateKey = date.toISOString().split('T')[0]
      demandValues.unshift(dailyDemand[dateKey] || 0)
    }

    // Calculate historical average daily demand
    const totalDemand = demandValues.reduce((a, b) => a + b, 0)
    const historicalAverageDailyDemand = totalDemand / 90

    // Apply exponential smoothing for forecasting
    const smoothedValues = this.exponentialSmoothing(demandValues)
    const lastSmoothedValue =
      smoothedValues[smoothedValues.length - 1] || historicalAverageDailyDemand

    // Calculate forecast for 30, 60, 90 days
    const forecast30Days = Math.round(lastSmoothedValue * 30)
    const forecast60Days = Math.round(lastSmoothedValue * 60)
    const forecast90Days = Math.round(lastSmoothedValue * 90)

    // Calculate variance (standard deviation)
    const mean = demandValues.reduce((a, b) => a + b, 0) / demandValues.length
    const variance =
      Math.sqrt(
        demandValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
          demandValues.length
      ) / Math.max(mean, 1)

    // Confidence level based on demand stability (inverse of variance)
    const confidenceLevel = Math.max(0.5, Math.min(1, 1 - variance))

    // Calculate stockout risk
    const currentStock = item.stock.reduce((sum, s) => sum + s.quantityReal, 0)
    const stockoutRisk = Math.max(
      0,
      Math.min(1, 1 - currentStock / forecast30Days)
    )

    // Determine recommended action
    let recommendedAction:
      | 'INCREASE_STOCK'
      | 'MAINTAIN'
      | 'REDUCE_STOCK'
      | 'MONITOR' = 'MAINTAIN'
    if (stockoutRisk > 0.3) {
      recommendedAction = 'INCREASE_STOCK'
    } else if (currentStock > forecast90Days * 1.5) {
      recommendedAction = 'REDUCE_STOCK'
    } else if (variance > 0.5) {
      recommendedAction = 'MONITOR'
    }

    // Generate forecast data points for next 30 days
    const forecastData: ForecastData[] = []
    for (let day = 1; day <= 30; day++) {
      forecastData.push({
        date: new Date(Date.now() + day * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0],
        quantity: Math.round(lastSmoothedValue),
        confidence: confidenceLevel,
      })
    }

    // Emit forecast calculated event
    EventService.getInstance().emit(EventType.FORECAST_CALCULATED, {
      itemId,
      forecast30Days,
      confidenceLevel,
      trend: this.calculateTrend(
        historicalAverageDailyDemand,
        forecast30Days / 30
      ),
    })

    return {
      itemId,
      itemSku: item.sku,
      itemName: item.name,
      currentStock,
      historicalAverageDailyDemand:
        Math.round(historicalAverageDailyDemand * 100) / 100,
      forecastedDemand30Days: forecast30Days,
      forecastedDemand60Days: forecast60Days,
      forecastedDemand90Days: forecast90Days,
      forecastVariance: Math.round(variance * 100) / 100,
      confidenceLevel: Math.round(confidenceLevel * 100) / 100,
      trend: this.calculateTrend(
        historicalAverageDailyDemand,
        forecast30Days / 30
      ),
      recommended30DaysStock: Math.ceil(forecast30Days * 1.2),
      stockoutRisk: Math.round(stockoutRisk * 100) / 100,
      recommendedAction,
      forecastData,
    }
  }

  /**
   * Get demand forecast for all items (paginated)
   */
  async getAllDemandForecasts(
    page: number = 1,
    limit: number = 50
  ): Promise<{ data: ForecastResult[]; total: number }> {
    const skip = (page - 1) * limit

    const items = await prisma.item.findMany({
      where: { active: true },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    })

    const forecasts = await Promise.all(
      items.map((item) => this.getDemandForecastForItem(item.id))
    )

    const total = await prisma.item.count({ where: { active: true } })

    return { data: forecasts, total }
  }

  /**
   * Compare forecast with actual demand
   */
  async calculateForecastAccuracy(
    itemId: string,
    daysBack: number = 30
  ): Promise<number> {
    const item = await prisma.item.findUnique({ where: { id: itemId } })
    if (!item) throw new NotFoundError('Item not found')

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - daysBack)

    const movements = await prisma.movement.findMany({
      where: {
        itemId,
        createdAt: { gte: startDate },
        type: { in: ['SALE', 'TRANSFER_OUT'] },
      },
    })

    const actualDemand = movements.reduce((sum, mov) => sum + mov.quantity, 0)

    // Get last forecast (simplified - using last 90 days as reference)
    const historicalMovements = await prisma.movement.findMany({
      where: {
        itemId,
        createdAt: {
          gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
        },
        type: { in: ['SALE', 'TRANSFER_OUT'] },
      },
    })

    const historicalTotal = historicalMovements.reduce(
      (sum, mov) => sum + mov.quantity,
      0
    )
    const expectedDemand = (historicalTotal / 90) * daysBack

    if (expectedDemand === 0) return 1 // Perfect accuracy if no expected demand
    const accuracy =
      1 - Math.abs(actualDemand - expectedDemand) / expectedDemand
    return Math.max(0, Math.min(1, accuracy))
  }
}

export const getDemandForecastForItem = (itemId: string) =>
  ForecastingService.getInstance().getDemandForecastForItem(itemId)

export const getAllDemandForecasts = (page?: number, limit?: number) =>
  ForecastingService.getInstance().getAllDemandForecasts(page, limit)

export const calculateForecastAccuracy = (itemId: string, daysBack?: number) =>
  ForecastingService.getInstance().calculateForecastAccuracy(itemId, daysBack)

export default ForecastingService
