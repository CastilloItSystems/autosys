/**
 * Sync Reservations Job Processor
 * Cleans up expired reservations and updates available quantities
 */

import { logger } from '../../../../shared/utils/logger.js'
import prisma from '../../../../services/prisma.service.js'

export interface ISyncReservationsJobData {
  warehouseId?: string
  cleanupExpirationDays?: number
}

export async function syncReservationsProcessor(
  data: ISyncReservationsJobData
): Promise<void> {
  try {
    const { warehouseId, cleanupExpirationDays = 7 } = data

    logger.info('Syncing reservations', {
      warehouseId,
      cleanupExpirationDays,
    })

    // Find expired reservations
    const expirationDate = new Date()
    expirationDate.setDate(expirationDate.getDate() - cleanupExpirationDays)

    const where: any = {
      status: 'ACTIVE',
      createdAt: {
        lt: expirationDate,
      },
    }

    if (warehouseId) {
      where.warehouseId = warehouseId
    }

    const expiredReservations = await prisma.reservation.findMany({
      where,
    })

    logger.info(`Found ${expiredReservations.length} expired reservations`)

    // Cancel expired reservations
    let cancelledCount = 0
    for (const reservation of expiredReservations) {
      try {
        // Cancel reservation by marking as RELEASED
        await prisma.reservation.update({
          where: { id: reservation.id },
          data: {
            status: 'RELEASED',
            releasedAt: new Date(),
          },
        })

        cancelledCount++
        logger.debug(`Cancelled expired reservation: ${reservation.id}`)
      } catch (error) {
        logger.warn(`Failed to cancel reservation ${reservation.id}`, { error })
      }
    }

    logger.info('Reservation sync completed', {
      cancelledCount,
    })
  } catch (error) {
    logger.error('Error syncing reservations', { error })
    throw error
  }
}
