// backend/src/features/inventory/batches/expiry/expiry.service.ts

import { logger } from '../../../../shared/utils/logger.js'
import BatchesService from '../batches.service.js'
import { IBatchExpiryInfo, BatchStatus } from '../batches.interface.js'

class ExpiryService {
  private static instance: ExpiryService

  private constructor() {}

  static getInstance(): ExpiryService {
    if (!ExpiryService.instance) {
      ExpiryService.instance = new ExpiryService()
    }
    return ExpiryService.instance
  }

  /**
   * Get batches expiring soon
   */
  async getExpiringBatches(daysThreshold = 30): Promise<IBatchExpiryInfo[]> {
    try {
      logger.info('Getting expiring batches', { daysThreshold })
      return await BatchesService.findExpiringBatches(daysThreshold)
    } catch (error) {
      logger.error('Error getting expiring batches', { error })
      throw error
    }
  }

  /**
   * Get expired batches
   */
  async getExpiredBatches(): Promise<IBatchExpiryInfo[]> {
    try {
      logger.info('Getting expired batches')
      return await BatchesService.findExpiredBatches()
    } catch (error) {
      logger.error('Error getting expired batches', { error })
      throw error
    }
  }

  /**
   * Get expiry summary
   */
  async getExpirySummary(daysThreshold = 30): Promise<{
    expiring: number
    expired: number
    active: number
  }> {
    try {
      const expiring = await BatchesService.findExpiringBatches(daysThreshold)
      const expired = await BatchesService.findExpiredBatches()

      return {
        expiring: expiring.length,
        expired: expired.length,
        active: 0, // Will be calculated if needed
      }
    } catch (error) {
      logger.error('Error getting expiry summary', { error })
      throw error
    }
  }
}

export default ExpiryService.getInstance()
