/**
 * Forecasting Controller
 */

import { Request, Response } from 'express'
import {
  getDemandForecastForItem,
  getAllDemandForecasts,
  calculateForecastAccuracy,
} from './forecasting.service.js'
import { ApiResponse } from '../../../../shared/utils/apiResponse.js'

export const getForecastForItemHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const itemId = req.params.itemId as string
    const empresaId = (req as any).empresaId as string | undefined
    const result = await getDemandForecastForItem(itemId, empresaId, (req as any).prisma)
    ApiResponse.success(res, result, 'Forecast retrieved successfully')
  } catch (error: any) {
    ApiResponse.error(res, error.message, 500)
  }
}

export const getAllForecastsHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 50
    const empresaId = (req as any).empresaId as string | undefined
    const result = await getAllDemandForecasts(page, limit, empresaId, (req as any).prisma)
    res.status(200).json({
      success: true,
      message: 'Demand Forecasts',
      data: result.data,
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

export const getAccuracyHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const itemId = req.params.itemId as string
    const daysBack = parseInt(req.query.daysBack as string) || 30
    const empresaId = (req as any).empresaId as string | undefined
    const result = await calculateForecastAccuracy(itemId, daysBack, empresaId, (req as any).prisma)
    ApiResponse.success(res, result, 'Forecast accuracy calculated successfully')
  } catch (error: any) {
    ApiResponse.error(res, error.message, 500)
  }
}

export default {
  getForecastForItemHandler,
  getAllForecastsHandler,
  getAccuracyHandler,
}
