/**
 * Dead Stock Report Controller
 */

import { Request, Response } from 'express'
import { getDeadStockReport } from './deadStock.service.js'
import { ApiResponse } from '../../../../shared/utils/apiResponse.js'

export const getDeadStockReportHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 50
    const empresaId = (req as any).empresaId as string | undefined
    const result = await getDeadStockReport(
      page,
      limit,
      empresaId,
      (req as any).prisma || undefined
    )
    ApiResponse.paginated(
      res,
      result.data,
      page,
      limit,
      result.total,
      'Dead stock items'
    )
  } catch (error: any) {
    ApiResponse.error(res, error.message, 500)
  }
}

export default { getDeadStockReportHandler }
