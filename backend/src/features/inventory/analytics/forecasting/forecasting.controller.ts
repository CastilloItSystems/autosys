/**
 * Forecasting Controller
 */

import { Request, Response } from 'express'
import {
  getDemandForecastForItem,
  getAllDemandForecasts,
  calculateForecastAccuracy,
} from './forecasting.service'
import { ApiResponse } from '../../../../shared/utils/ApiResponse'

export const getForecastForItemHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { itemId } = req.params
    const result = await getDemandForecastForItem(itemId)
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
    const result = await getAllDemandForecasts(page, limit)
    ApiResponse.paginated(res, result.data, page, limit, result.total, 'Demand Forecasts')
  } catch (error: any) {
    ApiResponse.error(res, error.message, 500)
  }
}

export const getAccuracyHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { itemId } = req.params
    const daysBack = parseInt(req.query.daysBack as string) || 30
    const accuracy = await calculateForecastAccuracy(itemId, daysBack)
    ApiResponse.success(res, { itemId, accuracy, daysBack }, 'Forecast accuracy calculated successfully')
  } catch (error: any) {
    ApiResponse.error(res, error.message, 500)
  }
}

export default {
  getForecastForItemHandler,
  getAllForecastsHandler,
  getAccuracyHandler,
}
