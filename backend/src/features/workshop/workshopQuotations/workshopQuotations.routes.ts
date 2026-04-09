// backend/src/features/workshop/workshopQuotations/workshopQuotations.routes.ts
import { Router } from 'express'
import { asyncHandler } from '../../../shared/middleware/asyncHandler.middleware.js'
import { authorize } from '../../../shared/middleware/authorize.middleware.js'
import { validateBody, validateQuery } from '../../../shared/middleware/validateRequest.middleware.js'
import { PERMISSIONS } from '../../../shared/constants/permissions.js'
import {
  createQuotationSchema, updateQuotationSchema, updateQuotationStatusSchema,
  registerApprovalSchema, convertToSOSchema, quotationFiltersSchema,
} from './workshopQuotations.validation.js'
import * as ctrl from './workshopQuotations.controller.js'

const router = Router()

router.get('/',       authorize(PERMISSIONS.WORKSHOP_VIEW),   validateQuery(quotationFiltersSchema),      asyncHandler(ctrl.getAll))
router.post('/',      authorize(PERMISSIONS.WORKSHOP_CREATE), validateBody(createQuotationSchema),        asyncHandler(ctrl.create))
router.get('/:id',    authorize(PERMISSIONS.WORKSHOP_VIEW),                                               asyncHandler(ctrl.getOne))
router.put('/:id',    authorize(PERMISSIONS.WORKSHOP_UPDATE), validateBody(updateQuotationSchema),        asyncHandler(ctrl.update))
router.patch('/:id/status',  authorize(PERMISSIONS.WORKSHOP_UPDATE), validateBody(updateQuotationStatusSchema), asyncHandler(ctrl.updateStatus))
router.post('/:id/approve',  authorize(PERMISSIONS.WORKSHOP_UPDATE), validateBody(registerApprovalSchema),     asyncHandler(ctrl.approve))
router.post('/:id/convert',  authorize(PERMISSIONS.WORKSHOP_UPDATE), validateBody(convertToSOSchema),          asyncHandler(ctrl.convert))

export default router
