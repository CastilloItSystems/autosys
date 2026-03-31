// backend/src/features/workshop/serviceOrderMaterials/serviceOrderMaterials.routes.ts

import { Router } from 'express'
import { asyncHandler } from '../../../shared/middleware/asyncHandler.middleware.js'
import { authorize } from '../../../shared/middleware/authorize.middleware.js'
import {
  validateBody,
  validateQuery,
} from '../../../shared/middleware/validateRequest.middleware.js'
import { PERMISSIONS } from '../../../shared/constants/permissions.js'
import {
  createServiceOrderMaterialSchema,
  updateServiceOrderMaterialSchema,
  materialFiltersSchema,
} from './serviceOrderMaterials.validation.js'
import * as controller from './serviceOrderMaterials.controller.js'

const router = Router()

router.get(
  '/',
  authorize(PERMISSIONS.WORKSHOP_VIEW),
  validateQuery(materialFiltersSchema),
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
  validateBody(createServiceOrderMaterialSchema),
  asyncHandler(controller.create)
)
router.put(
  '/:id',
  authorize(PERMISSIONS.WORKSHOP_UPDATE),
  validateBody(updateServiceOrderMaterialSchema),
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

export default router
