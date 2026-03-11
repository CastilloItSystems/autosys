// backend/src/features/inventory/serialNumbers/tracking/tracking.controller.ts

import { Request, Response } from 'express'
import { asyncHandler } from '../../../../shared/middleware/asyncHandler.middleware'
import { ApiResponse } from '../../../../shared/utils/apiResponse'
import TrackingService from './tracking.service'

export class TrackingController {
  /**
   * GET /api/inventory/serial-numbers/:id/tracking/history
   * Get tracking history for serial number
   */
  getHistory = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string }
    const tracking = await TrackingService.getTrackingHistory(id)
    return ApiResponse.success(res, tracking)
  })

  /**
   * GET /api/inventory/serial-numbers/:id/tracking/summary
   * Get tracking summary
   */
  getSummary = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string }
    const summary = await TrackingService.getTrackingSummary(id)
    return ApiResponse.success(res, summary)
  })

  /**
   * GET /api/inventory/serial-numbers/:id/tracking/journey
   * Trace serial journey
   */
  getJourney = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string }
    const journey = await TrackingService.traceSerialJourney(id)
    return ApiResponse.success(res, {
      serialId: id,
      journey,
    })
  })
}

export default new TrackingController()
