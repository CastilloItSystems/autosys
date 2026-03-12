/**
 * Turnover Controller
 */

import { Request, Response } from 'express'
import {
  getTurnoverMetricsForItem,
  getAllTurnoverMetrics,
  getItemsByClassification,
} from './turnover.service.js'
import { ApiResponse } from '../../../../shared/utils/apiResponse.js'

export const getTurnoverMetricsHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { itemId } = req.params
    const result = await getTurnoverMetricsForItem(itemId)
    ApiResponse.success(res, result, 'Turnover metrics retrieved successfully')
  } catch (error: any) {
    ApiResponse.error(res, error.message, 500)
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
    res.status(200).json({
      success: true,
      message: 'Inventory Turnover Metrics',
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
      ApiResponse.error(res, 'Invalid classification', 400)
      return
    }

    const result = await getItemsByClassification(
      classification as any,
      page,
      limit
    )
    res.status(200).json({
      success: true,
      message: `${classification} Items`,
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

export default {
  getTurnoverMetricsHandler,
  getAllTurnoverMetricsHandler,
  getItemsByClassificationHandler,
}
