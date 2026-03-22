/**
 * Exits Without Invoice Report Controller
 */

import { Request, Response } from 'express'
import { getExitsWithoutInvoiceReport } from './exitsWithoutInvoice.service.js'
import { ApiResponse } from '../../../../shared/utils/apiResponse.js'

export const getExitsWithoutInvoiceReportHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 50
    const empresaId = (req as any).empresaId as string | undefined
    const result = await getExitsWithoutInvoiceReport(
      page,
      limit,
      empresaId,
      (req as any).prisma || undefined
    )
    res.status(200).json({
      success: true,
      message: 'Exits without invoice',
      data: result.data,
      summary: result.summary,
      meta: {
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

export default { getExitsWithoutInvoiceReportHandler }
