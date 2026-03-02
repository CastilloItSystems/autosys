/**
 * Dead Stock Report Controller
 */

import { Request, Response } from 'express'
import { getDeadStockReport } from './deadStock.service'
import { ApiResponse } from '../../../../shared/utils/api-response'

export const getDeadStockReportHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 50
    const result = await getDeadStockReport(page, limit)
    res
      .status(200)
      .json(
        ApiResponse.paginated(
          result.data,
          result.total,
          page,
          limit,
          'Dead stock items'
        )
      )
  } catch (error: any) {
    res.status(500).json(ApiResponse.error(error.message))
  }
}

export default { getDeadStockReportHandler }
