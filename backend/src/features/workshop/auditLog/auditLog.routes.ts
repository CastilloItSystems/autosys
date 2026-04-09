// backend/src/features/workshop/auditLog/auditLog.routes.ts
import { Router } from 'express'
import { asyncHandler } from '../../../shared/middleware/asyncHandler.middleware.js'
import { authorize } from '../../../shared/middleware/authorize.middleware.js'
import { validateQuery } from '../../../shared/middleware/validateRequest.middleware.js'
import { PERMISSIONS } from '../../../shared/constants/permissions.js'
import { auditLogFiltersSchema } from './auditLog.validation.js'
import * as ctrl from './auditLog.controller.js'

const router = Router()

// Read-only: solo consulta de logs de auditoría
router.get('/', authorize(PERMISSIONS.WORKSHOP_VIEW), validateQuery(auditLogFiltersSchema), asyncHandler(ctrl.getAll))

export default router
