// backend/src/features/workshop/workshopReworks/workshopReworks.routes.ts
import { Router } from 'express'
import { asyncHandler } from '../../../shared/middleware/asyncHandler.middleware.js'
import { authorize } from '../../../shared/middleware/authorize.middleware.js'
import { validateBody, validateQuery } from '../../../shared/middleware/validateRequest.middleware.js'
import { PERMISSIONS } from '../../../shared/constants/permissions.js'
import { createReworkSchema, updateReworkSchema, changeReworkStatusSchema, reworkFiltersSchema } from './workshopReworks.validation.js'
import * as ctrl from './workshopReworks.controller.js'

const router = Router()

router.get('/', authorize(PERMISSIONS.WORKSHOP_VIEW), validateQuery(reworkFiltersSchema), asyncHandler(ctrl.getAll))
router.post('/', authorize(PERMISSIONS.WORKSHOP_CREATE), validateBody(createReworkSchema), asyncHandler(ctrl.create))
router.get('/:id', authorize(PERMISSIONS.WORKSHOP_VIEW), asyncHandler(ctrl.getOne))
router.put('/:id', authorize(PERMISSIONS.WORKSHOP_UPDATE), validateBody(updateReworkSchema), asyncHandler(ctrl.update))
router.patch('/:id/status', authorize(PERMISSIONS.WORKSHOP_UPDATE), validateBody(changeReworkStatusSchema), asyncHandler(ctrl.changeStatus))

export default router
