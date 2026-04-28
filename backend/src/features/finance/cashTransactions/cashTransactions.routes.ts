// backend/src/features/finance/cashTransactions/cashTransactions.routes.ts

import { Router } from 'express'
import { authorize } from '../../../shared/middleware/authorize.middleware.js'
import { PERMISSIONS } from '../../../shared/constants/permissions.js'
import * as ctrl from './cashTransactions.controller.js'

const router = Router()

router.get('/summary', authorize(PERMISSIONS.FINANCE_CASH_FLOW_VIEW), ctrl.getSummary)
router.post('/transfer', authorize(PERMISSIONS.FINANCE_CASH_FLOW_VIEW), ctrl.createTransfer)
router.post('/adjustment', authorize(PERMISSIONS.FINANCE_CASH_FLOW_VIEW), ctrl.createAdjustment)
router.get('/', authorize(PERMISSIONS.FINANCE_CASH_FLOW_VIEW), ctrl.getAll)

export default router
