import { Router } from 'express'
import { DiscrepancyAnalyticsController } from './discrepancies.controller'
import { authenticate } from '../../../../shared/middleware/auth.middleware'
import { authorize } from '../../../../shared/middleware/authorize.middleware'
import { PERMISSIONS } from '../../../../shared/constants/permissions'

const router = Router()
const controller = new DiscrepancyAnalyticsController()

router.get(
  '/top',
  authenticate,
  authorize(PERMISSIONS.INVENTORY_VIEW),
  controller.getTopDiscrepancies
)

export default router
