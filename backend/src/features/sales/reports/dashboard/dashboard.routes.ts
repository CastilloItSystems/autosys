import { Router } from 'express'
import { getSalesDashboardHandler } from './dashboard.controller.js'

const router = Router()

router.get('/', getSalesDashboardHandler)

export default router
