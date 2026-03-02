/**
 * Exit Notes Items Routes
 * Express router for item management within exit notes
 */

import { Router } from 'express'
import { asyncHandler } from '../../../../shared/middleware/asyncHandler'
import { authenticate } from '../../../../shared/middleware/authenticate'
import * as itemsController from './items.controller'

const router = Router({ mergeParams: true })

// Apply authentication middleware
router.use(authenticate)

/**
 * @swagger
 * /inventory/exit-notes/{exitNoteId}/items:
 *   get:
 *     tags:
 *       - Exit Notes Items
 *     summary: Get all items for an exit note
 *     parameters:
 *       - in: path
 *         name: exitNoteId
 *         required: true
 *         schema:
 *           type: string
 */
router.get('/', asyncHandler(itemsController.getItems))

/**
 * @swagger
 * /inventory/exit-notes/{exitNoteId}/items/{itemId}:
 *   get:
 *     tags:
 *       - Exit Notes Items
 *     summary: Get a specific item
 *     parameters:
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: string
 */
router.get('/:itemId', asyncHandler(itemsController.getItem))

/**
 * @swagger
 * /inventory/exit-notes/{exitNoteId}/items/{itemId}/pick:
 *   patch:
 *     tags:
 *       - Exit Notes Items
 *     summary: Record item picking
 *     parameters:
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               quantityPicked:
 *                 type: number
 *               location:
 *                 type: string
 *               notes:
 *                 type: string
 */
router.patch('/:itemId/pick', asyncHandler(itemsController.recordPicking))

/**
 * @swagger
 * /inventory/exit-notes/{exitNoteId}/items/{itemId}/batch:
 *   patch:
 *     tags:
 *       - Exit Notes Items
 *     summary: Assign batch to item
 *     parameters:
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: string
 */
router.patch('/:itemId/batch', asyncHandler(itemsController.assignBatch))

/**
 * @swagger
 * /inventory/exit-notes/{exitNoteId}/items/{itemId}/serial:
 *   patch:
 *     tags:
 *       - Exit Notes Items
 *     summary: Assign serial number to item
 *     parameters:
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: string
 */
router.patch('/:itemId/serial', asyncHandler(itemsController.assignSerial))

/**
 * @swagger
 * /inventory/exit-notes/{exitNoteId}/items/{itemId}/verify:
 *   patch:
 *     tags:
 *       - Exit Notes Items
 *     summary: Verify item
 *     parameters:
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: string
 */
router.patch('/:itemId/verify', asyncHandler(itemsController.verifyItem))

/**
 * @swagger
 * /inventory/exit-notes/{exitNoteId}/items/{itemId}/reject:
 *   patch:
 *     tags:
 *       - Exit Notes Items
 *     summary: Reject item
 *     parameters:
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: string
 */
router.patch('/:itemId/reject', asyncHandler(itemsController.rejectItem))

/**
 * @swagger
 * /inventory/exit-notes/{exitNoteId}/items/summary:
 *   get:
 *     tags:
 *       - Exit Notes Items
 *     summary: Get items summary
 *     parameters:
 *       - in: path
 *         name: exitNoteId
 *         required: true
 *         schema:
 *           type: string
 */
router.get('/summary', asyncHandler(itemsController.getItemsSummary))

/**
 * @swagger
 * /inventory/exit-notes/items/batch/{batchId}:
 *   get:
 *     tags:
 *       - Exit Notes Items
 *     summary: Get items by batch
 *     parameters:
 *       - in: path
 *         name: batchId
 *         required: true
 *         schema:
 *           type: string
 */
router.get('/batch/:batchId', asyncHandler(itemsController.getItemsByBatch))

/**
 * @swagger
 * /inventory/exit-notes/items/serial/{serialNumberId}:
 *   get:
 *     tags:
 *       - Exit Notes Items
 *     summary: Get items by serial number
 *     parameters:
 *       - in: path
 *         name: serialNumberId
 *         required: true
 *         schema:
 *           type: string
 */
router.get(
  '/serial/:serialNumberId',
  asyncHandler(itemsController.getItemsBySerial)
)

export default router
