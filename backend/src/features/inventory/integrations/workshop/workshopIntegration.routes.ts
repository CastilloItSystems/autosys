/**
 * Workshop Integration Routes
 */

import { Router, Request, Response } from 'express'
import {
  authenticate,
  asyncHandler,
} from '../../../../shared/middleware/index.js'
import {
  recordConsumptionHandler,
  getMaterialSummaryHandler,
  checkRequirementsHandler,
  completeWorkOrderHandler,
  getConsumptionHistoryHandler,
} from './workshopIntegration.controller.js'

const router = Router()

/**
 * POST /api/inventory/integrations/workshop/:workOrderId/consume
 * Record material consumption for work order
 */
router.post(
  '/:workOrderId/consume',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    await recordConsumptionHandler(req, res)
  })
)

/**
 * GET /api/inventory/integrations/workshop/:workOrderId/summary
 * Get material summary for work order
 */
router.get(
  '/:workOrderId/summary',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    await getMaterialSummaryHandler(req, res)
  })
)

/**
 * POST /api/inventory/integrations/workshop/check-requirements
 * Check material requirements for work order
 */
router.post(
  '/check-requirements',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    await checkRequirementsHandler(req, res)
  })
)

/**
 * POST /api/inventory/integrations/workshop/:workOrderId/complete
 * Complete work order
 */
router.post(
  '/:workOrderId/complete',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    await completeWorkOrderHandler(req, res)
  })
)

/**
 * GET /api/inventory/integrations/workshop/history?page=1&limit=50
 * Get work order consumption history
 */
router.get(
  '/history',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    await getConsumptionHistoryHandler(req, res)
  })
)

export default router
