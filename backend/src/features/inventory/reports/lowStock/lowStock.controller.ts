/**
 * Low Stock Report Controller
 */

import { Request, Response } from 'express'
import { getLowStockReport } from './lowStock.service.js'
import { ApiResponse } from '../../../../shared/utils/apiResponse.js'

export const getLowStockReportHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 50
    const result = await getLowStockReport(
      page,
      limit,
      (req as any).prisma || undefined
    )
    ApiResponse.paginated(
      res,
      result.data,
      page,
      limit,
      result.total,
      'Low stock items'
    )
  } catch (error: any) {
    ApiResponse.error(res, error.message, 500)
  }
}

export default { getLowStockReportHandler }
