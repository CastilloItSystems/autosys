/**
 * Job Queue System Exports
 */

export { default as QueueService, JobType } from './queue.service'
export type { IJobData, IJobOptions } from './queue.service'

// Job processors
export { generateAlertsProcessor } from './processors/generateAlerts.processor'
export type { IGenerateAlertsJobData } from './processors/generateAlerts.processor'

export { syncReservationsProcessor } from './processors/syncReservations.processor'
export type { ISyncReservationsJobData } from './processors/syncReservations.processor'

export { checkLoansOverdueProcessor } from './processors/checkLoansOverdue.processor'
export type { ICheckLoansOverdueJobData } from './processors/checkLoansOverdue.processor'

export { cleanupOldEventsProcessor } from './processors/cleanupOldEvents.processor'
export type { ICleanupOldEventsJobData } from './processors/cleanupOldEvents.processor'

export { checkExpiryProcessor } from './processors/checkExpiry.processor'
export type { ICheckExpiryJobData } from './processors/checkExpiry.processor'

// Jobs
export {
  scheduleCheckExpiryJob,
  scheduleCheckExpiryJobRecurring,
} from './checkExpiry.job'

/**
 * Initialize all job processors
 */
export const initializeJobProcessors = (queueService: any): void => {
  const { JobType } = require('./queue.service')
  const {
    generateAlertsProcessor,
  } = require('./processors/generateAlerts.processor')
  const {
    syncReservationsProcessor,
  } = require('./processors/syncReservations.processor')
  const {
    checkLoansOverdueProcessor,
  } = require('./processors/checkLoansOverdue.processor')
  const {
    cleanupOldEventsProcessor,
  } = require('./processors/cleanupOldEvents.processor')
  const { checkExpiryProcessor } = require('./processors/checkExpiry.processor')

  // Register job processors
  queueService.processQueue(JobType.GENERATE_ALERTS, async (job: any) => {
    await generateAlertsProcessor(job.data)
  })

  queueService.processQueue(JobType.SYNC_RESERVATIONS, async (job: any) => {
    await syncReservationsProcessor(job.data)
  })

  queueService.processQueue(JobType.CHECK_LOANS_OVERDUE, async (job: any) => {
    await checkLoansOverdueProcessor(job.data)
  })

  queueService.processQueue(JobType.CLEANUP_OLD_EVENTS, async (job: any) => {
    await cleanupOldEventsProcessor(job.data)
  })

  queueService.processQueue(JobType.CHECK_EXPIRY, async (job: any) => {
    await checkExpiryProcessor(job.data)
  })
}
