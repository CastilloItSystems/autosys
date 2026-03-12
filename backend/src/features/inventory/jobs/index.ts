/**
 * Job Queue System Exports
 */

export { default as QueueService, JobType } from './queue.service.js'
export type { IJobData, IJobOptions } from './queue.service.js'

// Job processors
export { generateAlertsProcessor } from './processors/generateAlerts.processor.js'
export type { IGenerateAlertsJobData } from './processors/generateAlerts.processor.js'

export { syncReservationsProcessor } from './processors/syncReservations.processor.js'
export type { ISyncReservationsJobData } from './processors/syncReservations.processor.js'

export { checkLoansOverdueProcessor } from './processors/checkLoansOverdue.processor.js'
export type { ICheckLoansOverdueJobData } from './processors/checkLoansOverdue.processor.js'

export { cleanupOldEventsProcessor } from './processors/cleanupOldEvents.processor.js'
export type { ICleanupOldEventsJobData } from './processors/cleanupOldEvents.processor.js'

export { checkExpiryProcessor } from './processors/checkExpiry.processor.js'
export type { ICheckExpiryJobData } from './processors/checkExpiry.processor.js'

// Jobs
export {
  scheduleCheckExpiryJob,
  scheduleCheckExpiryJobRecurring,
} from './checkExpiry.job.js'

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
