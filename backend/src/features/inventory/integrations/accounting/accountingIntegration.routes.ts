/**
 * Accounting Integration Routes
 */

import { Router, Request, Response } from 'express'
import {
  authenticate,
  asyncHandler,
} from '../../../../shared/middleware/index.js'
import {
  postMovementHandler,
  allocatCostHandler,
  getCostByCenterHandler,
  getValuationHandler,
} from './accountingIntegration.controller.js'

const router = Router()

/**
 * POST /api/inventory/integrations/accounting/:movementId/gl
 * Post movement to general ledger
 */
router.post(
  '/:movementId/gl',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    await postMovementHandler(req, res)
  })
)

/**
 * POST /api/inventory/integrations/accounting/:movementId/allocate
 * Allocate cost to cost centers
 */
router.post(
  '/:movementId/allocate',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    await allocatCostHandler(req, res)
  })
)

/**
 * GET /api/inventory/integrations/accounting/costs?startDate=&endDate=
 * Get costs by cost center
 */
router.get(
  '/costs',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    await getCostByCenterHandler(req, res)
  })
)

/**
 * GET /api/inventory/integrations/accounting/valuation
 * Get inventory valuation for financial reporting
 */
router.get(
  '/valuation',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    await getValuationHandler(req, res)
  })
)

export default router
