import { Router } from 'express'
import { getByCustomerReportHandler } from './byCustomer.controller.js'

const router = Router()

router.get('/', getByCustomerReportHandler)

export default router
