import { Router } from 'express'
import { asyncHandler } from '../../../shared/middleware/asyncHandler.middleware.js'
import { authorize } from '../../../shared/middleware/authorize.middleware.js'
import {
  validateBody,
  validateQuery,
} from '../../../shared/middleware/validateRequest.middleware.js'
import { PERMISSIONS } from '../../../shared/constants/permissions.js'
import {
  createIngressMotiveSchema,
  updateIngressMotiveSchema,
  ingressMotiveFiltersSchema,
} from './ingressMotives.validation.js'
import * as controller from './ingressMotives.controller.js'

const router = Router()

router.get(
  '/',
  authorize(PERMISSIONS.WORKSHOP_VIEW),
  validateQuery(ingressMotiveFiltersSchema),
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
  validateBody(createIngressMotiveSchema),
  asyncHandler(controller.create)
)
router.put(
  '/:id',
  authorize(PERMISSIONS.WORKSHOP_UPDATE),
  validateBody(updateIngressMotiveSchema),
  asyncHandler(controller.update)
)
router.delete(
  '/:id',
  authorize(PERMISSIONS.WORKSHOP_DELETE),
  asyncHandler(controller.remove)
)

export default router
