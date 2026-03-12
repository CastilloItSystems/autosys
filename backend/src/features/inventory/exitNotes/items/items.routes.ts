// backend/src/features/inventory/exitNotes/items/items.routes.ts

import { Router } from 'express'
import itemsController from './items.controller.js'
import { authorize } from '../../../../shared/middleware/authorize.middleware.js'
import { validateBody } from '../../../../shared/middleware/validateRequest.middleware.js'
import {
  recordPickingSchema,
  verifyItemSchema,
  rejectItemSchema,
  assignBatchSchema,
  assignSerialSchema,
} from './items.validation.js'
import { PERMISSIONS } from '../../../../shared/constants/permissions.js'

// mergeParams: true — para acceder a :exitNoteId del router padre
const router = Router({ mergeParams: true })

// -- Summary (antes de /:itemId para evitar conflicto de params) --
router.get(
  '/summary',
  authorize(PERMISSIONS.INVENTORY_VIEW),
  itemsController.getSummary
)

// -- CRUD --
router.get('/', authorize(PERMISSIONS.INVENTORY_VIEW), itemsController.getItems)
router.get(
  '/:itemId',
  authorize(PERMISSIONS.INVENTORY_VIEW),
  itemsController.getItem
)

// -- Acciones sobre item individual --
router.patch(
  '/:itemId/pick',
  authorize(PERMISSIONS.INVENTORY_UPDATE),
  validateBody(recordPickingSchema),
  itemsController.recordPicking
)
router.patch(
  '/:itemId/verify',
  authorize(PERMISSIONS.INVENTORY_UPDATE),
  validateBody(verifyItemSchema),
  itemsController.verifyItem
)
router.patch(
  '/:itemId/reject',
  authorize(PERMISSIONS.INVENTORY_UPDATE),
  validateBody(rejectItemSchema),
  itemsController.rejectItem
)
router.patch(
  '/:itemId/batch',
  authorize(PERMISSIONS.INVENTORY_UPDATE),
  validateBody(assignBatchSchema),
  itemsController.assignBatch
)
router.patch(
  '/:itemId/serial',
  authorize(PERMISSIONS.INVENTORY_UPDATE),
  validateBody(assignSerialSchema),
  itemsController.assignSerial
)

export default router
