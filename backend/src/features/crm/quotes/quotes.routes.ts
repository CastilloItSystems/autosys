// backend/src/features/crm/quotes/quotes.routes.ts

import { Router } from 'express'
import quotesController from './quotes.controller.js'
import { authorize } from '../../../shared/middleware/authorize.middleware.js'
import { validateBody, validateQuery } from '../../../shared/middleware/validateRequest.middleware.js'
import {
  createQuoteSchema,
  updateQuoteSchema,
  updateQuoteStatusSchema,
  approveQuoteSchema,
  quoteFiltersSchema,
} from './quotes.validation.js'
import { PERMISSIONS } from '../../../shared/constants/permissions.js'

const router = Router()

router.get(
  '/',
  authorize(PERMISSIONS.CRM_QUOTES_VIEW),
  validateQuery(quoteFiltersSchema),
  quotesController.getAll
)

router.post(
  '/',
  authorize(PERMISSIONS.CRM_QUOTES_CREATE),
  validateBody(createQuoteSchema),
  quotesController.create
)

router.get(
  '/:id',
  authorize(PERMISSIONS.CRM_QUOTES_VIEW),
  quotesController.getOne
)

router.put(
  '/:id',
  authorize(PERMISSIONS.CRM_QUOTES_UPDATE),
  validateBody(updateQuoteSchema),
  quotesController.update
)

router.patch(
  '/:id/status',
  authorize(PERMISSIONS.CRM_QUOTES_UPDATE),
  validateBody(updateQuoteStatusSchema),
  quotesController.updateStatus
)

router.patch(
  '/:id/approve',
  authorize(PERMISSIONS.CRM_QUOTES_UPDATE),
  validateBody(approveQuoteSchema),
  quotesController.approve
)

router.post(
  '/:id/revise',
  authorize(PERMISSIONS.CRM_QUOTES_CREATE),
  validateBody(createQuoteSchema),
  quotesController.revise
)

router.delete(
  '/:id',
  authorize(PERMISSIONS.CRM_QUOTES_DELETE),
  quotesController.remove
)

export default router
