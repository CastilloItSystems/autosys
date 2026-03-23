/**
 * Sales by Period Report Controller
 */

import { Request, Response } from 'express'
import { getByPeriodReport } from './byPeriod.service.js'
import { ApiResponse } from '../../../../shared/utils/apiResponse.js'

export const getByPeriodReportHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 50
    const empresaId = (req as any).empresaId as string | undefined
    const filters = {
      dateFrom: req.query.dateFrom as string | undefined,
      dateTo: req.query.dateTo as string | undefined,
      granularity: (req.query.granularity as 'day' | 'week' | 'month') || 'day',
      customerId: req.query.customerId as string | undefined,
      currency: req.query.currency as string | undefined,
    }
    const result = await getByPeriodReport(
      page,
      limit,
      empresaId,
      (req as any).prisma || undefined,
      filters
    )
    res.status(200).json({
      success: true,
      message: 'Sales by period',
      data: result.data,
      summary: result.summary,
      meta: { page, limit, total: result.total, totalPages: result.totalPages },
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    ApiResponse.error(res, error.message, 500)
  }
}

export default { getByPeriodReportHandler }
