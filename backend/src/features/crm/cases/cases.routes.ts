// backend/src/features/crm/cases/cases.routes.ts

import { Router } from 'express'
import casesController from './cases.controller.js'
import { authorize } from '../../../shared/middleware/authorize.middleware.js'
import { validateBody, validateQuery } from '../../../shared/middleware/validateRequest.middleware.js'
import {
  createCaseSchema,
  updateCaseSchema,
  updateCaseStatusSchema,
  addCommentSchema,
  caseFiltersSchema,
} from './cases.validation.js'
import { PERMISSIONS } from '../../../shared/constants/permissions.js'

const router = Router()

router.get(
  '/',
  authorize(PERMISSIONS.CRM_CASES_VIEW),
  validateQuery(caseFiltersSchema),
  casesController.getAll
)

router.post(
  '/',
  authorize(PERMISSIONS.CRM_CASES_CREATE),
  validateBody(createCaseSchema),
  casesController.create
)

router.get(
  '/:id',
  authorize(PERMISSIONS.CRM_CASES_VIEW),
  casesController.getOne
)

router.put(
  '/:id',
  authorize(PERMISSIONS.CRM_CASES_UPDATE),
  validateBody(updateCaseSchema),
  casesController.update
)

router.patch(
  '/:id/status',
  authorize(PERMISSIONS.CRM_CASES_UPDATE),
  validateBody(updateCaseStatusSchema),
  casesController.updateStatus
)

router.post(
  '/:id/comments',
  authorize(PERMISSIONS.CRM_CASES_UPDATE),
  validateBody(addCommentSchema),
  casesController.addComment
)

router.delete(
  '/:id',
  authorize(PERMISSIONS.CRM_CASES_DELETE),
  casesController.remove
)

export default router
