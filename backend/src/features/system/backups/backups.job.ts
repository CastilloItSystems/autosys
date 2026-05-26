// backend/src/features/system/backups/backups.job.ts

import cron from 'node-cron'
import { backupsService } from './backups.service.js'
import { logger } from '../../../shared/utils/logger.js'

const DAILY_CRON = process.env.BACKUP_DAILY_CRON || '0 2 * * *'
const WEEKLY_CRON = process.env.BACKUP_WEEKLY_CRON || '0 3 * * 0'
const RETENTION_CRON = process.env.BACKUP_RETENTION_CRON || '30 4 * * *'
const RETENTION_DAILY_DAYS = Number(process.env.BACKUP_RETENTION_DAILY_DAYS || 7)
const RETENTION_WEEKLY_WEEKS = Number(
  process.env.BACKUP_RETENTION_WEEKLY_WEEKS || 4
)

let scheduled = false

export function initDatabaseBackupJobs(): void {
  if (scheduled) return
  scheduled = true

  cron.schedule(DAILY_CRON, () => {
    backupsService.runBackup('DAILY').catch((err) => {
      logger.error('Daily backup job failed', { error: err })
    })
  })

  cron.schedule(WEEKLY_CRON, () => {
    backupsService.runBackup('WEEKLY').catch((err) => {
      logger.error('Weekly backup job failed', { error: err })
    })
  })

  cron.schedule(RETENTION_CRON, () => {
    backupsService
      .pruneRetention({
        dailyDays: RETENTION_DAILY_DAYS,
        weeklyWeeks: RETENTION_WEEKLY_WEEKS,
      })
      .then(({ deleted }) => {
        logger.info('Backup retention prune completed', { deleted })
      })
      .catch((err) => {
        logger.error('Backup retention job failed', { error: err })
      })
  })

  logger.info('Database backup jobs scheduled', {
    daily: DAILY_CRON,
    weekly: WEEKLY_CRON,
    retention: RETENTION_CRON,
    retentionDailyDays: RETENTION_DAILY_DAYS,
    retentionWeeklyWeeks: RETENTION_WEEKLY_WEEKS,
  })
}
