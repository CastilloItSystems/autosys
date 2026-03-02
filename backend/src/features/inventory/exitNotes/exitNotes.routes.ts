/**
 * Exit Notes Routes
 * Express router for exit note management endpoints
 */

import { Router } from 'express'
import { validateRequest } from '../../../shared/middleware/validateRequest.middleware'
import { authenticate } from '../../../shared/middleware/authenticate.middleware'
import exitNotesController from './exitNotes.controller'
import {
  createExitNoteSchema,
  updateExitNoteSchema,
  markAsReadySchema,
  deliverExitNoteSchema,
  cancelExitNoteSchema,
  exitNoteFiltersSchema,
  exitNoteIdSchema,
} from './exitNotes.validation'

const router = Router({ mergeParams: true })

// Apply authentication middleware to all routes
router.use(authenticate)

/**
 * @swagger
 * /inventory/exit-notes:
 *   get:
 *     tags:
 *       - Exit Notes
 *     summary: Get all exit notes
 *     description: Retrieve exit notes with optional filters
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [SALE, WARRANTY, LOAN, INTERNAL_USE, SAMPLE, DONATION, OWNER_PICKUP, DEMO, TRANSFER, LOAN_RETURN, OTHER]
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, IN_PROGRESS, READY, DELIVERED, CANCELLED]
 *       - in: query
 *         name: warehouseId
 *         schema:
 *           type: string
 *       - in: query
 *         name: recipientId
 *         schema:
 *           type: string
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Exit notes retrieved successfully
 */
router.get(
  '/',
  validateRequest(exitNoteFiltersSchema),
  exitNotesController.getAll
)

/**
 * @swagger
 * /inventory/exit-notes/number/{exitNoteNumber}:
 *   get:
 *     tags:
 *       - Exit Notes
 *     summary: Get exit note by number
 *     parameters:
 *       - in: path
 *         name: exitNoteNumber
 *         required: true
 *         schema:
 *           type: string
 */
router.get('/number/:exitNoteNumber', exitNotesController.getByNumber)

/**
 * @swagger
 * /inventory/exit-notes/warehouse/{warehouseId}:
 *   get:
 *     tags:
 *       - Exit Notes
 *     summary: Get exit notes by warehouse
 *     parameters:
 *       - in: path
 *         name: warehouseId
 *         required: true
 *         schema:
 *           type: string
 */
router.get('/warehouse/:warehouseId', exitNotesController.getByWarehouse)

/**
 * @swagger
 * /inventory/exit-notes/type/{type}:
 *   get:
 *     tags:
 *       - Exit Notes
 *     summary: Get exit notes by type
 *     parameters:
 *       - in: path
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [SALE, WARRANTY, LOAN, INTERNAL_USE, SAMPLE, DONATION, OWNER_PICKUP, DEMO, TRANSFER, LOAN_RETURN, OTHER]
 */
router.get('/type/:type', exitNotesController.getByType)

/**
 * @swagger
 * /inventory/exit-notes/status/{status}:
 *   get:
 *     tags:
 *       - Exit Notes
 *     summary: Get exit notes by status
 *     parameters:
 *       - in: path
 *         name: status
 *         required: true
 *         schema:
 *           type: string
 *           enum: [PENDING, IN_PROGRESS, READY, DELIVERED, CANCELLED]
 */
router.get('/status/:status', exitNotesController.getByStatus)

/**
 * @swagger
 * /inventory/exit-notes:
 *   post:
 *     tags:
 *       - Exit Notes
 *     summary: Create new exit note
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [type, warehouseId, items]
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [SALE, WARRANTY, LOAN, INTERNAL_USE, SAMPLE, DONATION, OWNER_PICKUP, DEMO, TRANSFER, LOAN_RETURN, OTHER]
 *               warehouseId:
 *                 type: string
 *               preInvoiceId:
 *                 type: string
 *               recipientName:
 *                 type: string
 *               recipientId:
 *                 type: string
 *               items:
 *                 type: array
 *                 minItems: 1
 */
router.post(
  '/',
  validateRequest(createExitNoteSchema),
  exitNotesController.create
)

/**
 * @swagger
 * /inventory/exit-notes/{id}:
 *   get:
 *     tags:
 *       - Exit Notes
 *     summary: Get exit note by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 */
router.get('/:id', exitNotesController.getOne)

/**
 * @swagger
 * /inventory/exit-notes/{id}:
 *   put:
 *     tags:
 *       - Exit Notes
 *     summary: Update exit note
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 */
router.put(
  '/:id',
  validateRequest(updateExitNoteSchema),
  exitNotesController.update
)

/**
 * @swagger
 * /inventory/exit-notes/{id}/start:
 *   patch:
 *     tags:
 *       - Exit Notes
 *     summary: Start preparing exit note
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 */
router.patch('/:id/start', exitNotesController.startPreparing)

/**
 * @swagger
 * /inventory/exit-notes/{id}/ready:
 *   patch:
 *     tags:
 *       - Exit Notes
 *     summary: Mark exit note as ready
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 */
router.patch('/:id/ready', exitNotesController.markAsReady)

/**
 * @swagger
 * /inventory/exit-notes/{id}/deliver:
 *   patch:
 *     tags:
 *       - Exit Notes
 *     summary: Deliver exit note
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 */
router.patch('/:id/deliver', exitNotesController.deliver)

/**
 * @swagger
 * /inventory/exit-notes/{id}/cancel:
 *   patch:
 *     tags:
 *       - Exit Notes
 *     summary: Cancel exit note
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 */
router.patch(
  '/:id/cancel',
  validateRequest(cancelExitNoteSchema),
  exitNotesController.cancel
)

/**
 * @swagger
 * /inventory/exit-notes/{id}/status:
 *   get:
 *     tags:
 *       - Exit Notes
 *     summary: Get exit note status info
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 */
router.get('/:id/status', exitNotesController.getStatusInfo)

/**
 * @swagger
 * /inventory/exit-notes/{id}/summary:
 *   get:
 *     tags:
 *       - Exit Notes
 *     summary: Get exit note summary
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 */
router.get('/:id/summary', exitNotesController.getSummary)

export default router
