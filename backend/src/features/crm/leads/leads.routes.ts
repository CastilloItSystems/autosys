// backend/src/features/crm/leads/leads.routes.ts

import { Router } from 'express'
import leadsController from './leads.controller.js'
import { authorize } from '../../../shared/middleware/authorize.middleware.js'
import { validateBody, validateQuery } from '../../../shared/middleware/validateRequest.middleware.js'
import {
  createLeadSchema,
  updateLeadSchema,
  updateLeadStatusSchema,
  leadFiltersSchema,
} from './leads.validation.js'
import { PERMISSIONS } from '../../../shared/constants/permissions.js'

const router = Router()

router.get(
  '/',
  authorize(PERMISSIONS.CRM_LEADS_VIEW),
  validateQuery(leadFiltersSchema),
  leadsController.getAll
)

router.post(
  '/',
  authorize(PERMISSIONS.CRM_LEADS_CREATE),
  validateBody(createLeadSchema),
  leadsController.create
)

router.get(
  '/:id',
  authorize(PERMISSIONS.CRM_LEADS_VIEW),
  leadsController.getOne
)

router.put(
  '/:id',
  authorize(PERMISSIONS.CRM_LEADS_UPDATE),
  validateBody(updateLeadSchema),
  leadsController.update
)

router.patch(
  '/:id/status',
  authorize(PERMISSIONS.CRM_LEADS_UPDATE),
  validateBody(updateLeadStatusSchema),
  leadsController.updateStatus
)

router.delete(
  '/:id',
  authorize(PERMISSIONS.CRM_LEADS_DELETE),
  leadsController.delete
)

export default router
