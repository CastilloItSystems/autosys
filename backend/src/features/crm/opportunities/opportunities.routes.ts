import { Router } from 'express'
import opportunitiesController from './opportunities.controller.js'
import { authorize } from '../../../shared/middleware/authorize.middleware.js'
import { validateBody, validateQuery } from '../../../shared/middleware/validateRequest.middleware.js'
import {
  closeOpportunitySchema,
  createLossReasonSchema,
  createStageConfigSchema,
  createOpportunitySchema,
  opportunityFiltersSchema,
  updateOpportunitySchema,
  updateOpportunityStageSchema,
} from './opportunities.validation.js'
import { PERMISSIONS } from '../../../shared/constants/permissions.js'

const router = Router()

router.get(
  '/catalogs/stages',
  authorize(PERMISSIONS.CRM_OPPORTUNITIES_VIEW),
  opportunitiesController.getStageConfigs
)

router.post(
  '/catalogs/stages',
  authorize(PERMISSIONS.CRM_OPPORTUNITIES_UPDATE),
  validateBody(createStageConfigSchema),
  opportunitiesController.createStageConfig
)

router.get(
  '/catalogs/loss-reasons',
  authorize(PERMISSIONS.CRM_OPPORTUNITIES_VIEW),
  opportunitiesController.getLossReasons
)

router.post(
  '/catalogs/loss-reasons',
  authorize(PERMISSIONS.CRM_OPPORTUNITIES_UPDATE),
  validateBody(createLossReasonSchema),
  opportunitiesController.createLossReason
)

router.get(
  '/',
  authorize(PERMISSIONS.CRM_OPPORTUNITIES_VIEW),
  validateQuery(opportunityFiltersSchema),
  opportunitiesController.getAll
)

router.post(
  '/',
  authorize(PERMISSIONS.CRM_OPPORTUNITIES_CREATE),
  validateBody(createOpportunitySchema),
  opportunitiesController.create
)

router.get(
  '/:id',
  authorize(PERMISSIONS.CRM_OPPORTUNITIES_VIEW),
  opportunitiesController.getOne
)

router.put(
  '/:id',
  authorize(PERMISSIONS.CRM_OPPORTUNITIES_UPDATE),
  validateBody(updateOpportunitySchema),
  opportunitiesController.update
)

router.patch(
  '/:id/stage',
  authorize(PERMISSIONS.CRM_OPPORTUNITIES_UPDATE),
  validateBody(updateOpportunityStageSchema),
  opportunitiesController.updateStage
)

router.post(
  '/:id/close',
  authorize(PERMISSIONS.CRM_OPPORTUNITIES_UPDATE),
  validateBody(closeOpportunitySchema),
  opportunitiesController.close
)

export default router
