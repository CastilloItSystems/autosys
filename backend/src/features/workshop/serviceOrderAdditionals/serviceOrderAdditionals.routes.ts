// backend/src/features/workshop/serviceOrderAdditionals/serviceOrderAdditionals.routes.ts

import { Router } from 'express'
import { asyncHandler } from '../../../shared/middleware/asyncHandler.middleware.js'
import { authorize } from '../../../shared/middleware/authorize.middleware.js'
import {
  validateBody,
  validateQuery,
} from '../../../shared/middleware/validateRequest.middleware.js'
import { PERMISSIONS } from '../../../shared/constants/permissions.js'
import {
  createServiceOrderAdditionalSchema,
  updateServiceOrderAdditionalSchema,
  additionalFiltersSchema,
} from './serviceOrderAdditionals.validation.js'
import * as controller from './serviceOrderAdditionals.controller.js'
import { createAdditionalItemSchema, updateAdditionalItemSchema } from './serviceOrderAdditionals.validation.js'

const router = Router()

router.get(
  '/',
  authorize(PERMISSIONS.WORKSHOP_VIEW),
  validateQuery(additionalFiltersSchema),
  asyncHandler(controller.getAll)
)
router.get(
  '/:id',
  authorize(PERMISSIONS.WORKSHOP_VIEW),
  asyncHandler(controller.getById)
)
router.post(
  '/',
  authorize(PERMISSIONS.WORKSHOP_CREATE),
  validateBody(createServiceOrderAdditionalSchema),
  asyncHandler(controller.create)
)
router.put(
  '/:id',
  authorize(PERMISSIONS.WORKSHOP_UPDATE),
  validateBody(updateServiceOrderAdditionalSchema),
  asyncHandler(controller.update)
)
router.delete(
  '/:id',
  authorize(PERMISSIONS.WORKSHOP_DELETE),
  asyncHandler(controller.remove)
)
router.patch(
  '/:id/status',
  authorize(PERMISSIONS.WORKSHOP_UPDATE),
  asyncHandler(controller.updateStatus)
)

// Additional Items
router.get('/:id/items', authorize(PERMISSIONS.WORKSHOP_VIEW), asyncHandler(controller.getAdditionalItems))
router.post('/:id/items', authorize(PERMISSIONS.WORKSHOP_CREATE), validateBody(createAdditionalItemSchema), asyncHandler(controller.createAdditionalItem))
router.put('/:id/items/:itemId', authorize(PERMISSIONS.WORKSHOP_UPDATE), validateBody(updateAdditionalItemSchema), asyncHandler(controller.updateAdditionalItem))
router.delete('/:id/items/:itemId', authorize(PERMISSIONS.WORKSHOP_DELETE), asyncHandler(controller.deleteAdditionalItem))

export default router
