import { Router } from 'express'
import { authorize } from '../../../shared/middleware/authorize.middleware.js'
import { PERMISSIONS } from '../../../shared/constants/permissions.js'
import { getAlerts, runChecks } from './crm-automations.controller.js'

const router = Router()

router.get('/alerts', authorize(PERMISSIONS.CRM_AUTOMATIONS_VIEW), getAlerts)
router.post('/run', authorize(PERMISSIONS.CRM_AUTOMATIONS_RUN), runChecks)

export default router
