/**
 * Check Expiry Job
 * Schedule batch expiry checks
 */

import { logger } from '../../../shared/utils/logger.js'
import QueueService from './queue.service.js'
import { JobType } from './queue.service.js'

export async function scheduleCheckExpiryJob(): Promise<void> {
  try {
    logger.info('Scheduling check expiry job')

    await QueueService.enqueueJob(JobType.CHECK_EXPIRING_BATCHES, {
      daysThreshold: 30,
    })

    logger.info('Check expiry job scheduled')
  } catch (error) {
    logger.error('Error scheduling check expiry job', { error })
    throw error
  }
}

export async function scheduleCheckExpiryJobRecurring(
  intervalHours = 24
): Promise<void> {
  try {
    logger.info('Scheduling recurring check expiry job', { intervalHours })

    // Job will run every X hours
    await QueueService.enqueueJob(
      JobType.CHECK_EXPIRING_BATCHES,
      {
        daysThreshold: 30,
      },
      {
        repeat: {
          every: intervalHours * 60 * 60 * 1000, // Convert hours to milliseconds
        },
      }
    )

    logger.info('Recurring check expiry job scheduled')
  } catch (error) {
    logger.error('Error scheduling recurring check expiry job', { error })
    throw error
  }
}
