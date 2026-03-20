// backend/src/features/sales/payments/payments.routes.ts

import { Router } from 'express'
import paymentsController from './payments.controller.js'
import { authorize } from '../../../shared/middleware/authorize.middleware.js'
import {
  validateBody,
  validateQuery,
} from '../../../shared/middleware/validateRequest.middleware.js'
import {
  createPaymentSchema,
  paymentFiltersSchema,
} from './payments.validation.js'
import { PERMISSIONS } from '../../../shared/constants/permissions.js'

const router = Router()

router.get(
  '/',
  authorize(PERMISSIONS.PAYMENTS_VIEW),
  validateQuery(paymentFiltersSchema),
  paymentsController.getAll
)

router.get(
  '/:id',
  authorize(PERMISSIONS.PAYMENTS_VIEW),
  paymentsController.getOne
)

router.post(
  '/',
  authorize(PERMISSIONS.PAYMENTS_CREATE),
  validateBody(createPaymentSchema),
  paymentsController.create
)

router.patch(
  '/:id/cancel',
  authorize(PERMISSIONS.PAYMENTS_UPDATE),
  paymentsController.cancel
)

export default router
