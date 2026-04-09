import { Router } from 'express'
import { getByPeriodReportHandler } from './byPeriod.controller.js'

const router = Router()

router.get('/', getByPeriodReportHandler)

export default router
