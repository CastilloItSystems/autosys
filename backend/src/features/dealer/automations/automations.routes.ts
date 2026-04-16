import { Router } from 'express'
import { PERMISSIONS } from '../../../shared/constants/permissions.js'
import { authorize } from '../../../shared/middleware/authorize.middleware.js'
import controller from './automations.controller.js'

const router = Router()

router.get('/alerts', authorize(PERMISSIONS.DEALER_VIEW), controller.getAlerts)
router.post('/run-checks', authorize(PERMISSIONS.DEALER_APPROVE), controller.runChecks)

export default router
