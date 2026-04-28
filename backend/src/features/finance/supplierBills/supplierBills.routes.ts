// backend/src/features/finance/supplierBills/supplierBills.routes.ts

import { Router } from 'express'
import { authorize } from '../../../shared/middleware/authorize.middleware.js'
import { validateBody } from '../../../shared/middleware/validateRequest.middleware.js'
import { PERMISSIONS } from '../../../shared/constants/permissions.js'
import {
  createSupplierBillSchema,
  registerSupplierInvoiceSchema,
  updateSupplierBillSchema,
} from './supplierBills.validation.js'
import * as ctrl from './supplierBills.controller.js'

const router = Router()

router.get('/accounts-payable', authorize(PERMISSIONS.FINANCE_SUPPLIER_BILL_VIEW), ctrl.getAccountsPayable)
router.get('/purchase-orders/available', authorize(PERMISSIONS.FINANCE_SUPPLIER_BILL_VIEW), ctrl.getAvailablePurchaseOrders)
router.get('/', authorize(PERMISSIONS.FINANCE_SUPPLIER_BILL_VIEW), ctrl.getAll)
router.get('/:id', authorize(PERMISSIONS.FINANCE_SUPPLIER_BILL_VIEW), ctrl.getById)
router.post('/', authorize(PERMISSIONS.FINANCE_SUPPLIER_BILL_MANAGE), validateBody(createSupplierBillSchema), ctrl.create)
router.patch('/:id/register-invoice', authorize(PERMISSIONS.FINANCE_SUPPLIER_BILL_MANAGE), validateBody(registerSupplierInvoiceSchema), ctrl.registerInvoice)
router.patch('/:id', authorize(PERMISSIONS.FINANCE_SUPPLIER_BILL_MANAGE), validateBody(updateSupplierBillSchema), ctrl.update)
router.post('/:id/cancel', authorize(PERMISSIONS.FINANCE_SUPPLIER_BILL_MANAGE), ctrl.cancel)

export default router
