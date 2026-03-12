/**
 * Generate Stock Alerts Job
 * Generates alerts for low stock, overstock, and expiring items
 */

import prisma from '../../../../services/prisma.service.js'
import { EventService } from '../../../shared/events/event.service.js'
import { EventType } from '../../../shared/types/event.types.js'

const eventService = EventService.getInstance()

export interface StockAlert {
  id: string
  itemId: string
  itemName: string
  itemSKU: string
  warehouseId: string
  alertType: 'LOW_STOCK' | 'OVERSTOCK' | 'EXPIRING' | 'EXPIRED' | 'DEAD_STOCK'
  currentQuantity: number
  thresholdQuantity: number
  status: 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED'
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  createdAt: Date
}

/**
 * Generate low stock alerts
 */
async function generateLowStockAlerts(): Promise<StockAlert[]> {
  const alerts: StockAlert[] = []

  try {
    const stocks = await prisma.stock.findMany({
      include: {
        item: true,
        warehouse: true,
      },
    })

    for (const stock of stocks) {
      const minStock = (stock.item as any).minStock || 10

      if (stock.quantityAvailable <= minStock) {
        const severity =
          stock.quantityAvailable === 0
            ? 'CRITICAL'
            : stock.quantityAvailable <= Math.ceil(minStock / 2)
              ? 'HIGH'
              : 'MEDIUM'

        alerts.push({
          id: `LOWSTOCK-${stock.itemId}-${stock.warehouseId}`,
          itemId: stock.itemId,
          itemName: stock.item.name,
          itemSKU: stock.item.sku,
          warehouseId: stock.warehouseId,
          alertType: 'LOW_STOCK',
          currentQuantity: stock.quantityAvailable,
          thresholdQuantity: minStock,
          status: 'ACTIVE',
          severity,
          createdAt: new Date(),
        })
      }
    }

    return alerts
  } catch (error) {
    console.error('Error generating low stock alerts:', error)
    return []
  }
}

/**
 * Generate overstock alerts
 */
async function generateOverstockAlerts(): Promise<StockAlert[]> {
  const alerts: StockAlert[] = []

  try {
    const stocks = await prisma.stock.findMany({
      include: {
        item: true,
        warehouse: true,
      },
    })

    for (const stock of stocks) {
      const maxStock = (stock.item as any).maxStock || 1000

      if (stock.quantityReal > maxStock) {
        const excess = stock.quantityReal - maxStock
        const severity = excess > maxStock * 0.5 ? 'HIGH' : 'MEDIUM'

        alerts.push({
          id: `OVERSTOCK-${stock.itemId}-${stock.warehouseId}`,
          itemId: stock.itemId,
          itemName: stock.item.name,
          itemSKU: stock.item.sku,
          warehouseId: stock.warehouseId,
          alertType: 'OVERSTOCK',
          currentQuantity: stock.quantityReal,
          thresholdQuantity: maxStock,
          status: 'ACTIVE',
          severity,
          createdAt: new Date(),
        })
      }
    }

    return alerts
  } catch (error) {
    console.error('Error generating overstock alerts:', error)
    return []
  }
}

/**
 * Generate expiring batch alerts
 */
async function generateExpiringAlerts(): Promise<StockAlert[]> {
  const alerts: StockAlert[] = []

  try {
    const thirtyDaysFromNow = new Date()
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)

    const expiringBatches = await prisma.batch.findMany({
      where: {
        expiryDate: {
          lte: thirtyDaysFromNow,
          gte: new Date(),
        },
        isActive: true,
      },
      include: {
        item: true,
      },
    })

    for (const batch of expiringBatches) {
      const daysUntilExpiry = Math.floor(
        (batch.expiryDate.getTime() - new Date().getTime()) /
          (1000 * 60 * 60 * 24)
      )

      const severity =
        daysUntilExpiry <= 7
          ? 'CRITICAL'
          : daysUntilExpiry <= 14
            ? 'HIGH'
            : 'MEDIUM'

      alerts.push({
        id: `EXPIRING-${batch.id}`,
        itemId: batch.itemId,
        itemName: `${batch.item.name} (Batch: ${batch.batchNumber})`,
        itemSKU: batch.item.sku,
        warehouseId: batch.warehouseId,
        alertType: 'EXPIRING',
        currentQuantity: batch.currentQuantity,
        thresholdQuantity: 0,
        status: 'ACTIVE',
        severity,
        createdAt: new Date(),
      })
    }

    return alerts
  } catch (error) {
    console.error('Error generating expiring alerts:', error)
    return []
  }
}

/**
 * Generate dead stock alerts
 */
async function generateDeadStockAlerts(): Promise<StockAlert[]> {
  const alerts: StockAlert[] = []

  try {
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    const stocks = await prisma.stock.findMany({
      include: {
        item: true,
      },
    })

    for (const stock of stocks) {
      if (stock.quantityReal > 0 && stock.lastCountDate < sixMonthsAgo) {
        alerts.push({
          id: `DEADSTOCK-${stock.itemId}-${stock.warehouseId}`,
          itemId: stock.itemId,
          itemName: stock.item.name,
          itemSKU: stock.item.sku,
          warehouseId: stock.warehouseId,
          alertType: 'DEAD_STOCK',
          currentQuantity: stock.quantityReal,
          thresholdQuantity: 0,
          status: 'ACTIVE',
          severity: 'MEDIUM',
          createdAt: new Date(),
        })
      }
    }

    return alerts
  } catch (error) {
    console.error('Error generating dead stock alerts:', error)
    return []
  }
}

/**
 * Consolidate all alerts and emit events
 */
export async function generateAllAlerts(): Promise<StockAlert[]> {
  const allAlerts: StockAlert[] = []

  const [lowStock, overstock, expiring, deadStock] = await Promise.all([
    generateLowStockAlerts(),
    generateOverstockAlerts(),
    generateExpiringAlerts(),
    generateDeadStockAlerts(),
  ])

  allAlerts.push(...lowStock, ...overstock, ...expiring, ...deadStock)

  // Emit events for critical alerts
  const criticalAlerts = allAlerts.filter((a) => a.severity === 'CRITICAL')
  if (criticalAlerts.length > 0) {
    eventService.emit(EventType.CRITICAL_STOCK_ALERT, {
      alertCount: criticalAlerts.length,
      alerts: criticalAlerts,
      timestamp: new Date(),
    })
  }

  return allAlerts
}

/**
 * Job processor for queue system
 */
export async function processGenerateAlertsJob(data?: any): Promise<any> {
  console.log('🔔 Processing generate stock alerts job...')

  try {
    const alerts = await generateAllAlerts()

    const summary = {
      totalAlerts: alerts.length,
      lowStock: alerts.filter((a) => a.alertType === 'LOW_STOCK').length,
      overstock: alerts.filter((a) => a.alertType === 'OVERSTOCK').length,
      expiring: alerts.filter((a) => a.alertType === 'EXPIRING').length,
      deadStock: alerts.filter((a) => a.alertType === 'DEAD_STOCK').length,
      critical: alerts.filter((a) => a.severity === 'CRITICAL').length,
      high: alerts.filter((a) => a.severity === 'HIGH').length,
      timestamp: new Date(),
    }

    console.log('✅ Stock alerts generated:', summary)

    return summary
  } catch (error) {
    console.error('❌ Alert generation failed:', error)
    throw error
  }
}

export default {
  generateAllAlerts,
  generateLowStockAlerts,
  generateOverstockAlerts,
  generateExpiringAlerts,
  generateDeadStockAlerts,
  processGenerateAlertsJob,
}
