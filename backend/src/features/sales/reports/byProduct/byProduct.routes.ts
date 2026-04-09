import { Router } from 'express'
import { getByProductReportHandler } from './byProduct.controller.js'

const router = Router()

router.get('/', getByProductReportHandler)

export default router
