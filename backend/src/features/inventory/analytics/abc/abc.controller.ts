/**
 * ABC Analysis Controller
 */

import { Request, Response } from 'express'
import { getABCAnalysis } from './abc.service'
import { ApiResponse } from '../../../../shared/utils/api-response'

export const getABCAnalysisHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 50
    const result = await getABCAnalysis(page, limit)
    res
      .status(200)
      .json(
        ApiResponse.paginated(
          result.data,
          result.total,
          page,
          limit,
          'ABC Analysis',
          result.summary
        )
      )
  } catch (error: any) {
    res.status(500).json(ApiResponse.error(error.message))
  }
}

export default { getABCAnalysisHandler }
