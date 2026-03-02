/**
 * Stock Value Routes
 */

import { Router, Request, Response } from 'express'
import { authenticate, asyncHandler } from '../../../../middleware'
import { getStockValueReportHandler as getStockValueReport } from './stockValue.controller'

const router = Router()

/**
 * GET /api/inventory/reports/stock-value?page=1&limit=50
 * Get stock value report with pagination
 */
router.get(
  '/',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    await getStockValueReport(req, res)
  })
)

export default router
