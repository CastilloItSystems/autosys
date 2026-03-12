/**
 * Stock Value Report Controller
 */

import { Request, Response } from 'express'
import { getStockValueReport } from './stockValue.service.js'
import { ApiResponse } from '../../../../shared/utils/apiResponse.js'

export const getStockValueReportHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 50
    const result = await getStockValueReport(
      page,
      limit,
      (req as any).prisma || undefined
    )
    res.status(200).json({
      success: true,
      message: 'Stock value report',
      data: result.data,
      summary: { totalInventoryValue: result.totalInventoryValue },
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages: Math.ceil(result.total / limit),
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    ApiResponse.error(res, error.message, 500)
  }
}

export default { getStockValueReportHandler }
