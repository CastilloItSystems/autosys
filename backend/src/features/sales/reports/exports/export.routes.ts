/**
 * Sales Export Routes
 * GET /api/sales/reports/export/:reportType
 */

import { Router, Request, Response } from 'express'
import { authenticate, asyncHandler } from '../../../../shared/middleware/index.js'
import { exportSalesReportHandler } from './export.controller.js'

const router = Router()

/**
 * GET /api/sales/reports/export/:reportType
 * Export sales report in CSV, Excel, or PDF format
 * Query params:
 *   - format: 'csv' | 'excel' | 'pdf' (default: csv)
 *   - dateFrom, dateTo: ISO date string (optional)
 *   - granularity: 'day' | 'week' | 'month' (for by-period)
 *   - customerId, currency, search (optional filters)
 */
router.get(
  '/:reportType',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    await exportSalesReportHandler(req, res)
  })
)

export default router
