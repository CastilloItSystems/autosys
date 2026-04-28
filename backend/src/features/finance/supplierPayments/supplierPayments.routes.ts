// backend/src/features/finance/supplierPayments/supplierPayments.routes.ts

import { Router } from 'express'
import { authorize } from '../../../shared/middleware/authorize.middleware.js'
import { validateBody } from '../../../shared/middleware/validateRequest.middleware.js'
import { PERMISSIONS } from '../../../shared/constants/permissions.js'
import { createSupplierPaymentSchema } from './supplierPayments.validation.js'
import * as ctrl from './supplierPayments.controller.js'

const router = Router()

router.get('/', authorize(PERMISSIONS.FINANCE_SUPPLIER_PAYMENT_VIEW), ctrl.getAll)
router.get('/:id', authorize(PERMISSIONS.FINANCE_SUPPLIER_PAYMENT_VIEW), ctrl.getById)
router.post('/', authorize(PERMISSIONS.FINANCE_SUPPLIER_PAYMENT_CREATE), validateBody(createSupplierPaymentSchema), ctrl.create)
router.post('/:id/cancel', authorize(PERMISSIONS.FINANCE_SUPPLIER_PAYMENT_CANCEL), ctrl.cancel)

export default router
