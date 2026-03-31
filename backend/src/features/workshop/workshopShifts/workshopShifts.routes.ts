// backend/src/features/workshop/workshopShifts/workshopShifts.routes.ts
import { Router } from 'express'
import { asyncHandler } from '../../../shared/middleware/asyncHandler.middleware.js'
import { authorize } from '../../../shared/middleware/authorize.middleware.js'
import { validateBody, validateQuery } from '../../../shared/middleware/validateRequest.middleware.js'
import { PERMISSIONS } from '../../../shared/constants/permissions.js'
import { createShiftSchema, updateShiftSchema, shiftFiltersSchema } from './workshopShifts.validation.js'
import * as ctrl from './workshopShifts.controller.js'

const router = Router()

router.get('/', authorize(PERMISSIONS.WORKSHOP_VIEW), validateQuery(shiftFiltersSchema), asyncHandler(ctrl.getAll))
router.post('/', authorize(PERMISSIONS.WORKSHOP_CREATE), validateBody(createShiftSchema), asyncHandler(ctrl.create))
router.get('/:id', authorize(PERMISSIONS.WORKSHOP_VIEW), asyncHandler(ctrl.getOne))
router.put('/:id', authorize(PERMISSIONS.WORKSHOP_UPDATE), validateBody(updateShiftSchema), asyncHandler(ctrl.update))
router.patch('/:id/toggle-active', authorize(PERMISSIONS.WORKSHOP_UPDATE), asyncHandler(ctrl.toggleActive))

export default router
