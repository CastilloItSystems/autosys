// backend/src/features/finance/dashboard/financeDashboard.routes.ts

import { Router } from 'express'
import { authorize } from '../../../shared/middleware/authorize.middleware.js'
import { PERMISSIONS } from '../../../shared/constants/permissions.js'
import * as ctrl from './financeDashboard.controller.js'

const router = Router()

router.get('/', authorize(PERMISSIONS.FINANCE_VIEW), ctrl.getDashboard)
router.get('/receivables', authorize(PERMISSIONS.FINANCE_VIEW), ctrl.getReceivables)

export default router
