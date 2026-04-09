// backend/src/features/workshop/serviceTypes/serviceTypes.routes.ts
import { Router } from 'express'
import { asyncHandler } from '../../../shared/middleware/asyncHandler.middleware.js'
import { authorize } from '../../../shared/middleware/authorize.middleware.js'
import { validateBody, validateQuery } from '../../../shared/middleware/validateRequest.middleware.js'
import { PERMISSIONS } from '../../../shared/constants/permissions.js'
import { createServiceTypeSchema, updateServiceTypeSchema, serviceTypeFiltersSchema } from './serviceTypes.validation.js'
import * as ctrl from './serviceTypes.controller.js'

const router = Router()

router.get('/', authorize(PERMISSIONS.WORKSHOP_VIEW), validateQuery(serviceTypeFiltersSchema), asyncHandler(ctrl.getAll))
router.post('/', authorize(PERMISSIONS.WORKSHOP_CREATE), validateBody(createServiceTypeSchema), asyncHandler(ctrl.create))
router.get('/:id', authorize(PERMISSIONS.WORKSHOP_VIEW), asyncHandler(ctrl.getOne))
router.put('/:id', authorize(PERMISSIONS.WORKSHOP_UPDATE), validateBody(updateServiceTypeSchema), asyncHandler(ctrl.update))
router.patch('/:id/toggle-active', authorize(PERMISSIONS.WORKSHOP_UPDATE), asyncHandler(ctrl.toggleActive))
router.delete('/:id', authorize(PERMISSIONS.WORKSHOP_DELETE), asyncHandler(ctrl.remove))

export default router
