import { Router } from 'express'
import { getPendingInvoicesReportHandler } from './pendingInvoices.controller.js'

const router = Router()

router.get('/', getPendingInvoicesReportHandler)

export default router
