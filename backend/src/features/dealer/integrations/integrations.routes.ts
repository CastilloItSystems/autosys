import { Router } from 'express'
import { PERMISSIONS } from '../../../shared/constants/permissions.js'
import { authorize } from '../../../shared/middleware/authorize.middleware.js'
import controller from './integrations.controller.js'

const router = Router()

router.get('/status', authorize(PERMISSIONS.DEALER_VIEW), controller.getStatus)

export default router
