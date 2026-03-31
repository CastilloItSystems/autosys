// backend/src/features/workshop/receptions/receptions.routes.ts
import { Router } from 'express'
import { asyncHandler } from '../../../shared/middleware/asyncHandler.middleware.js'
import { authorize } from '../../../shared/middleware/authorize.middleware.js'
import { validateBody, validateQuery } from '../../../shared/middleware/validateRequest.middleware.js'
import { PERMISSIONS } from '../../../shared/constants/permissions.js'
import { createReceptionSchema, updateReceptionSchema, receptionFiltersSchema, changeReceptionStatusSchema } from './receptions.validation.js'
import * as ctrl from './receptions.controller.js'

const router = Router()

router.get('/', authorize(PERMISSIONS.WORKSHOP_VIEW), validateQuery(receptionFiltersSchema), asyncHandler(ctrl.getAll))
router.post('/', authorize(PERMISSIONS.WORKSHOP_CREATE), validateBody(createReceptionSchema), asyncHandler(ctrl.create))
router.get('/:id', authorize(PERMISSIONS.WORKSHOP_VIEW), asyncHandler(ctrl.getOne))
router.put('/:id', authorize(PERMISSIONS.WORKSHOP_UPDATE), validateBody(updateReceptionSchema), asyncHandler(ctrl.update))
router.patch('/:id/status', authorize(PERMISSIONS.WORKSHOP_UPDATE), validateBody(changeReceptionStatusSchema), asyncHandler(ctrl.changeStatus))
router.delete('/:id', authorize(PERMISSIONS.WORKSHOP_DELETE), asyncHandler(ctrl.remove))

export default router
