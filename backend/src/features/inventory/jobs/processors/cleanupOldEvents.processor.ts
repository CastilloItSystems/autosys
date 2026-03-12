/**
 * Cleanup Old Events Job Processor
 * Removes old event records from the database to maintain performance
 */

import { logger } from '../../../../shared/utils/logger.js'
import EventService from '../../shared/events/event.service.js'

export interface ICleanupOldEventsJobData {
  daysOld?: number
}

export async function cleanupOldEventsProcessor(
  data: ICleanupOldEventsJobData
): Promise<void> {
  try {
    const { daysOld = 90 } = data

    logger.info('Starting cleanup of old events', { daysOld })

    const eventService = EventService.getInstance()
    const deletedCount = await eventService.clearOldEvents(daysOld)

    logger.info('Old events cleanup completed', {
      deletedCount,
      daysOld,
    })
  } catch (error) {
    logger.error('Error cleaning up old events', { error })
    throw error
  }
}
