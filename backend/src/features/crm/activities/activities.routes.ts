// backend/src/features/crm/activities/activities.routes.ts

import { Router } from 'express'
import activitiesController from './activities.controller.js'
import { authorize } from '../../../shared/middleware/authorize.middleware.js'
import { validateBody, validateQuery } from '../../../shared/middleware/validateRequest.middleware.js'
import {
  createActivitySchema,
  updateActivitySchema,
  completeActivitySchema,
  activityFiltersSchema,
} from './activities.validation.js'
import { PERMISSIONS } from '../../../shared/constants/permissions.js'

const router = Router()

router.get(
  '/',
  authorize(PERMISSIONS.CRM_ACTIVITIES_VIEW),
  validateQuery(activityFiltersSchema),
  activitiesController.getAll
)

router.post(
  '/',
  authorize(PERMISSIONS.CRM_ACTIVITIES_CREATE),
  validateBody(createActivitySchema),
  activitiesController.create
)

router.get(
  '/:id',
  authorize(PERMISSIONS.CRM_ACTIVITIES_VIEW),
  activitiesController.getOne
)

router.put(
  '/:id',
  authorize(PERMISSIONS.CRM_ACTIVITIES_UPDATE),
  validateBody(updateActivitySchema),
  activitiesController.update
)

router.patch(
  '/:id/complete',
  authorize(PERMISSIONS.CRM_ACTIVITIES_UPDATE),
  validateBody(completeActivitySchema),
  activitiesController.complete
)

router.delete(
  '/:id',
  authorize(PERMISSIONS.CRM_ACTIVITIES_DELETE),
  activitiesController.delete
)

export default router
