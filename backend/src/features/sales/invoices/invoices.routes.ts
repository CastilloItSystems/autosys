// backend/src/features/sales/invoices/invoices.routes.ts

import { Router } from 'express'
import invoicesController from './invoices.controller.js'
import { authorize } from '../../../shared/middleware/authorize.middleware.js'
import {
  validateQuery,
  validateBody,
} from '../../../shared/middleware/validateRequest.middleware.js'
import {
  invoiceFiltersSchema,
  cancelInvoiceSchema,
} from './invoices.validation.js'
import { PERMISSIONS } from '../../../shared/constants/permissions.js'

const router = Router()

// No POST — invoices are generated automatically by payment processing

router.get(
  '/',
  authorize(PERMISSIONS.INVOICES_VIEW),
  validateQuery(invoiceFiltersSchema),
  invoicesController.getAll
)

router.get(
  '/:id',
  authorize(PERMISSIONS.INVOICES_VIEW),
  invoicesController.getOne
)

router.patch(
  '/:id/cancel',
  authorize(PERMISSIONS.INVOICES_APPROVE),
  validateBody(cancelInvoiceSchema),
  invoicesController.cancel
)

export default router
