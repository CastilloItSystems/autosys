import { Router } from 'express'
import { PERMISSIONS } from '../../../shared/constants/permissions.js'
import { authorize } from '../../../shared/middleware/authorize.middleware.js'
import controller from './reports.controller.js'

const router = Router()

router.get('/executive', authorize(PERMISSIONS.DEALER_VIEW), controller.getExecutive)
router.get('/pipeline', authorize(PERMISSIONS.DEALER_VIEW), controller.getPipeline)

export default router
