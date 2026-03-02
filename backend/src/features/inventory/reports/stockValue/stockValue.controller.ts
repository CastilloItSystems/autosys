/**
 * Stock Value Report Controller
 */

import { Request, Response } from 'express'
import { getStockValueReport } from './stockValue.service'
import { ApiResponse } from '../../../../shared/utils/api-response'

export const getStockValueReportHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 50
    const result = await getStockValueReport(page, limit)
    res
      .status(200)
      .json(
        ApiResponse.paginated(
          {
            items: result.data,
            totalInventoryValue: result.totalInventoryValue,
          },
          result.total,
          page,
          limit,
          'Stock value report'
        )
      )
  } catch (error: any) {
    res.status(500).json(ApiResponse.error(error.message))
  }
}

export default { getStockValueReportHandler }
