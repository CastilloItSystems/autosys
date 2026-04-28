// backend/src/features/finance/bankAccounts/bankAccounts.routes.ts

import { Router } from 'express'
import { authorize } from '../../../shared/middleware/authorize.middleware.js'
import { validateBody } from '../../../shared/middleware/validateRequest.middleware.js'
import { PERMISSIONS } from '../../../shared/constants/permissions.js'
import { createBankAccountSchema, updateBankAccountSchema } from './bankAccounts.validation.js'
import * as ctrl from './bankAccounts.controller.js'

const router = Router()

router.get('/', authorize(PERMISSIONS.FINANCE_BANK_ACCOUNT_VIEW), ctrl.getAll)
router.post('/sync-balances', authorize(PERMISSIONS.FINANCE_BANK_ACCOUNT_MANAGE), ctrl.syncAllBalances)
router.get('/:id', authorize(PERMISSIONS.FINANCE_BANK_ACCOUNT_VIEW), ctrl.getById)
router.get('/:id/balance', authorize(PERMISSIONS.FINANCE_BANK_ACCOUNT_VIEW), ctrl.getBalance)
router.post('/', authorize(PERMISSIONS.FINANCE_BANK_ACCOUNT_MANAGE), validateBody(createBankAccountSchema), ctrl.create)
router.patch('/:id', authorize(PERMISSIONS.FINANCE_BANK_ACCOUNT_MANAGE), validateBody(updateBankAccountSchema), ctrl.update)

export default router
