/**
 * Check Expiry Job Processor
 * Checks for batches expiring soon and emits events
 */

import { logger } from '../../../../shared/utils/logger.js'
import BatchesService from '../../batches/batches.service.js'
import { EventType, EventPriority } from '../../shared/events/event.types.js'
import EventService from '../../shared/events/event.service.js'

const eventService = EventService.getInstance()

export interface ICheckExpiryJobData {
  daysThreshold?: number
}

export async function checkExpiryProcessor(
  data: ICheckExpiryJobData
): Promise<void> {
  try {
    const { daysThreshold = 30 } = data

    logger.info('Starting batch expiry check', { daysThreshold })

    // Check for expiring batches
    const expiringBatches =
      await BatchesService.findExpiringBatches(daysThreshold)

    for (const batch of expiringBatches) {
      await eventService.emit({
        type: EventType.BATCH_EXPIRING_SOON,
        entityId: batch.batchId,
        entityType: 'batch',
        userId: 'SYSTEM',
        data: {
          batchNumber: batch.batchNumber,
          itemId: batch.itemId,
          itemName: batch.itemName,
          expiryDate: batch.expiryDate,
          daysUntilExpiry: batch.daysUntilExpiry,
          currentQuantity: batch.currentQuantity,
        },
        priority:
          batch.daysUntilExpiry <= 7
            ? EventPriority.HIGH
            : EventPriority.MEDIUM,
      })
    }

    logger.info('Expiring batches check completed', {
      expiringCount: expiringBatches.length,
    })

    // Check for expired batches
    const expiredBatches = await BatchesService.findExpiredBatches()

    for (const batch of expiredBatches) {
      await eventService.emit({
        type: EventType.BATCH_EXPIRED,
        entityId: batch.batchId,
        entityType: 'batch',
        userId: 'SYSTEM',
        data: {
          batchNumber: batch.batchNumber,
          itemId: batch.itemId,
          itemName: batch.itemName,
          expiryDate: batch.expiryDate,
          currentQuantity: batch.currentQuantity,
        },
        priority: EventPriority.HIGH,
      })
    }

    logger.info('Expired batches check completed', {
      expiredCount: expiredBatches.length,
    })

    logger.info('Batch expiry check job completed successfully')
  } catch (error) {
    logger.error('Error checking batch expiry', { error })
    throw error
  }
}
