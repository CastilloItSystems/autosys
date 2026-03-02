// backend/src/features/inventory/serialNumbers/tracking/tracking.service.ts

import prisma from '../../../../services/prisma.service'
import { logger } from '../../../../shared/utils/logger'
import { NotFoundError } from '../../../../shared/utils/ApiError'
import {
  ISerialNumberTracking,
  ISerialMovement,
} from '../serialNumbers.interface'

class TrackingService {
  private static instance: TrackingService

  private constructor() {}

  static getInstance(): TrackingService {
    if (!TrackingService.instance) {
      TrackingService.instance = new TrackingService()
    }
    return TrackingService.instance
  }

  /**
   * Get tracking history for a serial number
   */
  async getTrackingHistory(serialId: string): Promise<ISerialNumberTracking> {
    try {
      logger.info('Getting tracking history', { serialId })

      const serial = await prisma.serialNumber.findUnique({
        where: { id: serialId },
        include: { item: true },
      })

      if (!serial) {
        throw new NotFoundError('Serial number not found')
      }

      // Get movement history
      const movements = await prisma.movement.findMany({
        where: {
          reference: serialId,
        },
        orderBy: { createdAt: 'desc' },
      })

      // Build movement history
      const movementHistory: ISerialMovement[] = movements.map(
        (movement: any) => ({
          date: movement.movementDate || movement.createdAt,
          type: movement.type,
          fromWarehouse: movement.warehouseFromId,
          toWarehouse: movement.warehouseToId,
          status: serial.status as any,
          reference: movement.movementNumber,
        })
      )

      return {
        serialNumber: serial.serialNumber,
        itemId: serial.itemId,
        status: serial.status as any,
        currentLocation: serial.warehouseId || '',
        movementHistory,
      }
    } catch (error) {
      logger.error('Error getting tracking history', { error })
      throw error
    }
  }

  /**
   * Get tracking summary
   */
  async getTrackingSummary(serialId: string): Promise<any> {
    try {
      logger.info('Getting tracking summary', { serialId })

      const serial = await prisma.serialNumber.findUnique({
        where: { id: serialId },
        include: { item: true },
      })

      if (!serial) {
        throw new NotFoundError('Serial number not found')
      }

      // Get total movements
      const totalMovements = await prisma.movement.count({
        where: {
          reference: serialId,
        },
      })

      return {
        serialNumber: serial.serialNumber,
        itemName: serial.item?.name,
        currentStatus: serial.status,
        currentLocation: serial.warehouseId,
        totalMovements,
        createdAt: serial.createdAt,
        lastUpdated: serial.updatedAt,
      }
    } catch (error) {
      logger.error('Error getting tracking summary', { error })
      throw error
    }
  }

  /**
   * Trace serial through items (from receipt to final destination)
   */
  async traceSerialJourney(serialId: string): Promise<any[]> {
    try {
      logger.info('Tracing serial journey', { serialId })

      const serial = await prisma.serialNumber.findUnique({
        where: { id: serialId },
      })

      if (!serial) {
        throw new NotFoundError('Serial number not found')
      }

      // Query movements associated with this serial
      const journey = await prisma.movement.findMany({
        where: {
          reference: serialId,
        },
        include: {
          item: true,
          warehouseFrom: true,
          warehouseTo: true,
        },
        orderBy: { createdAt: 'asc' },
      })

      return journey.map((movement: any) => ({
        date: movement.createdAt,
        type: movement.type,
        quantity: movement.quantity,
        fromWarehouse: movement.warehouseFrom?.name,
        toWarehouse: movement.warehouseTo?.name,
        reference: movement.movementNumber,
        notes: movement.notes,
      }))
    } catch (error) {
      logger.error('Error tracing serial journey', { error })
      throw error
    }
  }
}

export default TrackingService.getInstance()
