// backend/src/features/crm/interactions/interactions.routes.ts

import { Router } from 'express'
import interactionsController from './interactions.controller.js'
import { authorize } from '../../../shared/middleware/authorize.middleware.js'
import { validateBody, validateQuery } from '../../../shared/middleware/validateRequest.middleware.js'
import {
  createInteractionSchema,
  updateInteractionSchema,
  interactionFiltersSchema,
} from './interactions.validation.js'
import { PERMISSIONS } from '../../../shared/constants/permissions.js'

const router = Router()

router.get(
  '/',
  authorize(PERMISSIONS.CRM_INTERACTIONS_VIEW),
  validateQuery(interactionFiltersSchema),
  interactionsController.getAll
)

router.post(
  '/',
  authorize(PERMISSIONS.CRM_INTERACTIONS_CREATE),
  validateBody(createInteractionSchema),
  interactionsController.create
)

router.get(
  '/:id',
  authorize(PERMISSIONS.CRM_INTERACTIONS_VIEW),
  interactionsController.getOne
)

router.put(
  '/:id',
  authorize(PERMISSIONS.CRM_INTERACTIONS_UPDATE),
  validateBody(updateInteractionSchema),
  interactionsController.update
)

router.delete(
  '/:id',
  authorize(PERMISSIONS.CRM_INTERACTIONS_DELETE),
  interactionsController.delete
)

export default router
