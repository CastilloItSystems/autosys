import cron from 'node-cron'
import prisma from '../../services/prisma.service.js'
import { logger } from '../../shared/utils/logger.js'

const RETENTION_DAYS_READ = 90
const RETENTION_DAYS_DELETED = 30
const DAY_MS = 86_400_000

export async function runNotificationsCleanup(): Promise<{
  readDeleted: number
  softDeletedPurged: number
}> {
  const readCutoff = new Date(Date.now() - RETENTION_DAYS_READ * DAY_MS)
  const deletedCutoff = new Date(Date.now() - RETENTION_DAYS_DELETED * DAY_MS)

  const { count: readDeleted } = await prisma.notification.deleteMany({
    where: { read: true, createdAt: { lt: readCutoff } },
  })
  const { count: softDeletedPurged } = await prisma.notification.deleteMany({
    where: { eliminado: true, updatedAt: { lt: deletedCutoff } },
  })

  logger.info('Notifications cleanup completed', {
    readDeleted,
    softDeletedPurged,
    readRetentionDays: RETENTION_DAYS_READ,
    deletedRetentionDays: RETENTION_DAYS_DELETED,
  })

  return { readDeleted, softDeletedPurged }
}

let scheduled = false

export function initNotificationsCleanupJob(): void {
  if (scheduled) return
  scheduled = true

  cron.schedule('0 3 * * *', () => {
    runNotificationsCleanup().catch((error) => {
      logger.error('Notifications cleanup job failed', { error })
    })
  })

  logger.info('Notifications cleanup job scheduled (03:00 UTC daily)')
}
