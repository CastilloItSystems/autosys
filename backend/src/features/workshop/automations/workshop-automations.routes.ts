// backend/src/features/workshop/automations/workshop-automations.routes.ts
import { Router } from 'express'
import { authorize } from '../../../shared/middleware/authorize.middleware.js'
import { PERMISSIONS } from '../../../shared/constants/permissions.js'
import * as ctrl from './workshop-automations.controller.js'

const router = Router()

/**
 * Get all active alerts from automation checks
 * GET /api/workshop/automations/alerts
 */
router.get(
  '/alerts',
  authorize(PERMISSIONS.WORKSHOP_VIEW),
  ctrl.getAutomationAlerts
)

export default router
