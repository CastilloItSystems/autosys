/**
 * ABC Analysis Controller
 */

import { Request, Response } from 'express'
import { getABCAnalysis } from './abc.service'
import { ApiResponse } from '../../../../shared/utils/apiResponse'

export const getABCAnalysisHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 50
    const result = await getABCAnalysis(
      page,
      limit,
      (req as any).prisma || undefined
    )
    res.status(200).json({
      success: true,
      message: 'ABC Analysis',
      data: result.data,
      summary: result.summary,
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

export default { getABCAnalysisHandler }
