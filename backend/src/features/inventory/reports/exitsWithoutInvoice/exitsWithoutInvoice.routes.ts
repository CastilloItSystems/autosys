/**
 * Exits Without Invoice Routes
 */

import { Router, Request, Response } from 'express'
import {
  authenticate,
  asyncHandler,
} from '../../../../shared/middleware/index.js'
import { getExitsWithoutInvoiceReportHandler as getExitsWithoutInvoiceReport } from './exitsWithoutInvoice.controller.js'

const router = Router()

/**
 * GET /api/inventory/reports/exits-without-invoice?page=1&limit=50
 * Get exits without invoice report with pagination
 */
router.get(
  '/',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    await getExitsWithoutInvoiceReport(req, res)
  })
)

export default router
