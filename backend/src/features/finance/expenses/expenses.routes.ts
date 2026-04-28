// backend/src/features/finance/expenses/expenses.routes.ts

import { Router } from 'express'
import { authorize } from '../../../shared/middleware/authorize.middleware.js'
import { validateBody } from '../../../shared/middleware/validateRequest.middleware.js'
import { PERMISSIONS } from '../../../shared/constants/permissions.js'
import { createExpenseSchema, updateExpenseSchema, createRecurringRuleSchema } from './expenses.validation.js'
import * as ctrl from './expenses.controller.js'

const router = Router()

// Reglas recurrentes (rutas estáticas primero)
router.get('/recurring-rules', authorize(PERMISSIONS.FINANCE_EXPENSE_VIEW), ctrl.getAllRules)
router.post('/recurring-rules', authorize(PERMISSIONS.FINANCE_RECURRING_RULE_MANAGE), validateBody(createRecurringRuleSchema), ctrl.createRule)
router.post('/recurring-rules/run', authorize(PERMISSIONS.FINANCE_RECURRING_RULE_MANAGE), ctrl.runRecurring)
router.patch('/recurring-rules/:id', authorize(PERMISSIONS.FINANCE_RECURRING_RULE_MANAGE), ctrl.updateRule)

// Gastos
router.get('/', authorize(PERMISSIONS.FINANCE_EXPENSE_VIEW), ctrl.getAll)
router.get('/:id', authorize(PERMISSIONS.FINANCE_EXPENSE_VIEW), ctrl.getById)
router.post('/', authorize(PERMISSIONS.FINANCE_EXPENSE_MANAGE), validateBody(createExpenseSchema), ctrl.create)
router.patch('/:id', authorize(PERMISSIONS.FINANCE_EXPENSE_MANAGE), validateBody(updateExpenseSchema), ctrl.update)
router.post('/:id/cancel', authorize(PERMISSIONS.FINANCE_EXPENSE_MANAGE), ctrl.cancel)

export default router
