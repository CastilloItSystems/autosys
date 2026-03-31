// backend/src/features/workshop/checklists/checklists.routes.ts
import { Router } from 'express'
import { authorize } from '../../../shared/middleware/authorize.middleware.js'
import {
  validateBody,
  validateQuery,
} from '../../../shared/middleware/validateRequest.middleware.js'
import { PERMISSIONS } from '../../../shared/constants/permissions.js'
import * as ctrl from './checklists.controller.js'
import {
  createChecklistTemplateSchema,
  updateChecklistTemplateSchema,
  checklistFiltersSchema,
  evaluateConditionalsSchema,
} from './checklists.validation.js'

const router = Router()

router.get(
  '/',
  authorize(PERMISSIONS.WORKSHOP_VIEW),
  validateQuery(checklistFiltersSchema),
  ctrl.getAll
)
router.get('/:id', authorize(PERMISSIONS.WORKSHOP_VIEW), ctrl.getOne)
router.post(
  '/',
  authorize(PERMISSIONS.WORKSHOP_CREATE),
  validateBody(createChecklistTemplateSchema),
  ctrl.create
)
router.put(
  '/:id',
  authorize(PERMISSIONS.WORKSHOP_UPDATE),
  validateBody(updateChecklistTemplateSchema),
  ctrl.update
)
router.delete('/:id', authorize(PERMISSIONS.WORKSHOP_DELETE), ctrl.remove)

// FASE 3.3: Conditional QC Rules evaluation
router.post(
  '/:templateId/evaluate-conditionals',
  authorize(PERMISSIONS.WORKSHOP_VIEW),
  validateBody(evaluateConditionalsSchema),
  ctrl.evaluateConditionals
)
router.post(
  '/:templateId/validation-details',
  authorize(PERMISSIONS.WORKSHOP_VIEW),
  validateBody(evaluateConditionalsSchema),
  ctrl.getValidationDetails
)

export default router
