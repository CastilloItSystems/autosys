// backend/src/features/inventory/entryNotes/entryNotes.routes.ts

import { Router } from 'express'
import entryNoteController from './entryNotes.controller.js'
import { authorize } from '../../../shared/middleware/authorize.middleware.js'
import {
  validateBody,
  validateParams,
  validateQuery,
} from '../../../shared/middleware/validateRequest.middleware.js'
import {
  createEntryNoteSchema,
  updateEntryNoteSchema,
  addEntryNoteItemSchema,
  entryNoteIdSchema,
  getEntryNotesQuerySchema,
} from './entryNotes.validation.js'
import { PERMISSIONS } from '../../../shared/constants/permissions.js'

const router = Router()

/**
 * ============================================
 * COLLECTION
 * ============================================
 */

// GET /api/inventory/entry-notes
router.get(
  '/',
  authorize(PERMISSIONS.INVENTORY_VIEW),
  validateQuery(getEntryNotesQuerySchema),
  entryNoteController.getAll
)

// POST /api/inventory/entry-notes
router.post(
  '/',
  authorize(PERMISSIONS.INVENTORY_CREATE),
  validateBody(createEntryNoteSchema),
  entryNoteController.create
)

/**
 * ============================================
 * RESOURCE ACTIONS
 * ============================================
 */

// POST /api/inventory/entry-notes/:id/start
router.post(
  '/:id/start',
  authorize(PERMISSIONS.INVENTORY_UPDATE),
  validateParams(entryNoteIdSchema),
  entryNoteController.start
)

// POST /api/inventory/entry-notes/:id/complete
router.post(
  '/:id/complete',
  authorize(PERMISSIONS.INVENTORY_UPDATE),
  validateParams(entryNoteIdSchema),
  entryNoteController.complete
)

// POST /api/inventory/entry-notes/:id/cancel
router.post(
  '/:id/cancel',
  authorize(PERMISSIONS.INVENTORY_UPDATE),
  validateParams(entryNoteIdSchema),
  entryNoteController.cancel
)

/**
 * ============================================
 * ITEMS
 * ============================================
 */

// GET /api/inventory/entry-notes/:id/items
router.get(
  '/:id/items',
  authorize(PERMISSIONS.INVENTORY_VIEW),
  validateParams(entryNoteIdSchema),
  entryNoteController.getItems
)

// POST /api/inventory/entry-notes/:id/items
router.post(
  '/:id/items',
  authorize(PERMISSIONS.INVENTORY_CREATE),
  validateParams(entryNoteIdSchema),
  validateBody(addEntryNoteItemSchema),
  entryNoteController.addItem
)

/**
 * ============================================
 * CRUD GENERAL
 * ============================================
 */

// GET /api/inventory/entry-notes/:id
router.get(
  '/:id',
  authorize(PERMISSIONS.INVENTORY_VIEW),
  validateParams(entryNoteIdSchema),
  entryNoteController.getOne
)

// PUT /api/inventory/entry-notes/:id
router.put(
  '/:id',
  authorize(PERMISSIONS.INVENTORY_UPDATE),
  validateParams(entryNoteIdSchema),
  validateBody(updateEntryNoteSchema),
  entryNoteController.update
)

// DELETE /api/inventory/entry-notes/:id
router.delete(
  '/:id',
  authorize(PERMISSIONS.INVENTORY_DELETE),
  validateParams(entryNoteIdSchema),
  entryNoteController.delete
)

export default router
