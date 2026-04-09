// backend/src/features/crm/dashboard/crm.dashboard.routes.ts

import { Router } from 'express'
import { asyncHandler } from '../../../shared/middleware/asyncHandler.middleware.js'
import { authorize } from '../../../shared/middleware/authorize.middleware.js'
import { PERMISSIONS } from '../../../shared/constants/permissions.js'
import { getCrmDashboard } from './crm.dashboard.service.js'
import { ApiResponse } from '../../../shared/utils/apiResponse.js'

const router = Router()

router.get(
  '/',
  authorize(PERMISSIONS.CRM_LEADS_VIEW),
  asyncHandler(async (req, res) => {
    const data = await getCrmDashboard(req.prisma, req.empresaId!)
    return ApiResponse.success(res, data, 'Dashboard CRM obtenido')
  })
)

export default router
