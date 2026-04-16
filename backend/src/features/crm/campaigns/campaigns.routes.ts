import { Router } from 'express'
import campaignsController from './campaigns.controller.js'
import { authorize } from '../../../shared/middleware/authorize.middleware.js'
import { validateBody, validateQuery } from '../../../shared/middleware/validateRequest.middleware.js'
import { campaignFiltersSchema, createCampaignSchema } from './campaigns.validation.js'
import { PERMISSIONS } from '../../../shared/constants/permissions.js'

const router = Router()

router.get(
  '/',
  authorize(PERMISSIONS.CRM_CAMPAIGNS_VIEW),
  validateQuery(campaignFiltersSchema),
  campaignsController.getAll
)

router.post(
  '/',
  authorize(PERMISSIONS.CRM_CAMPAIGNS_CREATE),
  validateBody(createCampaignSchema),
  campaignsController.create
)

export default router
