// backend/src/features/crm/customerVehicles/customerVehicles.routes.ts

import { Router } from 'express'
import customerVehiclesController from './customerVehicles.controller.js'
import { authorize } from '../../../shared/middleware/authorize.middleware.js'
import { validateBody, validateQuery } from '../../../shared/middleware/validateRequest.middleware.js'
import {
  createCustomerVehicleSchema,
  updateCustomerVehicleSchema,
  customerVehicleFiltersSchema,
} from './customerVehicles.validation.js'
import { PERMISSIONS } from '../../../shared/constants/permissions.js'

const router = Router({ mergeParams: true })

router.get(
  '/',
  authorize(PERMISSIONS.CRM_VEHICLES_VIEW),
  validateQuery(customerVehicleFiltersSchema),
  customerVehiclesController.getAll
)

router.post(
  '/',
  authorize(PERMISSIONS.CRM_VEHICLES_CREATE),
  validateBody(createCustomerVehicleSchema),
  customerVehiclesController.create
)

router.get(
  '/:id',
  authorize(PERMISSIONS.CRM_VEHICLES_VIEW),
  customerVehiclesController.getOne
)

router.get(
  '/:id/service-history',
  authorize(PERMISSIONS.CRM_VEHICLES_VIEW),
  customerVehiclesController.getServiceHistory
)

router.put(
  '/:id',
  authorize(PERMISSIONS.CRM_VEHICLES_UPDATE),
  validateBody(updateCustomerVehicleSchema),
  customerVehiclesController.update
)

router.delete(
  '/:id',
  authorize(PERMISSIONS.CRM_VEHICLES_DELETE),
  customerVehiclesController.delete
)

export default router
