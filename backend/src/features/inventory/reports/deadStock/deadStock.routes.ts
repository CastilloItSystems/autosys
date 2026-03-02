/**
 * Dead Stock Routes
 */

import { Router, Request, Response } from 'express'
import { authenticate, asyncHandler } from '../../../../middleware'
import { getDeadStockReportHandler as getDeadStockReport } from './deadStock.controller'

const router = Router()

/**
 * GET /api/inventory/reports/dead-stock?page=1&limit=50
 * Get dead stock report with pagination
 */
router.get(
  '/',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    await getDeadStockReport(req, res)
  })
)

export default router
