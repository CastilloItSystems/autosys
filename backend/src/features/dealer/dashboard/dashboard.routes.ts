import { Router } from 'express'
import { PERMISSIONS } from '../../../shared/constants/permissions.js'
import { authorize } from '../../../shared/middleware/authorize.middleware.js'
import controller from './dashboard.controller.js'

const router = Router()

router.get('/overview', authorize(PERMISSIONS.DEALER_VIEW), controller.getOverview)

export default router
