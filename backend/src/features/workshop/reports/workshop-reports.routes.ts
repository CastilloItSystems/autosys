// backend/src/features/workshop/reports/workshop-reports.routes.ts
import { Router } from 'express'
import { authorize } from '../../../shared/middleware/authorize.middleware.js'
import { PERMISSIONS } from '../../../shared/constants/permissions.js'
import * as ctrl from './workshop-reports.controller.js'

const router = Router()

/**
 * Get all reports at once
 * GET /api/workshop/reports?startDate=2026-03-01&endDate=2026-03-31
 */
router.get('/', authorize(PERMISSIONS.WORKSHOP_VIEW), ctrl.getAllReportsData)

/**
 * Individual report endpoints
 */

router.get(
  '/service-orders',
  authorize(PERMISSIONS.WORKSHOP_VIEW),
  ctrl.getServiceOrders
)

router.get(
  '/productivity',
  authorize(PERMISSIONS.WORKSHOP_VIEW),
  ctrl.getProductivity
)

router.get(
  '/efficiency',
  authorize(PERMISSIONS.WORKSHOP_VIEW),
  ctrl.getEfficiency
)

router.get(
  '/materials',
  authorize(PERMISSIONS.WORKSHOP_VIEW),
  ctrl.getMaterials
)

router.get('/warranty', authorize(PERMISSIONS.WORKSHOP_VIEW), ctrl.getWarranty)

router.get(
  '/financial',
  authorize(PERMISSIONS.WORKSHOP_VIEW),
  ctrl.getFinancial
)

export default router
