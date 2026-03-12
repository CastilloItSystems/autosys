/**
 * Job Queue Service - Bull Queue Setup and Management
 */

import Queue from 'bull'
import { logger } from '../../../shared/utils/logger.js'
import { EventType } from '../shared/events/event.types.js'

// Define job types
export enum JobType {
  // Stock/Inventory jobs
  GENERATE_ALERTS = 'generate-alerts',
  UPDATE_STOCK_LEVELS = 'update-stock-levels',
  SYNC_RESERVATIONS = 'sync-reservations',
  CALCULATE_ROTATION = 'calculate-rotation',
  AUDIT_STOCK_DELTA = 'audit-stock-delta',

  // Loan jobs
  CHECK_LOANS_OVERDUE = 'check-loans-overdue',

  // Batch jobs
  CHECK_EXPIRING_BATCHES = 'check-expiring-batches',

  // Analytics jobs
  GENERATE_ANALYTICS_SNAPSHOT = 'generate-analytics-snapshot',

  // System jobs
  CLEANUP_OLD_EVENTS = 'cleanup-old-events',
  SYNC_EXTERNAL_DATA = 'sync-external-data',
}

export interface IJobData {
  [key: string]: any
}

export interface IJobOptions {
  attempts?: number
  backoff?: {
    type: string
    delay: number
  }
  removeOnComplete?: boolean
  removeOnFail?: boolean
  repeat?: {
    cron?: string
    every?: number
  }
}

class QueueService {
  private static instance: QueueService
  private queues: Map<JobType, Queue.Queue> = new Map()
  private redisUrl: string

  private constructor(redisUrl: string = 'redis://localhost:6379') {
    this.redisUrl = redisUrl
  }

  static getInstance(redisUrl?: string): QueueService {
    if (!QueueService.instance) {
      QueueService.instance = new QueueService(redisUrl)
    }
    return QueueService.instance
  }

  /**
   * Initialize all job queues
   */
  initializeQueues(): void {
    try {
      this.createQueue(JobType.GENERATE_ALERTS)
      this.createQueue(JobType.UPDATE_STOCK_LEVELS)
      this.createQueue(JobType.SYNC_RESERVATIONS)
      this.createQueue(JobType.CALCULATE_ROTATION)
      this.createQueue(JobType.AUDIT_STOCK_DELTA)
      this.createQueue(JobType.CHECK_LOANS_OVERDUE)
      this.createQueue(JobType.CHECK_EXPIRING_BATCHES)
      this.createQueue(JobType.GENERATE_ANALYTICS_SNAPSHOT)
      this.createQueue(JobType.CLEANUP_OLD_EVENTS)
      this.createQueue(JobType.SYNC_EXTERNAL_DATA)

      logger.info('All job queues initialized', {
        queueCount: this.queues.size,
      })
    } catch (error) {
      logger.error('Error initializing job queues', { error })
      throw error
    }
  }

  /**
   * Create a queue
   */
  private createQueue(jobType: JobType): Queue.Queue {
    let queue = this.queues.get(jobType)

    if (!queue) {
      queue = new Queue(jobType, this.redisUrl)

      queue.on('ready', () => {
        logger.debug(`Queue ready: ${jobType}`)
      })

      queue.on('error', (error) => {
        logger.error(`Queue error: ${jobType}`, { error })
      })

      queue.on('completed', (job) => {
        logger.debug(`Job completed: ${jobType} - ${job.id}`)
      })

      queue.on('failed', (job, err) => {
        logger.error(`Job failed: ${jobType} - ${job.id}`, { error: err })
      })

      this.queues.set(jobType, queue)
    }

    return queue
  }

  /**
   * Add a job to queue
   */
  async addJob(
    jobType: JobType,
    data: IJobData,
    options?: IJobOptions
  ): Promise<Queue.Job> {
    const queue = this.queues.get(jobType)

    if (!queue) {
      throw new Error(`Queue not found: ${jobType}`)
    }

    const jobOptions: any = {
      attempts: options?.attempts || 3,
      backoff: options?.backoff || {
        type: 'exponential',
        delay: 2000,
      },
      removeOnComplete: options?.removeOnComplete !== false,
      removeOnFail: options?.removeOnFail || false,
    }

    if (options?.repeat) {
      if (options.repeat.cron) {
        jobOptions.repeat = { cron: options.repeat.cron }
      } else if (options.repeat.every) {
        jobOptions.repeat = { every: options.repeat.every }
      }
    }

    const job = await queue.add(data, jobOptions)

    logger.info(`Job added to queue: ${jobType}`, {
      jobId: job.id,
      data: JSON.stringify(data).substring(0, 200),
    })

    return job
  }

  /**
   * Add recurring job (cron)
   */
  async addRecurringJob(
    jobType: JobType,
    data: IJobData,
    cronExpression: string,
    options?: IJobOptions
  ): Promise<Queue.Job> {
    const queue = this.queues.get(jobType)

    if (!queue) {
      throw new Error(`Queue not found: ${jobType}`)
    }

    const job = await queue.add(data, {
      repeat: {
        cron: cronExpression,
      },
      attempts: options?.attempts || 3,
      backoff: options?.backoff || {
        type: 'exponential',
        delay: 2000,
      },
      removeOnComplete: options?.removeOnComplete !== false,
      removeOnFail: options?.removeOnFail || false,
    })

    logger.info(`Recurring job added: ${jobType}`, {
      jobId: job.id,
      cron: cronExpression,
    })

    return job
  }

  /**
   * Process a job type with a handler
   */
  async processQueue(
    jobType: JobType,
    handler: (job: Queue.Job) => Promise<void>
  ): Promise<void> {
    const queue = this.queues.get(jobType)

    if (!queue) {
      throw new Error(`Queue not found: ${jobType}`)
    }

    queue.process(async (job) => {
      logger.info(`Processing job: ${jobType} - ${job.id}`, {
        data: job.data,
      })

      try {
        await handler(job)
        return { success: true }
      } catch (error) {
        logger.error(`Job processing failed: ${jobType} - ${job.id}`, {
          error,
        })
        throw error
      }
    })

    logger.info(`Job processor registered: ${jobType}`)
  }

  /**
   * Get queue
   */
  getQueue(jobType: JobType): Queue.Queue | undefined {
    return this.queues.get(jobType)
  }

  /**
   * Get all queues
   */
  getAllQueues(): Map<JobType, Queue.Queue> {
    return this.queues
  }

  /**
   * Close all queues
   */
  async closeAll(): Promise<void> {
    try {
      for (const [jobType, queue] of this.queues) {
        await queue.close()
        logger.info(`Queue closed: ${jobType}`)
      }
      this.queues.clear()
    } catch (error) {
      logger.error('Error closing queues', { error })
      throw error
    }
  }

  /**
   * Get queue status
   */
  async getQueueStatus(jobType: JobType): Promise<{
    jobType: JobType
    active: number
    waiting: number
    completed: number
    failed: number
  } | null> {
    const queue = this.queues.get(jobType)

    if (!queue) {
      return null
    }

    const [active, waiting, completed, failed] = await Promise.all([
      queue.getActiveCount(),
      queue.getWaitingCount(),
      queue.getCompletedCount(),
      queue.getFailedCount(),
    ])

    return { jobType, active, waiting, completed, failed }
  }

  /**
   * Clear all jobs in a queue
   */
  async clearQueue(jobType: JobType): Promise<void> {
    const queue = this.queues.get(jobType)

    if (!queue) {
      throw new Error(`Queue not found: ${jobType}`)
    }

    await queue.empty()
    logger.info(`Queue cleared: ${jobType}`)
  }
}

export default QueueService
