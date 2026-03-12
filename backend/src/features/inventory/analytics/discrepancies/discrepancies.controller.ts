import { Request, Response } from 'express'
import { DiscrepancyAnalyticsService } from './discrepancies.service.js'
import { ApiResponse } from '../../../../shared/utils/apiResponse.js'
import { asyncHandler } from '../../../../shared/middleware/asyncHandler.middleware.js'

const service = new DiscrepancyAnalyticsService()

export class DiscrepancyAnalyticsController {
  getTopDiscrepancies = asyncHandler(async (req: Request, res: Response) => {
    const limit = Number(req.query.limit) || 5
    const data = await service.getTopDiscrepancies(limit)
    return ApiResponse.success(res, data, 'Top discrepancias obtenidas')
  })
}
