/**
 * Forecasting Controller
 */

import { Request, Response } from 'express'
import {
  getDemandForecastForItem,
  getAllDemandForecasts,
  calculateForecastAccuracy,
} from './forecasting.service'
import { ApiResponse } from '../../../../shared/utils/api-response'

export const getForecastForItemHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { itemId } = req.params
    const result = await getDemandForecastForItem(itemId)
    res
      .status(200)
      .json(ApiResponse.success(result, 'Forecast retrieved successfully'))
  } catch (error: any) {
    res.status(500).json(ApiResponse.error(error.message))
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
    res
      .status(200)
      .json(
        ApiResponse.paginated(
          result.data,
          result.total,
          page,
          limit,
          'Demand Forecasts'
        )
      )
  } catch (error: any) {
    res.status(500).json(ApiResponse.error(error.message))
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
    res
      .status(200)
      .json(
        ApiResponse.success(
          { itemId, accuracy, daysBack },
          'Forecast accuracy calculated successfully'
        )
      )
  } catch (error: any) {
    res.status(500).json(ApiResponse.error(error.message))
  }
}

export default {
  getForecastForItemHandler,
  getAllForecastsHandler,
  getAccuracyHandler,
}
