/**
 * Order Pipeline Report Controller
 */

import { Request, Response } from 'express'
import { getOrderPipelineReport } from './orderPipeline.service.js'
import { ApiResponse } from '../../../../shared/utils/apiResponse.js'

export const getOrderPipelineReportHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const empresaId = (req as any).empresaId as string | undefined
    const result = await getOrderPipelineReport(empresaId, (req as any).prisma || undefined)
    res.status(200).json({
      success: true,
      message: 'Order pipeline report',
      data: result,
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    ApiResponse.error(res, error.message, 500)
  }
}

export default { getOrderPipelineReportHandler }
