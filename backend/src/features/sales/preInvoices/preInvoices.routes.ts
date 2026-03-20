// backend/src/features/sales/preInvoices/preInvoices.routes.ts

import { Router } from 'express'
import preInvoicesController from './preInvoices.controller.js'
import { authorize } from '../../../shared/middleware/authorize.middleware.js'
import { validateQuery } from '../../../shared/middleware/validateRequest.middleware.js'
import { preInvoiceFiltersSchema } from './preInvoices.validation.js'
import { PERMISSIONS } from '../../../shared/constants/permissions.js'

const router = Router()

// No POST — PreInvoices are created automatically by Order.approve()

router.get(
  '/',
  authorize(PERMISSIONS.INVOICES_VIEW),
  validateQuery(preInvoiceFiltersSchema),
  preInvoicesController.getAll
)

router.get(
  '/:id',
  authorize(PERMISSIONS.INVOICES_VIEW),
  preInvoicesController.getOne
)

// Status transitions
router.patch(
  '/:id/start-preparation',
  authorize(PERMISSIONS.INVOICES_UPDATE),
  preInvoicesController.startPreparation
)

router.patch(
  '/:id/mark-ready',
  authorize(PERMISSIONS.INVOICES_UPDATE),
  preInvoicesController.markReady
)

router.patch(
  '/:id/mark-paid',
  authorize(PERMISSIONS.INVOICES_APPROVE),
  preInvoicesController.markPaid
)

router.patch(
  '/:id/cancel',
  authorize(PERMISSIONS.INVOICES_UPDATE),
  preInvoicesController.cancel
)

export default router
