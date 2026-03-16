/**
 * Sync Stock Job
 * Synchronizes stock quantities across multiple locations and data sources
 */

import prisma from '../../../services/prisma.service.js'
import EventService from '../shared/events/event.service.js'
import { EventType } from '../shared/events/event.types.js'

const eventService = EventService.getInstance()

export interface SyncResult {
  totalItems: number
  synced: number
  discrepancies: Array<{
    itemId: string
    warehouseId: string
    recorded: number
    physical: number
    difference: number
  }>
  timestamp: Date
}

/**
 * Reconcile stock quantities with movements
 */
export async function syncStockWithMovements(): Promise<SyncResult> {
  const result: SyncResult = {
    totalItems: 0,
    synced: 0,
    discrepancies: [],
    timestamp: new Date(),
  }

  try {
    const stocks = await prisma.stock.findMany({
      include: {
        item: true,
        warehouse: true,
      },
    })

    result.totalItems = stocks.length

    for (const stock of stocks) {
      try {
        // Get all movements for this item in this warehouse
        const movements = await prisma.movement.findMany({
          where: {
            itemId: stock.itemId,
            OR: [
              { warehouseFromId: stock.warehouseId },
              { warehouseToId: stock.warehouseId },
            ],
          },
        })

        // Calculate quantities from movements
        let calculatedQuantity = 0

        // Get all purchase in movements as base
        const purchaseIn = movements
          .filter((m) => m.type === 'PURCHASE')
          .reduce((sum, m) => sum + m.quantity, 0)

        // Add transfer in (where this warehouse is the destination)
        const transferIn = movements
          .filter((m) => m.type === 'TRANSFER' && m.warehouseToId === stock.warehouseId)
          .reduce((sum, m) => sum + m.quantity, 0)

        // Add returns
        const returnsIn = movements
          .filter((m) => m.type === 'SUPPLIER_RETURN')
          .reduce((sum, m) => sum + m.quantity, 0)

        // Subtract sales/exits
        const exitsOut = movements
          .filter((m) =>
            (['SALE', 'ADJUSTMENT_OUT'] as string[]).includes(m.type) ||
            (m.type === 'TRANSFER' && m.warehouseFromId === stock.warehouseId)
          )
          .reduce((sum, m) => sum + m.quantity, 0)

        calculatedQuantity = purchaseIn + transferIn + returnsIn - exitsOut

        // Compare with recorded quantity
        if (calculatedQuantity !== stock.quantityReal) {
          const discrepancy = stock.quantityReal - calculatedQuantity

          result.discrepancies.push({
            itemId: stock.itemId,
            warehouseId: stock.warehouseId,
            recorded: stock.quantityReal,
            physical: calculatedQuantity,
            difference: discrepancy,
          })

          // Auto-correct if minor discrepancy
          if (Math.abs(discrepancy) <= 5 && Math.abs(discrepancy) > 0) {
            // Create adjustment movement
            await prisma.movement.create({
              data: {
                itemId: stock.itemId,
                warehouseToId: stock.warehouseId,
                type: (discrepancy > 0 ? 'ADJUSTMENT_OUT' : 'ADJUSTMENT_IN') as any,
                quantity: Math.abs(discrepancy),
                reference: `AUTO_SYNC_${new Date().getTime()}`,
                notes: 'Auto-sync correction based on movement history',
              } as any,
            })

            // Update stock
            await prisma.stock.update({
              where: {
                itemId_warehouseId: {
                  itemId: stock.itemId,
                  warehouseId: stock.warehouseId,
                },
              },
              data: {
                quantityReal: calculatedQuantity,
                quantityAvailable: Math.max(
                  0,
                  calculatedQuantity - stock.quantityReserved
                ),
                updatedAt: new Date(),
              },
            })

            result.synced++
          }
        } else {
          result.synced++
        }
      } catch (error) {
        console.error(
          `Error syncing item ${stock.itemId} in warehouse ${stock.warehouseId}:`,
          error
        )
      }
    }

    // Emit event if discrepancies found
    if (result.discrepancies.length > 0) {
      eventService.emit({
        type: EventType.STOCK_DISCREPANCY_DETECTED,
        entityId: 'system',
        entityType: 'STOCK',
        data: {
          discrepancies: result.discrepancies,
          correctedCount: result.synced,
          totalCount: result.totalItems,
          timestamp: result.timestamp,
        },
      })
    }

    return result
  } catch (error) {
    console.error('Error syncing stock with movements:', error)
    throw error
  }
}

/**
 * Validate stock constraints
 */
export async function validateStockConstraints(): Promise<
  Array<{
    issue: string
    itemId: string
    warehouseId: string
    values: Record<string, any>
  }>
> {
  const issues: Array<{
    issue: string
    itemId: string
    warehouseId: string
    values: Record<string, any>
  }> = []

  try {
    const stocks = await prisma.stock.findMany()

    for (const stock of stocks) {
      // Check negative quantities
      if (stock.quantityReal < 0 || stock.quantityAvailable < 0) {
        issues.push({
          issue: 'NEGATIVE_QUANTITY',
          itemId: stock.itemId,
          warehouseId: stock.warehouseId,
          values: {
            quantityReal: stock.quantityReal,
            quantityAvailable: stock.quantityAvailable,
          },
        })
      }

      // Check reserved > available
      if (stock.quantityReserved > stock.quantityReal) {
        issues.push({
          issue: 'RESERVED_EXCEEDS_REAL',
          itemId: stock.itemId,
          warehouseId: stock.warehouseId,
          values: {
            quantityReal: stock.quantityReal,
            quantityReserved: stock.quantityReserved,
          },
        })
      }

      // Check available > real
      if (stock.quantityAvailable > stock.quantityReal) {
        issues.push({
          issue: 'AVAILABLE_EXCEEDS_REAL',
          itemId: stock.itemId,
          warehouseId: stock.warehouseId,
          values: {
            quantityReal: stock.quantityReal,
            quantityAvailable: stock.quantityAvailable,
          },
        })
      }
    }

    // Emit event if issues found
    if (issues.length > 0) {
      eventService.emit({
        type: EventType.STOCK_INTEGRITY_ISSUE,
        entityId: 'system',
        entityType: 'STOCK',
        data: { issueCount: issues.length, issues, timestamp: new Date() },
      })
    }

    return issues
  } catch (error) {
    console.error('Error validating stock constraints:', error)
    return []
  }
}

/**
 * Job processor for queue system
 */
export async function processSyncStockJob(data?: any): Promise<any> {
  console.log('🔄 Processing sync stock job...')

  try {
    const [syncResult, constraints] = await Promise.all([
      syncStockWithMovements(),
      validateStockConstraints(),
    ])

    const summary = {
      sync: {
        totalItems: syncResult.totalItems,
        synced: syncResult.synced,
        discrepancies: syncResult.discrepancies.length,
      },
      constraints: {
        issues: constraints.length,
        types: [...new Set(constraints.map((c) => c.issue))],
      },
      timestamp: new Date(),
    }

    console.log('✅ Stock sync completed:', summary)

    return summary
  } catch (error) {
    console.error('❌ Stock sync failed:', error)
    throw error
  }
}

export default {
  syncStockWithMovements,
  validateStockConstraints,
  processSyncStockJob,
}
