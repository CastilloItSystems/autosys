// backend/src/features/workshop/diagnoses/diagnoses.routes.ts
import { Router } from 'express'
import { asyncHandler } from '../../../shared/middleware/asyncHandler.middleware.js'
import { authorize } from '../../../shared/middleware/authorize.middleware.js'
import { validateBody, validateQuery } from '../../../shared/middleware/validateRequest.middleware.js'
import { PERMISSIONS } from '../../../shared/constants/permissions.js'
import * as ctrl from './diagnoses.controller.js'
import {
  createDiagnosisSchema,
  updateDiagnosisSchema,
  createFindingSchema,
  createSuggestedOpSchema,
  createSuggestedPartSchema,
  createEvidenceSchema,
  diagnosisFiltersSchema,
} from './diagnoses.validation.js'

const router = Router()

// Static routes first (before /:id to avoid conflicts)
router.get('/order/:orderId',    authorize(PERMISSIONS.WORKSHOP_VIEW),   asyncHandler(ctrl.getByOrder))
router.get('/templates/recommended', authorize(PERMISSIONS.WORKSHOP_VIEW), asyncHandler(ctrl.getRecommendedTemplate))
router.get('/templates/list',    authorize(PERMISSIONS.WORKSHOP_VIEW),   asyncHandler(ctrl.listDiagnosticTemplates))
router.get('/templates/stats',   authorize(PERMISSIONS.WORKSHOP_VIEW),   asyncHandler(ctrl.getTemplatesStats))
router.get('/templates/:code',   authorize(PERMISSIONS.WORKSHOP_VIEW),   asyncHandler(ctrl.getTemplateByCode))

// CRUD
router.get('/',    authorize(PERMISSIONS.WORKSHOP_VIEW),   validateQuery(diagnosisFiltersSchema), asyncHandler(ctrl.getAll))
router.post('/',   authorize(PERMISSIONS.WORKSHOP_CREATE), validateBody(createDiagnosisSchema),   asyncHandler(ctrl.create))
router.get('/:id', authorize(PERMISSIONS.WORKSHOP_VIEW),                                          asyncHandler(ctrl.getOne))
router.put('/:id', authorize(PERMISSIONS.WORKSHOP_UPDATE), validateBody(updateDiagnosisSchema),   asyncHandler(ctrl.update))
router.delete('/:id', authorize(PERMISSIONS.WORKSHOP_DELETE),                                     asyncHandler(ctrl.remove))

// Sub-resources
router.post('/:id/findings',                   authorize(PERMISSIONS.WORKSHOP_CREATE), validateBody(createFindingSchema),       asyncHandler(ctrl.addFinding))
router.delete('/:id/findings/:findingId',       authorize(PERMISSIONS.WORKSHOP_DELETE),                                          asyncHandler(ctrl.removeFinding))
router.post('/:id/operations',                 authorize(PERMISSIONS.WORKSHOP_CREATE), validateBody(createSuggestedOpSchema),   asyncHandler(ctrl.addSuggestedOp))
router.delete('/:id/operations/:opId',         authorize(PERMISSIONS.WORKSHOP_DELETE),                                          asyncHandler(ctrl.removeSuggestedOp))
router.post('/:id/parts',                      authorize(PERMISSIONS.WORKSHOP_CREATE), validateBody(createSuggestedPartSchema),  asyncHandler(ctrl.addSuggestedPart))
router.delete('/:id/parts/:partId',            authorize(PERMISSIONS.WORKSHOP_DELETE),                                          asyncHandler(ctrl.removeSuggestedPart))
router.post('/:id/evidences',                  authorize(PERMISSIONS.WORKSHOP_CREATE), validateBody(createEvidenceSchema),      asyncHandler(ctrl.addEvidence))
router.delete('/:id/evidences/:evidenceId',    authorize(PERMISSIONS.WORKSHOP_DELETE),                                          asyncHandler(ctrl.removeEvidence))

export default router
