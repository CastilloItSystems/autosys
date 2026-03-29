// backend/src/features/workshop/qualityChecks/qualityChecks.routes.ts
import { Router } from 'express'
import { asyncHandler } from '../../../shared/middleware/asyncHandler.middleware.js'
import { authorize } from '../../../shared/middleware/authorize.middleware.js'
import { validateBody } from '../../../shared/middleware/validateRequest.middleware.js'
import { PERMISSIONS } from '../../../shared/constants/permissions.js'
import { createQualityCheckSchema, submitQualityCheckSchema } from './qualityChecks.validation.js'
import * as ctrl from './qualityChecks.controller.js'

const router = Router()

// Obtener QC por OT (desde la vista de la OT)
router.get('/by-order/:serviceOrderId', authorize(PERMISSIONS.WORKSHOP_VIEW), asyncHandler(ctrl.getByServiceOrder))
// CRUD directo por ID
router.post('/', authorize(PERMISSIONS.WORKSHOP_UPDATE), validateBody(createQualityCheckSchema), asyncHandler(ctrl.create))
router.get('/:id', authorize(PERMISSIONS.WORKSHOP_VIEW), asyncHandler(ctrl.getOne))
router.patch('/:id/submit', authorize(PERMISSIONS.WORKSHOP_UPDATE), validateBody(submitQualityCheckSchema), asyncHandler(ctrl.submit))

export default router
