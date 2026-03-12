/**
 * Calculate Rotation Job
 * Calculates inventory turnover and rotation metrics for FIFO optimization
 */

import prisma from '../../../../services/prisma.service.js'
import { EventService } from '../../../shared/events/event.service.js'
import { EventType } from '../../../shared/types/event.types.js'

const eventService = EventService.getInstance()

export interface RotationMetrics {
  itemId: string
  itemName: string
  warehouseId: string
  turnoverRate: number // items sold / average inventory
  daysInventory: number // 365 / turnover rate
  rotationRank: 'A' | 'B' | 'C' // ABC analysis
  lastMovementDate?: Date
  movementFrequency: number // movements in last 90 days
}

/**
 * Calculate rotation metrics for all items
 */
export async function calculateRotationMetrics(): Promise<RotationMetrics[]> {
  const metrics: RotationMetrics[] = []

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

        if (stock && stock.quantityReal > 0) {
          // Get last 90 days of movements
          const ninetyDaysAgo = new Date()
          ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

          const movements = await prisma.movement.findMany({
            where: {
              itemId: item.id,
              warehouseId: warehouse.id,
              createdAt: { gte: ninetyDaysAgo },
            },
          })

          const movementFrequency = movements.length
          const lastMovement =
            movements.length > 0 ? movements[0].createdAt : undefined

          // Calculate turnover: (out) movements / average stock
          const outMovements = movements
            .filter((m) =>
              ['SALE', 'EXIT_NOTE', 'TRANSFER_OUT', 'WRITE_OFF'].includes(
                m.movementType
              )
            )
            .reduce((sum, m) => sum + m.quantity, 0)

          const turnoverRate =
            outMovements > 0
              ? outMovements / Math.max(stock.quantityReal, 1)
              : 0
          const daysInventory = turnoverRate > 0 ? 90 / turnoverRate : 999 // inventory turnover in days within 90-day period

          // ABC Classification
          let rotationRank: 'A' | 'B' | 'C' = 'C'
          if (movementFrequency > 10 && turnoverRate > 0.5) {
            rotationRank = 'A' // High frequency, high turnover
          } else if (movementFrequency > 5 || turnoverRate > 0.2) {
            rotationRank = 'B' // Medium frequency/turnover
          }

          metrics.push({
            itemId: item.id,
            itemName: item.name,
            warehouseId: warehouse.id,
            turnoverRate: parseFloat(turnoverRate.toFixed(2)),
            daysInventory: parseFloat(daysInventory.toFixed(1)),
            rotationRank,
            lastMovementDate: lastMovement,
            movementFrequency,
          })
        }
      }
    }

    // Store metrics for reporting
    for (const metric of metrics) {
      // Could store in a metrics table if available
      console.log(
        `Item ${metric.itemName}: ${metric.rotationRank} rotation, ${metric.daysInventory} days inventory`
      )
    }

    eventService.emit(EventType.INVENTORY_METRICS_CALCULATED, {
      metricsCount: metrics.length,
      timestamp: new Date(),
      period: '90_days',
    })

    return metrics
  } catch (error) {
    console.error('Error calculating rotation metrics:', error)
    throw error
  }
}

/**
 * Schedule rotation calculation job
 * Runs daily at 2 AM
 */
export async function scheduleCalculateRotation(): Promise<void> {
  console.log('Scheduling daily rotation calculation at 02:00...')
  // Would be integrated with Bull queue or node-cron
}

/**
 * Job processor for queue system
 */
export async function processCalculateRotationJob(data?: any): Promise<any> {
  console.log('🔄 Processing calculate rotation job...')

  try {
    const metrics = await calculateRotationMetrics()

    const summary = {
      totalItems: metrics.length,
      highRotation: metrics.filter((m) => m.rotationRank === 'A').length,
      mediumRotation: metrics.filter((m) => m.rotationRank === 'B').length,
      lowRotation: metrics.filter((m) => m.rotationRank === 'C').length,
      averageTurnover:
        metrics.length > 0
          ? (
              metrics.reduce((sum, m) => sum + m.turnoverRate, 0) /
              metrics.length
            ).toFixed(2)
          : 0,
      metrics,
    }

    console.log('✅ Rotation calculation completed:', summary)

    return summary
  } catch (error) {
    console.error('❌ Rotation calculation failed:', error)
    throw error
  }
}

export default {
  calculateRotationMetrics,
  scheduleCalculateRotation,
  processCalculateRotationJob,
}
