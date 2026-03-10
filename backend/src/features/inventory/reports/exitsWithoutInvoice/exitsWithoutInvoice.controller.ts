/**
 * Exits Without Invoice Report Controller
 */

import { Request, Response } from 'express'
import { getExitsWithoutInvoiceReport } from './exitsWithoutInvoice.service'
import { ApiResponse } from '../../../../shared/utils/ApiResponse'

export const getExitsWithoutInvoiceReportHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 50
    const result = await getExitsWithoutInvoiceReport(page, limit, (req as any).prisma || undefined)
    ApiResponse.paginated(
      res,
      result.data,
      page,
      limit,
      result.total,
      'Exits without invoice'
    )
  } catch (error: any) {
    ApiResponse.error(res, error.message, 500)
  }
}

export default { getExitsWithoutInvoiceReportHandler }
