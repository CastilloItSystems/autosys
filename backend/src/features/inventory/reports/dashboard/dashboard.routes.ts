/**
 * Dashboard Routes
 */

import { Router, Request, Response } from 'express'
import {
  authenticate,
  asyncHandler,
} from '../../../../shared/middleware/index.js'
import { getDashboard, getDashboardSummary } from './dashboard.controller.js'

const router = Router()

/**
 * GET /api/inventory/reports/dashboard
 * Get full dashboard metrics
 */
router.get(
  '/',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    await getDashboard(req, res)
  })
)

/**
 * GET /api/inventory/reports/dashboard/summary
 * Get dashboard summary view
 */
router.get(
  '/summary',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    await getDashboardSummary(req, res)
  })
)

export default router
