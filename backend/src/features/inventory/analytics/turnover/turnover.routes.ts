/**
 * Turnover Routes
 */

import { Router, Request, Response } from 'express'
import { authenticate, asyncHandler } from '../../../../middleware'
import {
  getAllTurnoverMetricsHandler,
  getTurnoverMetricsHandler,
  getItemsByClassificationHandler,
} from './turnover.controller'

const router = Router()

/**
 * GET /api/inventory/analytics/turnover?page=1&limit=50
 * Get all inventory turnover metrics with pagination
 */
router.get(
  '/',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    await getAllTurnoverMetricsHandler(req, res)
  })
)

/**
 * GET /api/inventory/analytics/turnover/:itemId
 * Get turnover metrics for specific item
 */
router.get(
  '/:itemId',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    await getTurnoverMetricsHandler(req, res)
  })
)

/**
 * GET /api/inventory/analytics/turnover/classification/:classification?page=1&limit=50
 * Get items by classification (FAST_MOVING, MODERATE, SLOW_MOVING, STATIC)
 */
router.get(
  '/classification/:classification',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    await getItemsByClassificationHandler(req, res)
  })
)

export default router
