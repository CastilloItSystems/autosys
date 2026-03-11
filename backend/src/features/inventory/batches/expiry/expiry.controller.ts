// backend/src/features/inventory/batches/expiry/expiry.controller.ts

import { Request, Response } from 'express'
import { asyncHandler } from '../../../../shared/middleware/asyncHandler.middleware'
import { ApiResponse } from '../../../../shared/utils/apiResponse'
import ExpiryService from './expiry.service'

export class ExpiryController {
  /**
   * GET /api/inventory/batches/expiry/expiring
   * Get batches expiring soon
   */
  getExpiringBatches = asyncHandler(async (req: Request, res: Response) => {
    const { daysThreshold = 30 } = req.query

    const batches = await ExpiryService.getExpiringBatches(
      Number(daysThreshold)
    )

    return ApiResponse.success(res, { batches }, 'Expiring batches retrieved')
  })

  /**
   * GET /api/inventory/batches/expiry/expired
   * Get expired batches
   */
  getExpiredBatches = asyncHandler(async (req: Request, res: Response) => {
    const batches = await ExpiryService.getExpiredBatches()

    return ApiResponse.success(res, { batches }, 'Expired batches retrieved')
  })

  /**
   * GET /api/inventory/batches/expiry/summary
   * Get expiry summary
   */
  getSummary = asyncHandler(async (req: Request, res: Response) => {
    const { daysThreshold = 30 } = req.query

    const summary = await ExpiryService.getExpirySummary(Number(daysThreshold))

    ApiResponse.success(res, summary, 'Expiry summary retrieved successfully')
  })
}

export default new ExpiryController()
