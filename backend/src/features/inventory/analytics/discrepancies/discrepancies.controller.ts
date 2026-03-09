import { Request, Response } from 'express'
import { DiscrepancyAnalyticsService } from './discrepancies.service'
import { ApiResponse } from '../../../../shared/utils/ApiResponse'
import { asyncHandler } from '../../../../shared/middleware/asyncHandler.middleware'

const service = new DiscrepancyAnalyticsService()

export class DiscrepancyAnalyticsController {
  getTopDiscrepancies = asyncHandler(async (req: Request, res: Response) => {
    const limit = Number(req.query.limit) || 5
    const data = await service.getTopDiscrepancies(limit)
    return ApiResponse.success(res, data, 'Top discrepancias obtenidas')
  })
}
