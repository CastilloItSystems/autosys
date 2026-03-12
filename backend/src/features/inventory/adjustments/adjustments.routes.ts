// backend/src/features/inventory/adjustments/adjustments.routes.ts

import { Router } from 'express'
import adjustmentController from './adjustments.controller.js'
import { authorize } from '../../../shared/middleware/authorize.middleware.js'
import {
  validateBody,
  validateQuery,
} from '../../../shared/middleware/validateRequest.middleware.js'
import {
  createAdjustmentSchema,
  updateAdjustmentSchema,
  rejectAdjustmentSchema,
  addAdjustmentItemSchema,
  adjustmentFiltersSchema,
} from './adjustments.validation.js'
import { PERMISSIONS } from '../../../shared/constants/permissions.js'

const router = Router()

// -- Acciones (antes de /:id para evitar conflictos) --
router.patch(
  '/:id/approve',
  authorize(PERMISSIONS.INVENTORY_UPDATE),
  adjustmentController.approve
)
router.patch(
  '/:id/apply',
  authorize(PERMISSIONS.INVENTORY_UPDATE),
  adjustmentController.apply
)
router.patch(
  '/:id/reject',
  authorize(PERMISSIONS.INVENTORY_UPDATE),
  validateBody(rejectAdjustmentSchema),
  adjustmentController.reject
)
router.patch(
  '/:id/cancel',
  authorize(PERMISSIONS.INVENTORY_UPDATE),
  adjustmentController.cancel
)

// -- Items (antes de /:id) --
router.post(
  '/:id/items',
  authorize(PERMISSIONS.INVENTORY_CREATE),
  validateBody(addAdjustmentItemSchema),
  adjustmentController.addItem
)
router.get(
  '/:id/items',
  authorize(PERMISSIONS.INVENTORY_VIEW),
  adjustmentController.getItems
)

// -- CRUD --
router.get(
  '/',
  authorize(PERMISSIONS.INVENTORY_VIEW),
  validateQuery(adjustmentFiltersSchema),
  adjustmentController.getAll
)
router.post(
  '/',
  authorize(PERMISSIONS.INVENTORY_CREATE),
  validateBody(createAdjustmentSchema),
  adjustmentController.create
)
router.get(
  '/:id',
  authorize(PERMISSIONS.INVENTORY_VIEW),
  adjustmentController.getOne
)
router.put(
  '/:id',
  authorize(PERMISSIONS.INVENTORY_UPDATE),
  validateBody(updateAdjustmentSchema),
  adjustmentController.update
)
router.delete(
  '/:id',
  authorize(PERMISSIONS.INVENTORY_DELETE),
  adjustmentController.delete
)

export default router
