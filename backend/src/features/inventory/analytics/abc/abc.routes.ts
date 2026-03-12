/**
 * ABC Analysis Routes
 */

import { Router, Request, Response } from 'express'
import {
  authenticate,
  asyncHandler,
} from '../../../../shared/middleware/index.js'
import { getABCAnalysisHandler } from './abc.controller.js'

const router = Router()

/**
 * GET /api/inventory/analytics/abc?page=1&limit=50
 * Get ABC Analysis with pagination
 */
router.get(
  '/',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    await getABCAnalysisHandler(req, res)
  })
)

export default router
