// backend/src/features/inventory/exitNotes/exitNotes.routes.ts

import { Router } from 'express'
import exitNotesController from './exitNotes.controller.js'
import { authorize } from '../../../shared/middleware/authorize.middleware.js'
import {
  validateBody,
  validateQuery,
} from '../../../shared/middleware/validateRequest.middleware.js'
import {
  createExitNoteSchema,
  updateExitNoteSchema,
  cancelExitNoteSchema,
  exitNoteFiltersSchema,
} from './exitNotes.validation.js'
import { PERMISSIONS } from '../../../shared/constants/permissions.js'
import itemsRouter from './items/items.routes.js'

const router = Router()

// -- Specialized reads (before /:id to avoid param conflicts) --
router.get(
  '/number/:exitNoteNumber',
  authorize(PERMISSIONS.INVENTORY_VIEW),
  exitNotesController.getByNumber
)
router.get(
  '/warehouse/:warehouseId',
  authorize(PERMISSIONS.INVENTORY_VIEW),
  exitNotesController.getByWarehouse
)
router.get(
  '/type/:type',
  authorize(PERMISSIONS.INVENTORY_VIEW),
  exitNotesController.getByType
)
router.get(
  '/status/:status',
  authorize(PERMISSIONS.INVENTORY_VIEW),
  exitNotesController.getByStatus
)

// -- Actions (before /:id) --
router.patch(
  '/:id/start',
  authorize(PERMISSIONS.INVENTORY_UPDATE),
  exitNotesController.startPreparing
)
router.patch(
  '/:id/ready',
  authorize(PERMISSIONS.INVENTORY_UPDATE),
  exitNotesController.markAsReady
)
router.patch(
  '/:id/deliver',
  authorize(PERMISSIONS.INVENTORY_UPDATE),
  exitNotesController.deliver
)
router.patch(
  '/:id/cancel',
  authorize(PERMISSIONS.INVENTORY_UPDATE),
  validateBody(cancelExitNoteSchema),
  exitNotesController.cancel
)

// -- Status/summary reads (before generic /:id) --
router.get(
  '/:id/tracking',
  authorize(PERMISSIONS.INVENTORY_VIEW),
  exitNotesController.getTracking
)
router.get(
  '/:id/status',
  authorize(PERMISSIONS.INVENTORY_VIEW),
  exitNotesController.getStatusInfo
)
router.get(
  '/:id/summary',
  authorize(PERMISSIONS.INVENTORY_VIEW),
  exitNotesController.getSummary
)

// -- CRUD --
router.get(
  '/',
  authorize(PERMISSIONS.INVENTORY_VIEW),
  validateQuery(exitNoteFiltersSchema),
  exitNotesController.getAll
)
router.post(
  '/',
  authorize(PERMISSIONS.INVENTORY_CREATE),
  validateBody(createExitNoteSchema),
  exitNotesController.create
)
router.get(
  '/:id',
  authorize(PERMISSIONS.INVENTORY_VIEW),
  exitNotesController.getOne
)
router.put(
  '/:id',
  authorize(PERMISSIONS.INVENTORY_UPDATE),
  validateBody(updateExitNoteSchema),
  exitNotesController.update
)

// -- Sub-router: items de la nota de salida --
// Mounted at: /api/inventory/exit-notes/:exitNoteId/items
router.use('/:exitNoteId/items', itemsRouter)

export default router
