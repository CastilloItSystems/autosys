/**
 * Exits Without Invoice Report Controller
 */

import { Request, Response } from 'express'
import { getExitsWithoutInvoiceReport } from './exitsWithoutInvoice.service'
import { ApiResponse } from '../../../../shared/utils/api-response'

export const getExitsWithoutInvoiceReportHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 50
    const result = await getExitsWithoutInvoiceReport(page, limit)
    res
      .status(200)
      .json(
        ApiResponse.paginated(
          result.data,
          result.total,
          page,
          limit,
          'Exits without invoice'
        )
      )
  } catch (error: any) {
    res.status(500).json(ApiResponse.error(error.message))
  }
}

export default { getExitsWithoutInvoiceReportHandler }
