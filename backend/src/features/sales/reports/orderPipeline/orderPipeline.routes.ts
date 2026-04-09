import { Router } from 'express'
import { getOrderPipelineReportHandler } from './orderPipeline.controller.js'

const router = Router()

router.get('/', getOrderPipelineReportHandler)

export default router
