// backend/src/features/sales/audit/audit.routes.ts

import { Router } from 'express'
import auditController from './audit.controller.js'
import { authorize } from '../../../shared/middleware/authorize.middleware.js'
import { PERMISSIONS } from '../../../shared/constants/permissions.js'

const router = Router()

router.get('/', authorize(PERMISSIONS.ORDERS_VIEW), auditController.getHistory)

export default router
