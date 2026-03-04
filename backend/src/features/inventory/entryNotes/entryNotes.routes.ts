// backend/src/features/inventory/entryNotes/entryNotes.routes.ts

import { Router } from 'express'
import entryNoteController from './entryNotes.controller'
import { authenticate } from '../../../shared/middleware/authenticate.middleware'
import { authorize } from '../../../shared/middleware/authorize.middleware'
import {
  validateBody,
  validateParams,
  validateQuery,
} from '../../../shared/middleware/validateRequest.middleware'
import {
  createEntryNoteSchema,
  updateEntryNoteSchema,
  addEntryNoteItemSchema,
  entryNoteIdSchema,
  getEntryNotesQuerySchema,
} from './entryNotes.validation'
import { PERMISSIONS } from '../../../shared/constants/permissions'

const router = Router()

/**
 * @swagger
 * /api/inventory/entry-notes:
 *   get:
 *     tags:
 *       - EntryNotes
 *     summary: Obtener todas las notas de entrada
 *     description: Obtiene un listado paginado de notas de entrada con filtros
 *     parameters:
 *       - name: page
 *         in: query
 *         type: integer
 *         default: 1
 *       - name: limit
 *         in: query
 *         type: integer
 *         default: 20
 *       - name: type
 *         in: query
 *         type: string
 *         enum: [PURCHASE, RETURN, TRANSFER, WARRANTY_RETURN, LOAN_RETURN, ADJUSTMENT_IN, DONATION, SAMPLE, OTHER]
 *       - name: status
 *         in: query
 *         type: string
 *         enum: [PENDING, IN_PROGRESS, COMPLETED, CANCELLED]
 *       - name: purchaseOrderId
 *         in: query
 *         type: string
 *         format: uuid
 *       - name: warehouseId
 *         in: query
 *         type: string
 *         format: uuid
 *     responses:
 *       200:
 *         description: Listado de notas de entrada
 */
router.get(
  '/',
  authenticate,
  authorize(PERMISSIONS.INVENTORY_VIEW),
  validateQuery(getEntryNotesQuerySchema),
  entryNoteController.getAll
)

/**
 * @swagger
 * /api/inventory/entry-notes:
 *   post:
 *     tags:
 *       - EntryNotes
 *     summary: Crear nueva nota de entrada
 *     parameters:
 *       - name: body
 *         in: body
 *         required: true
 *         schema:
 *           type: object
 *           required:
 *             - warehouseId
 *           properties:
 *             type:
 *               type: string
 *               enum: [PURCHASE, RETURN, TRANSFER, WARRANTY_RETURN, LOAN_RETURN, ADJUSTMENT_IN, DONATION, SAMPLE, OTHER]
 *             purchaseOrderId:
 *               type: string
 *               format: uuid
 *             warehouseId:
 *               type: string
 *               format: uuid
 *     responses:
 *       201:
 *         description: Nota de entrada creada
 */
router.post(
  '/',
  authenticate,
  authorize(PERMISSIONS.INVENTORY_CREATE),
  validateBody(createEntryNoteSchema),
  entryNoteController.create
)

/**
 * @swagger
 * /api/inventory/entry-notes/{id}:
 *   get:
 *     tags:
 *       - EntryNotes
 *     summary: Obtener nota de entrada
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         type: string
 *         format: uuid
 *     responses:
 *       200:
 *         description: Nota de entrada encontrada
 */
router.get(
  '/:id',
  authenticate,
  authorize(PERMISSIONS.INVENTORY_VIEW),
  validateParams(entryNoteIdSchema),
  entryNoteController.getOne
)

/**
 * @swagger
 * /api/inventory/entry-notes/{id}:
 *   put:
 *     tags:
 *       - EntryNotes
 *     summary: Actualizar nota de entrada
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         type: string
 *       - name: body
 *         in: body
 *         schema:
 *           type: object
 *           properties:
 *             status:
 *               type: string
 *               enum: [PENDING, IN_PROGRESS, COMPLETED, CANCELLED]
 *             notes:
 *               type: string
 *     responses:
 *       200:
 *         description: Nota de entrada actualizada
 */
