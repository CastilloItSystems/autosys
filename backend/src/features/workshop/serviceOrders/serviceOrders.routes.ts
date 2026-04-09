// backend/src/features/workshop/serviceOrders/serviceOrders.routes.ts
import { Router } from 'express'
import { asyncHandler } from '../../../shared/middleware/asyncHandler.middleware.js'
import { authorize } from '../../../shared/middleware/authorize.middleware.js'
import {
  validateBody,
  validateQuery,
} from '../../../shared/middleware/validateRequest.middleware.js'
import { PERMISSIONS } from '../../../shared/constants/permissions.js'
import {
  createServiceOrderSchema,
  updateServiceOrderSchema,
  updateStatusSchema,
  serviceOrderFiltersSchema,
  consolidatedPreInvoiceSchema,
  stalledFiltersSchema,
} from './serviceOrders.validation.js'
import * as ctrl from './serviceOrders.controller.js'

const router = Router()

router.get(
  '/',
  authorize(PERMISSIONS.WORKSHOP_VIEW),
  validateQuery(serviceOrderFiltersSchema),
  asyncHandler(ctrl.getAll)
)

router.post(
  '/',
  authorize(PERMISSIONS.WORKSHOP_CREATE),
  validateBody(createServiceOrderSchema),
  asyncHandler(ctrl.create)
)

// Rutas estáticas ANTES de /:id para que Express no las capture como IDs
router.post(
  '/consolidated-pre-invoice',
  authorize(PERMISSIONS.WORKSHOP_CREATE),
  validateBody(consolidatedPreInvoiceSchema),
  asyncHandler(ctrl.generateConsolidated)
)

router.get(
  '/stalled',
  authorize(PERMISSIONS.WORKSHOP_VIEW),
  validateQuery(stalledFiltersSchema),
  asyncHandler(ctrl.stalled)
)

router.get(
  '/customer/:customerId/pending-billing',
  authorize(PERMISSIONS.WORKSHOP_VIEW),
  asyncHandler(ctrl.pendingBilling)
)

router.get(
  '/:id',
  authorize(PERMISSIONS.WORKSHOP_VIEW),
  asyncHandler(ctrl.getOne)
)

router.put(
  '/:id',
  authorize(PERMISSIONS.WORKSHOP_UPDATE),
  validateBody(updateServiceOrderSchema),
  asyncHandler(ctrl.update)
)

router.patch(
  '/:id/status',
  authorize(PERMISSIONS.WORKSHOP_UPDATE),
  validateBody(updateStatusSchema),
  asyncHandler(ctrl.updateStatus)
)

router.delete(
  '/:id',
  authorize(PERMISSIONS.WORKSHOP_DELETE),
  asyncHandler(ctrl.remove)
)

// FASE 1.2: Quote to ServiceOrder conversion routes
router.post(
  '/from-quote/:quoteId',
  authorize(PERMISSIONS.WORKSHOP_CREATE),
  asyncHandler(ctrl.convertFromQuote)
)

router.get(
  '/:id/quote',
  authorize(PERMISSIONS.WORKSHOP_VIEW),
  asyncHandler(ctrl.getQuoteForServiceOrder)
)

// FASE 2.7: Invoice generation routes
router.post(
  '/:id/generate-invoice',
  authorize(PERMISSIONS.WORKSHOP_CREATE),
  asyncHandler(ctrl.generatePreInvoice)
)

router.post(
  '/bulk-generate-invoices',
  authorize(PERMISSIONS.WORKSHOP_CREATE),
  asyncHandler(ctrl.bulkGenerateInvoices)
)

router.get(
  '/:id/billing',
  authorize(PERMISSIONS.WORKSHOP_VIEW),
  asyncHandler(ctrl.getBillingTrail)
)

// M3: Sincronizar materiales consumidos → ítems facturables
router.post(
  '/:id/sync-materials',
  authorize(PERMISSIONS.WORKSHOP_UPDATE),
  asyncHandler(ctrl.syncMaterials)
)

// F3-12: Conciliación presupuesto vs factura
router.get(
  '/:id/budget-variance',
  authorize(PERMISSIONS.WORKSHOP_VIEW),
  asyncHandler(ctrl.getVariance)
)

export default router
