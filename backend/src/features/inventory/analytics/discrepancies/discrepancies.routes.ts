import { Router } from 'express'
import { DiscrepancyAnalyticsController } from './discrepancies.controller.js'
import { authorize } from '../../../../shared/middleware/authorize.middleware.js'
import { PERMISSIONS } from '../../../../shared/constants/permissions.js'

const router = Router()
const controller = new DiscrepancyAnalyticsController()

router.get(
  '/top',
  authorize(PERMISSIONS.INVENTORY_VIEW),
  controller.getTopDiscrepancies
)

export default router