router.put(
  '/:id',
  authenticate,
  authorize(PERMISSIONS.INVENTORY_UPDATE),
  validateParams(entryNoteIdSchema),
  validateBody(updateEntryNoteSchema),
  entryNoteController.update
)

/**
 * @swagger
 * /api/inventory/entry-notes/{id}/items:
 *   post:
 *     tags:
 *       - EntryNotes
 *     summary: Agregar item a nota de entrada
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         type: string
 *       - name: body
 *         in: body
 *         required: true
 *         schema:
 *           type: object
 *           required:
 *             - itemId
 *             - quantityReceived
 *             - unitCost
 *     responses:
 *       201:
 *         description: Item agregado
 */
router.post(
  '/:id/items',
  authenticate,
  authorize(PERMISSIONS.INVENTORY_CREATE),
  validateParams(entryNoteIdSchema),
  validateBody(addEntryNoteItemSchema),
  entryNoteController.addItem
)

/**
 * @swagger
 * /api/inventory/entry-notes/{id}/items:
 *   get:
 *     tags:
 *       - EntryNotes
 *     summary: Obtener items de nota de entrada
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         description: Items obtenidos
 */
router.get(
  '/:id/items',
  authenticate,
  authorize(PERMISSIONS.INVENTORY_VIEW),
  validateParams(entryNoteIdSchema),
  entryNoteController.getItems
)

/**
 * @swagger
 * /api/inventory/entry-notes/{id}:
 *   delete:
 *     tags:
 *       - EntryNotes
 *     summary: Eliminar nota de entrada
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         description: Nota de entrada eliminada
 */
router.delete(
  '/:id',
  authenticate,
  authorize(PERMISSIONS.INVENTORY_DELETE),
  validateParams(entryNoteIdSchema),
  entryNoteController.delete
)

/**
 * @swagger
 * /api/inventory/entry-notes/{id}/start:
 *   post:
 *     tags:
 *       - EntryNotes
 *     summary: Iniciar procesamiento de nota de entrada
 *     description: Cambia estado de PENDING a IN_PROGRESS
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         type: string
 *         format: uuid
 *     responses:
 *       200:
 *         description: Nota de entrada iniciada
 */
router.post(
  '/:id/start',
  authenticate,
  authorize(PERMISSIONS.INVENTORY_UPDATE),
  validateParams(entryNoteIdSchema),
  entryNoteController.start
)

/**
 * @swagger
 * /api/inventory/entry-notes/{id}/complete:
 *   post:
 *     tags:
 *       - EntryNotes
 *     summary: Completar nota de entrada
 *     description: Cambia estado de IN_PROGRESS a COMPLETED, actualiza stock y crea movimientos
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         type: string
 *         format: uuid
 *     responses:
 *       200:
 *         description: Nota de entrada completada con stock actualizado
 */
router.post(
  '/:id/complete',
  authenticate,
  authorize(PERMISSIONS.INVENTORY_UPDATE),
  validateParams(entryNoteIdSchema),
  entryNoteController.complete
)

/**
 * @swagger
 * /api/inventory/entry-notes/{id}/cancel:
 *   post:
 *     tags:
 *       - EntryNotes
 *     summary: Cancelar nota de entrada
 *     description: Cambia estado a CANCELLED (desde PENDING o IN_PROGRESS)
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         type: string
 *         format: uuid
 *     responses:
 *       200:
 *         description: Nota de entrada cancelada
 */
router.post(
  '/:id/cancel',
  authenticate,
  authorize(PERMISSIONS.INVENTORY_UPDATE),
  validateParams(entryNoteIdSchema),
  entryNoteController.cancel
)

export default router
