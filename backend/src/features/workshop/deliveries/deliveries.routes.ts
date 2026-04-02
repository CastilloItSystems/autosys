// backend/src/features/workshop/deliveries/deliveries.routes.ts
import { Router } from 'express'
import { asyncHandler } from '../../../shared/middleware/asyncHandler.middleware.js'
import { authorize } from '../../../shared/middleware/authorize.middleware.js'
import { validateBody } from '../../../shared/middleware/validateRequest.middleware.js'
import { PERMISSIONS } from '../../../shared/constants/permissions.js'
import * as ctrl from './deliveries.controller.js'
import { createDeliverySchema } from './deliveries.validation.js'

const router = Router()

router.get(
  '/',
  authorize(PERMISSIONS.WORKSHOP_VIEW),
  asyncHandler(ctrl.getAll)
)
router.post(
  '/',
  authorize(PERMISSIONS.WORKSHOP_CREATE),
  validateBody(createDeliverySchema),
  asyncHandler(ctrl.create)
)
router.get(
  '/order/:orderId',
  authorize(PERMISSIONS.WORKSHOP_VIEW),
  asyncHandler(ctrl.getByOrder)
)

export default router
