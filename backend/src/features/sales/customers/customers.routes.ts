// backend/src/features/sales/customers/customers.routes.ts

import { Router } from 'express'
import customersController from './customers.controller.js'
import { authorize } from '../../../shared/middleware/authorize.middleware.js'
import {
  validateBody,
  validateQuery,
} from '../../../shared/middleware/validateRequest.middleware.js'
import {
  createCustomerSchema,
  updateCustomerSchema,
  customerFiltersSchema,
} from './customers.validation.js'
import { PERMISSIONS } from '../../../shared/constants/permissions.js'

const router = Router()

router.get(
  '/',
  authorize(PERMISSIONS.CUSTOMERS_VIEW),
  validateQuery(customerFiltersSchema),
  customersController.getAll
)

router.post(
  '/',
  authorize(PERMISSIONS.CUSTOMERS_CREATE),
  validateBody(createCustomerSchema),
  customersController.create
)

router.get(
  '/:id',
  authorize(PERMISSIONS.CUSTOMERS_VIEW),
  customersController.getOne
)

router.put(
  '/:id',
  authorize(PERMISSIONS.CUSTOMERS_UPDATE),
  validateBody(updateCustomerSchema),
  customersController.update
)

router.delete(
  '/:id',
  authorize(PERMISSIONS.CUSTOMERS_DELETE),
  customersController.delete
)

export default router
