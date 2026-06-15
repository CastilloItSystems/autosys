// backend/src/features/workshop/materialSignatures/materialSignatures.routes.ts
import { Router } from 'express'
import { asyncHandler } from '../../../shared/middleware/asyncHandler.middleware.js'
import { authorize } from '../../../shared/middleware/authorize.middleware.js'
import { validateBody } from '../../../shared/middleware/validateRequest.middleware.js'
import { PERMISSIONS } from '../../../shared/constants/permissions.js'
import { createMaterialSignatureSchema } from './materialSignatures.validation.js'
import * as controller from './materialSignatures.controller.js'

const router = Router()

router.get(
  '/materials/:materialId',
  authorize(PERMISSIONS.WORKSHOP_VIEW),
  asyncHandler(controller.list)
)

router.get(
  '/materials/:materialId/status',
  authorize(PERMISSIONS.WORKSHOP_VIEW),
  asyncHandler(controller.status)
)

router.post(
  '/',
  authorize(PERMISSIONS.WORKSHOP_UPDATE),
  validateBody(createMaterialSignatureSchema),
  asyncHandler(controller.create)
)

router.delete(
  '/:id',
  authorize(PERMISSIONS.WORKSHOP_UPDATE),
  asyncHandler(controller.remove)
)

export default router
