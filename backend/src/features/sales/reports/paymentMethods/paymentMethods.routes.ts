import { Router } from 'express'
import { getPaymentMethodsReportHandler } from './paymentMethods.controller.js'

const router = Router()

router.get('/', getPaymentMethodsReportHandler)

export default router
