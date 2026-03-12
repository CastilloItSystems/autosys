// backend/src/features/inventory/serialNumbers/tracking/tracking.routes.ts

import { Router } from 'express'
import { authenticate } from '../../../../shared/middleware/authenticate.middleware.js'
import TrackingController from './tracking.controller.js'

const router = Router({ mergeParams: true })

// All routes require authentication
router.use(authenticate)

router.get('/history', TrackingController.getHistory)
router.get('/summary', TrackingController.getSummary)
router.get('/journey', TrackingController.getJourney)

export default router
