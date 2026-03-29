// backend/src/features/workshop/serviceOrders/serviceOrders.routes.ts
import { Router } from 'express'
import { asyncHandler } from '../../../shared/middleware/asyncHandler.middleware.js'
import { authorize } from '../../../shared/middleware/authorize.middleware.js'
import { validateBody, validateQuery } from '../../../shared/middleware/validateRequest.middleware.js'
import { PERMISSIONS } from '../../../shared/constants/permissions.js'
import {
  createServiceOrderSchema,
  updateServiceOrderSchema,
  updateStatusSchema,
  serviceOrderFiltersSchema,
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

export default router
