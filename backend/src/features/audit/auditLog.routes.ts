import { Router } from 'express'
import { authorize } from '../../shared/middleware/authorize.middleware.js'
import { validateQuery } from '../../shared/middleware/validateRequest.middleware.js'
import { PERMISSIONS } from '../../shared/constants/permissions.js'
import { auditLogFiltersSchema } from './auditLog.validation.js'
import * as controller from './auditLog.controller.js'

const router = Router()

router.get(
  '/',
  authorize(PERMISSIONS.AUDIT_VIEW),
  validateQuery(auditLogFiltersSchema),
  controller.getAll
)

export default router
