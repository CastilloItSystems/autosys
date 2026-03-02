/**
 * Forecasting Routes
 */

import { Router, Request, Response } from 'express'
import { authenticate, asyncHandler } from '../../../../middleware'
import {
  getAllForecastsHandler,
  getForecastForItemHandler,
  getAccuracyHandler,
} from './forecasting.controller'

const router = Router()

/**
 * GET /api/inventory/analytics/forecasting?page=1&limit=50
 * Get all demand forecasts with pagination
 */
router.get(
  '/',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    await getAllForecastsHandler(req, res)
  })
)

/**
 * GET /api/inventory/analytics/forecasting/:itemId
 * Get demand forecast for specific item
 */
router.get(
  '/:itemId',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    await getForecastForItemHandler(req, res)
  })
)

/**
 * GET /api/inventory/analytics/forecasting/:itemId/accuracy?daysBack=30
 * Get forecast accuracy for item
 */
router.get(
  '/:itemId/accuracy',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    await getAccuracyHandler(req, res)
  })
)

export default router
