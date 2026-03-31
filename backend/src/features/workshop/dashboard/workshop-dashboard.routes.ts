// backend/src/features/workshop/dashboard/workshop-dashboard.routes.ts
// FASE 3.4: Workshop Dashboard Routes

import { Router } from 'express'
import { authorize } from '../../../shared/middleware/authorize.middleware.js'
import { PERMISSIONS } from '../../../shared/constants/permissions.js'
import * as ctrl from './workshop-dashboard.controller.js'

const router = Router()

/**
 * Get real-time workshop operational dashboard
 * Shows KPIs, alerts, recent activity, and quick stats
 * GET /api/workshop/dashboard
 */
router.get('/', authorize(PERMISSIONS.WORKSHOP_VIEW), ctrl.getDashboard)

/**
 * Get dashboard summary for a date range
 * GET /api/workshop/dashboard/summary?startDate=2026-03-01&endDate=2026-03-31
 */
router.get(
  '/summary',
  authorize(PERMISSIONS.WORKSHOP_VIEW),
  ctrl.getDashboardSummaryData
)

export default router
