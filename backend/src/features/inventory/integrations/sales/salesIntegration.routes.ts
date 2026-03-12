/**
 * Sales Integration Routes
 */

import { Router, Request, Response } from 'express'
import {
  authenticate,
  asyncHandler,
} from '../../../../shared/middleware/index.js'
import {
  linkToPreInvoiceHandler,
  linkToSalesOrderHandler,
  getFulfillmentStatusHandler,
  getPendingExitsHandler,
  confirmShipmentHandler,
  getSalesMetricsHandler,
} from './salesIntegration.controller.js'

const router = Router()

/**
 * POST /api/inventory/integrations/sales/:exitNoteId/pre-invoice/:preInvoiceId
 * Link exit note to pre-invoice
 */
router.post(
  '/:exitNoteId/pre-invoice',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    await linkToPreInvoiceHandler(req, res)
  })
)

/**
 * POST /api/inventory/integrations/sales/:exitNoteId/sales-order
 * Link exit note to sales order and create shipment
 */
router.post(
  '/:exitNoteId/sales-order',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    await linkToSalesOrderHandler(req, res)
  })
)

/**
 * GET /api/inventory/integrations/sales/:salesOrderId/fulfillment
 * Get sales order fulfillment status
 */
router.get(
  '/:salesOrderId/fulfillment',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    await getFulfillmentStatusHandler(req, res)
  })
)

/**
 * GET /api/inventory/integrations/sales/pending?page=1&limit=50
 * Get pending exit notes for sales orders
 */
router.get(
  '/pending',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    await getPendingExitsHandler(req, res)
  })
)

/**
 * POST /api/inventory/integrations/sales/:exitNoteId/confirm
 * Confirm shipment
 */
router.post(
  '/:exitNoteId/confirm',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    await confirmShipmentHandler(req, res)
  })
)

/**
 * GET /api/inventory/integrations/sales/metrics?startDate=&endDate=
 * Get sales metrics
 */
router.get(
  '/metrics',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    await getSalesMetricsHandler(req, res)
  })
)

export default router
