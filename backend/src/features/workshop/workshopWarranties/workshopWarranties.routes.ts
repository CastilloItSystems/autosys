// backend/src/features/workshop/workshopWarranties/workshopWarranties.routes.ts
import { Router } from 'express'
import { asyncHandler } from '../../../shared/middleware/asyncHandler.middleware.js'
import { authorize } from '../../../shared/middleware/authorize.middleware.js'
import { validateBody, validateQuery } from '../../../shared/middleware/validateRequest.middleware.js'
import { PERMISSIONS } from '../../../shared/constants/permissions.js'
import {
  createWarrantySchema, updateWarrantySchema,
  updateWarrantyStatusSchema, warrantyFiltersSchema,
} from './workshopWarranties.validation.js'
import * as ctrl from './workshopWarranties.controller.js'

const router = Router()

router.get('/', authorize(PERMISSIONS.WORKSHOP_VIEW), validateQuery(warrantyFiltersSchema), asyncHandler(ctrl.getAll))
router.post('/', authorize(PERMISSIONS.WORKSHOP_CREATE), validateBody(createWarrantySchema), asyncHandler(ctrl.create))
router.get('/:id', authorize(PERMISSIONS.WORKSHOP_VIEW), asyncHandler(ctrl.getOne))
router.put('/:id', authorize(PERMISSIONS.WORKSHOP_UPDATE), validateBody(updateWarrantySchema), asyncHandler(ctrl.update))
router.patch('/:id/status', authorize(PERMISSIONS.WORKSHOP_UPDATE), validateBody(updateWarrantyStatusSchema), asyncHandler(ctrl.updateStatus))

export default router
