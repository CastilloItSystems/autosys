// backend/src/features/workshop/laborTimes/laborTimes.routes.ts
import { Router } from 'express'
import { asyncHandler } from '../../../shared/middleware/asyncHandler.middleware.js'
import { authorize } from '../../../shared/middleware/authorize.middleware.js'
import { validateBody, validateQuery } from '../../../shared/middleware/validateRequest.middleware.js'
import { PERMISSIONS } from '../../../shared/constants/permissions.js'
import { startLaborTimeSchema, laborTimeFiltersSchema } from './laborTimes.validation.js'
import * as ctrl from './laborTimes.controller.js'

const router = Router()

router.get('/', authorize(PERMISSIONS.WORKSHOP_VIEW), validateQuery(laborTimeFiltersSchema), asyncHandler(ctrl.getAll))
router.post('/start', authorize(PERMISSIONS.WORKSHOP_UPDATE), validateBody(startLaborTimeSchema), asyncHandler(ctrl.start))
router.get('/:id', authorize(PERMISSIONS.WORKSHOP_VIEW), asyncHandler(ctrl.getOne))
router.patch('/:id/pause', authorize(PERMISSIONS.WORKSHOP_UPDATE), asyncHandler(ctrl.pause))
router.patch('/:id/resume', authorize(PERMISSIONS.WORKSHOP_UPDATE), asyncHandler(ctrl.resume))
router.patch('/:id/finish', authorize(PERMISSIONS.WORKSHOP_UPDATE), asyncHandler(ctrl.finish))
router.patch('/:id/cancel', authorize(PERMISSIONS.WORKSHOP_UPDATE), asyncHandler(ctrl.cancel))

export default router
