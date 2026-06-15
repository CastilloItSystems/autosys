// backend/src/features/workshop/postRepairScans/postRepairScans.routes.ts
import { Router } from 'express'
import { asyncHandler } from '../../../shared/middleware/asyncHandler.middleware.js'
import { authorize } from '../../../shared/middleware/authorize.middleware.js'
import { validateBody } from '../../../shared/middleware/validateRequest.middleware.js'
import { PERMISSIONS } from '../../../shared/constants/permissions.js'
import {
  createPostRepairScanSchema,
  updatePostRepairScanSchema,
} from './postRepairScans.validation.js'
import * as controller from './postRepairScans.controller.js'

const router = Router()

router.get('/', authorize(PERMISSIONS.WORKSHOP_VIEW), asyncHandler(controller.list))
router.get('/:id', authorize(PERMISSIONS.WORKSHOP_VIEW), asyncHandler(controller.getById))
router.post(
  '/',
  authorize(PERMISSIONS.WORKSHOP_CREATE),
  validateBody(createPostRepairScanSchema),
  asyncHandler(controller.create)
)
router.put(
  '/:id',
  authorize(PERMISSIONS.WORKSHOP_UPDATE),
  validateBody(updatePostRepairScanSchema),
  asyncHandler(controller.update)
)
router.delete(
  '/:id',
  authorize(PERMISSIONS.WORKSHOP_DELETE),
  asyncHandler(controller.remove)
)

export default router
