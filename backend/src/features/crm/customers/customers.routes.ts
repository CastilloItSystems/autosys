// backend/src/features/crm/customers/customers.routes.ts

import { Router } from 'express'
import customersController from './customers.controller.js'
import { authorize } from '../../../shared/middleware/authorize.middleware.js'
import { validateBody, validateQuery } from '../../../shared/middleware/validateRequest.middleware.js'
import { createCustomerSchema, updateCustomerSchema, customerFiltersSchema } from './customers.validation.js'
import { PERMISSIONS } from '../../../shared/constants/permissions.js'

const router = Router()

router.get(
  '/',
  authorize(PERMISSIONS.CRM_CUSTOMERS_VIEW),
  validateQuery(customerFiltersSchema),
  customersController.getAll
)

router.post(
  '/',
  authorize(PERMISSIONS.CRM_CUSTOMERS_CREATE),
  validateBody(createCustomerSchema),
  customersController.create
)

router.get(
  '/:id',
  authorize(PERMISSIONS.CRM_CUSTOMERS_VIEW),
  customersController.getOne
)

router.get(
  '/:id/timeline',
  authorize(PERMISSIONS.CRM_CUSTOMERS_VIEW),
  customersController.getTimeline
)

router.put(
  '/:id',
  authorize(PERMISSIONS.CRM_CUSTOMERS_UPDATE),
  validateBody(updateCustomerSchema),
  customersController.update
)

router.delete(
  '/:id',
  authorize(PERMISSIONS.CRM_CUSTOMERS_DELETE),
  customersController.delete
)

export default router
