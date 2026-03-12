/**
 * Movements Report Routes
 * Handles inventory movement reports and summaries
 */

import { Router, Request, Response } from 'express'
import {
  authenticate,
  asyncHandler,
} from '../../../../shared/middleware/index.js'
import {
  getMovementsReportHandler,
  getMovementsSummaryHandler,
} from './movements.controller.js'

const router = Router()

/**
 * GET /api/inventory/reports/movements
 * Returns paginated movements with optional filters
 * Query params:
 *   - page: number (default: 1)
 *   - limit: number (default: 50)
 *   - dateFrom: ISO date string
 *   - dateTo: ISO date string
 *   - warehouseId: string (UUID)
 *   - itemId: string (UUID)
 *   - type: string (ENTRADA, SALIDA, etc.)
 */
router.get(
  '/',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    await getMovementsReportHandler(req, res)
  })
)

/**
 * GET /api/inventory/reports/movements/summary
 * Returns summary statistics for movements
 * Query params:
 *   - dateFrom: ISO date string (optional)
 *   - dateTo: ISO date string (optional)
 */
router.get(
  '/summary',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    await getMovementsSummaryHandler(req, res)
  })
)

export default router
