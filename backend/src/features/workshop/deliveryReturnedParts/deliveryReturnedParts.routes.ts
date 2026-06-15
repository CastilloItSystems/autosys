// backend/src/features/workshop/deliveryReturnedParts/deliveryReturnedParts.routes.ts
import { Router } from 'express'
import { asyncHandler } from '../../../shared/middleware/asyncHandler.middleware.js'
import { authorize } from '../../../shared/middleware/authorize.middleware.js'
import { validateBody } from '../../../shared/middleware/validateRequest.middleware.js'
import { PERMISSIONS } from '../../../shared/constants/permissions.js'
import {
  createReturnedPartSchema,
  updateReturnedPartSchema,
} from './deliveryReturnedParts.validation.js'
import * as controller from './deliveryReturnedParts.controller.js'

const router = Router()

router.get(
  '/by-delivery/:deliveryId',
  authorize(PERMISSIONS.WORKSHOP_VIEW),
  asyncHandler(controller.listByDelivery)
)
router.post(
  '/',
  authorize(PERMISSIONS.WORKSHOP_UPDATE),
  validateBody(createReturnedPartSchema),
  asyncHandler(controller.create)
)
router.put(
  '/:id',
  authorize(PERMISSIONS.WORKSHOP_UPDATE),
  validateBody(updateReturnedPartSchema),
  asyncHandler(controller.update)
)
router.delete(
  '/:id',
  authorize(PERMISSIONS.WORKSHOP_UPDATE),
  asyncHandler(controller.remove)
)

export default router
