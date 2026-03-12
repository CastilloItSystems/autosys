/**
 * Low Stock Routes
 */

import { Router, Request, Response } from 'express'
import {
  authenticate,
  asyncHandler,
} from '../../../../shared/middleware/index.js'
import { getLowStockReportHandler as getLowStockReport } from './lowStock.controller.js'

const router = Router()

/**
 * GET /api/inventory/reports/low-stock?page=1&limit=50
 * Get low stock report with pagination
 */
router.get(
  '/',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    await getLowStockReport(req, res)
  })
)

export default router
