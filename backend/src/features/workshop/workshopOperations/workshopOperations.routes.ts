// backend/src/features/workshop/workshopOperations/workshopOperations.routes.ts
import { Router } from 'express'
import { asyncHandler } from '../../../shared/middleware/asyncHandler.middleware.js'
import { authorize } from '../../../shared/middleware/authorize.middleware.js'
import { validateBody, validateQuery } from '../../../shared/middleware/validateRequest.middleware.js'
import { PERMISSIONS } from '../../../shared/constants/permissions.js'
import { createWorkshopOperationSchema, updateWorkshopOperationSchema, workshopOperationFiltersSchema } from './workshopOperations.validation.js'
import * as ctrl from './workshopOperations.controller.js'

const router = Router()

router.get('/', authorize(PERMISSIONS.WORKSHOP_VIEW), validateQuery(workshopOperationFiltersSchema), asyncHandler(ctrl.getAll))
router.post('/', authorize(PERMISSIONS.WORKSHOP_CREATE), validateBody(createWorkshopOperationSchema), asyncHandler(ctrl.create))
router.get('/:id', authorize(PERMISSIONS.WORKSHOP_VIEW), asyncHandler(ctrl.getOne))
router.put('/:id', authorize(PERMISSIONS.WORKSHOP_UPDATE), validateBody(updateWorkshopOperationSchema), asyncHandler(ctrl.update))
router.patch('/:id/toggle-active', authorize(PERMISSIONS.WORKSHOP_UPDATE), asyncHandler(ctrl.toggleActive))
router.delete('/:id', authorize(PERMISSIONS.WORKSHOP_DELETE), asyncHandler(ctrl.remove))

export default router
