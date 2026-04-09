// backend/src/features/workshop/workshopBranches/workshopBranches.routes.ts
import { Router } from 'express'
import { asyncHandler } from '../../../shared/middleware/asyncHandler.middleware.js'
import { authorize } from '../../../shared/middleware/authorize.middleware.js'
import { validateBody, validateQuery } from '../../../shared/middleware/validateRequest.middleware.js'
import { PERMISSIONS } from '../../../shared/constants/permissions.js'
import { createBranchSchema, updateBranchSchema, branchFiltersSchema } from './workshopBranches.validation.js'
import * as ctrl from './workshopBranches.controller.js'

const router = Router()

router.get('/', authorize(PERMISSIONS.WORKSHOP_VIEW), validateQuery(branchFiltersSchema), asyncHandler(ctrl.getAll))
router.post('/', authorize(PERMISSIONS.WORKSHOP_CREATE), validateBody(createBranchSchema), asyncHandler(ctrl.create))
router.get('/:id', authorize(PERMISSIONS.WORKSHOP_VIEW), asyncHandler(ctrl.getOne))
router.put('/:id', authorize(PERMISSIONS.WORKSHOP_UPDATE), validateBody(updateBranchSchema), asyncHandler(ctrl.update))
router.patch('/:id/toggle-active', authorize(PERMISSIONS.WORKSHOP_UPDATE), asyncHandler(ctrl.toggleActive))

export default router
