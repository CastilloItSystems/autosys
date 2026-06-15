// backend/src/features/workshop/roadTests/roadTests.routes.ts
import { Router } from 'express'
import { asyncHandler } from '../../../shared/middleware/asyncHandler.middleware.js'
import { authorize } from '../../../shared/middleware/authorize.middleware.js'
import { validateBody } from '../../../shared/middleware/validateRequest.middleware.js'
import { PERMISSIONS } from '../../../shared/constants/permissions.js'
import {
  createRoadTestSchema,
  updateRoadTestSchema,
  authorizeSchema,
  clientAuthorizeSchema,
  departSchema,
  returnSchema,
} from './roadTests.validation.js'
import * as controller from './roadTests.controller.js'

const router = Router()

router.get('/', authorize(PERMISSIONS.WORKSHOP_VIEW), asyncHandler(controller.list))
router.get('/:id', authorize(PERMISSIONS.WORKSHOP_VIEW), asyncHandler(controller.getById))
router.post(
  '/',
  authorize(PERMISSIONS.WORKSHOP_CREATE),
  validateBody(createRoadTestSchema),
  asyncHandler(controller.create)
)
router.put(
  '/:id',
  authorize(PERMISSIONS.WORKSHOP_UPDATE),
  validateBody(updateRoadTestSchema),
  asyncHandler(controller.update)
)
router.patch(
  '/:id/authorize',
  authorize(PERMISSIONS.WORKSHOP_UPDATE),
  validateBody(authorizeSchema),
  asyncHandler(controller.authorize)
)
router.patch(
  '/:id/client-authorize',
  authorize(PERMISSIONS.WORKSHOP_UPDATE),
  validateBody(clientAuthorizeSchema),
  asyncHandler(controller.authorizeClient)
)
router.patch(
  '/:id/depart',
  authorize(PERMISSIONS.WORKSHOP_UPDATE),
  validateBody(departSchema),
  asyncHandler(controller.depart)
)
router.patch(
  '/:id/return',
  authorize(PERMISSIONS.WORKSHOP_UPDATE),
  validateBody(returnSchema),
  asyncHandler(controller.returnVehicle)
)
router.patch(
  '/:id/cancel',
  authorize(PERMISSIONS.WORKSHOP_UPDATE),
  asyncHandler(controller.cancel)
)

export default router
