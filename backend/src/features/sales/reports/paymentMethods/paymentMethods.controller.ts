/**
 * Payment Methods Report Controller
 */

import { Request, Response } from 'express'
import { getPaymentMethodsReport } from './paymentMethods.service.js'
import { ApiResponse } from '../../../../shared/utils/apiResponse.js'

export const getPaymentMethodsReportHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const empresaId = (req as any).empresaId as string | undefined
    const filters = {
      dateFrom: req.query.dateFrom as string | undefined,
      dateTo: req.query.dateTo as string | undefined,
    }
    const result = await getPaymentMethodsReport(
      empresaId,
      (req as any).prisma || undefined,
      filters
    )
    res.status(200).json({
      success: true,
      message: 'Payment methods report',
      data: result.data,
      byCurrency: result.byCurrency,
      summary: result.summary,
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    ApiResponse.error(res, error.message, 500)
  }
}

export default { getPaymentMethodsReportHandler }
