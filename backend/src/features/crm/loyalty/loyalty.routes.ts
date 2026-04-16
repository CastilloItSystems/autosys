import { Router } from 'express'
import loyaltyController from './loyalty.controller.js'
import { authorize } from '../../../shared/middleware/authorize.middleware.js'
import { validateBody, validateQuery } from '../../../shared/middleware/validateRequest.middleware.js'
import { createLoyaltyRecordSchema, loyaltyFiltersSchema } from './loyalty.validation.js'
import { PERMISSIONS } from '../../../shared/constants/permissions.js'

const router = Router()

router.get(
  '/',
  authorize(PERMISSIONS.CRM_LOYALTY_VIEW),
  validateQuery(loyaltyFiltersSchema),
  loyaltyController.getAll
)

router.post(
  '/',
  authorize(PERMISSIONS.CRM_LOYALTY_CREATE),
  validateBody(createLoyaltyRecordSchema),
  loyaltyController.create
)

export default router
