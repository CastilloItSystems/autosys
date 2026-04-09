// backend/src/features/workshop/vehicleHistory/vehicleHistory.routes.ts
import { Router } from 'express'
import { asyncHandler } from '../../../shared/middleware/asyncHandler.middleware.js'
import { authorize } from '../../../shared/middleware/authorize.middleware.js'
import { PERMISSIONS } from '../../../shared/constants/permissions.js'
import * as ctrl from './vehicleHistory.controller.js'

const router = Router()

router.get('/:vehicleId/history', authorize(PERMISSIONS.WORKSHOP_VIEW), asyncHandler(ctrl.getHistory))

export default router
