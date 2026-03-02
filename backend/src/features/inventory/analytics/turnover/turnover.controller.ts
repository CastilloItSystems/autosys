/**
 * Turnover Controller
 */

import { Request, Response } from 'express'
import {
  getTurnoverMetricsForItem,
  getAllTurnoverMetrics,
  getItemsByClassification,
} from './turnover.service'
import { ApiResponse } from '../../../../shared/utils/api-response'

export const getTurnoverMetricsHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { itemId } = req.params
    const result = await getTurnoverMetricsForItem(itemId)
    res
      .status(200)
      .json(
        ApiResponse.success(result, 'Turnover metrics retrieved successfully')
      )
  } catch (error: any) {
    res.status(500).json(ApiResponse.error(error.message))
  }
}

export const getAllTurnoverMetricsHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 50
    const result = await getAllTurnoverMetrics(page, limit)
    res
      .status(200)
      .json(
        ApiResponse.paginated(
          result.data,
          result.total,
          page,
          limit,
          'Inventory Turnover Metrics'
        )
      )
  } catch (error: any) {
    res.status(500).json(ApiResponse.error(error.message))
  }
}

export const getItemsByClassificationHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { classification } = req.params
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 50

    const valid = ['FAST_MOVING', 'MODERATE', 'SLOW_MOVING', 'STATIC']
    if (!valid.includes(classification)) {
      res.status(400).json(ApiResponse.error('Invalid classification'))
      return
    }

    const result = await getItemsByClassification(
      classification as any,
      page,
      limit
    )
    res
      .status(200)
      .json(
        ApiResponse.paginated(
          result.data,
          result.total,
          page,
          limit,
          `${classification} Items`
        )
      )
  } catch (error: any) {
    res.status(500).json(ApiResponse.error(error.message))
  }
}

export default {
  getTurnoverMetricsHandler,
  getAllTurnoverMetricsHandler,
  getItemsByClassificationHandler,
}
