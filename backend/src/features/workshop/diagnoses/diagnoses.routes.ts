// backend/src/features/workshop/diagnoses/diagnoses.routes.ts
import { Router } from 'express'
import { asyncHandler } from '../../../shared/middleware/asyncHandler.middleware.js'
import { authorize } from '../../../shared/middleware/authorize.middleware.js'
import { validateBody } from '../../../shared/middleware/validateRequest.middleware.js'
import { PERMISSIONS } from '../../../shared/constants/permissions.js'
import * as ctrl from './diagnoses.controller.js'
import {
  createDiagnosisSchema,
  updateDiagnosisSchema,
  createFindingSchema,
  createSuggestedOpSchema,
  createSuggestedPartSchema,
} from './diagnoses.validation.js'

const router = Router()

router.get(
  '/',
  authorize(PERMISSIONS.WORKSHOP_VIEW),
  asyncHandler(ctrl.getAll)
)
router.get(
  '/:id',
  authorize(PERMISSIONS.WORKSHOP_VIEW),
  asyncHandler(ctrl.getOne)
)
router.get(
  '/order/:orderId',
  authorize(PERMISSIONS.WORKSHOP_VIEW),
  asyncHandler(ctrl.getByOrder)
)
router.post(
  '/',
  authorize(PERMISSIONS.WORKSHOP_CREATE),
  validateBody(createDiagnosisSchema),
  asyncHandler(ctrl.create)
)
router.put(
  '/:id',
  authorize(PERMISSIONS.WORKSHOP_UPDATE),
  validateBody(updateDiagnosisSchema),
  asyncHandler(ctrl.update)
)

router.post(
  '/:id/findings',
  authorize(PERMISSIONS.WORKSHOP_CREATE),
  validateBody(createFindingSchema),
  asyncHandler(ctrl.addFinding)
)
router.delete(
  '/findings/:findingId',
  authorize(PERMISSIONS.WORKSHOP_DELETE),
  asyncHandler(ctrl.removeFinding)
)

router.post(
  '/:id/operations',
  authorize(PERMISSIONS.WORKSHOP_CREATE),
  validateBody(createSuggestedOpSchema),
  asyncHandler(ctrl.addSuggestedOp)
)
router.post(
  '/:id/parts',
  authorize(PERMISSIONS.WORKSHOP_CREATE),
  validateBody(createSuggestedPartSchema),
  asyncHandler(ctrl.addSuggestedPart)
)

// FASE 3.2: Diagnostic templates routes
router.get(
  '/templates/recommended',
  authorize(PERMISSIONS.WORKSHOP_VIEW),
  asyncHandler(ctrl.getRecommendedTemplate)
)
router.get(
  '/templates/list',
  authorize(PERMISSIONS.WORKSHOP_VIEW),
  asyncHandler(ctrl.listDiagnosticTemplates)
)
router.get(
  '/templates/stats',
  authorize(PERMISSIONS.WORKSHOP_VIEW),
  asyncHandler(ctrl.getTemplatesStats)
)
router.get(
  '/templates/:code',
  authorize(PERMISSIONS.WORKSHOP_VIEW),
  asyncHandler(ctrl.getTemplateByCode)
)

export default router
