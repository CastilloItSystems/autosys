/**
 * Pending Pre-Invoices (AR Aging) Report Controller
 */

import { Request, Response } from 'express'
import { getPendingInvoicesReport } from './pendingInvoices.service.js'
import { ApiResponse } from '../../../../shared/utils/apiResponse.js'

export const getPendingInvoicesReportHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 50
    const empresaId = (req as any).empresaId as string | undefined
    const result = await getPendingInvoicesReport(
      page,
      limit,
      empresaId,
      (req as any).prisma || undefined
    )
    res.status(200).json({
      success: true,
      message: 'Pending invoices report',
      data: result.data,
      summary: result.summary,
      meta: { page, limit, total: result.total, totalPages: result.totalPages },
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    ApiResponse.error(res, error.message, 500)
  }
}

export default { getPendingInvoicesReportHandler }
