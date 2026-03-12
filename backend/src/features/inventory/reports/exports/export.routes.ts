/**
 * Export Routes
 * Handles file exports for all inventory reports
 */

import { Router, Request, Response } from 'express'
import {
  authenticate,
  asyncHandler,
} from '../../../../shared/middleware/index.js'
import { exportReportHandler } from './export.controller.js'

const router = Router()

/**
 * GET /api/inventory/reports/export/:reportType
 * Export report in CSV, Excel, or PDF format
 * Query params:
 *   - format: 'csv' | 'excel' | 'pdf' (default: csv)
 *   - page: number (default: 1)
 *   - limit: number (default: 1000)
 *   - dateFrom: ISO date string (optional)
 *   - dateTo: ISO date string (optional)
 *   - warehouseId: string (optional)
 *   - itemId: string (optional)
 *   - type: string (optional)
 */
router.get(
  '/:reportType',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    await exportReportHandler(req, res)
  })
)

export default router
