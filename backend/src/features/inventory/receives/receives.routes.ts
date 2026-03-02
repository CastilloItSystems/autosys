// backend/src/features/inventory/receives/receives.routes.ts

import { Router } from 'express'
import { ReceiveController } from './receives.controller'
import { authenticate } from '../../../shared/middleware/authenticate.middleware'
import { authorize } from '../../../shared/middleware/authorize.middleware'
import { validateBody } from '../../../shared/middleware/validateRequest.middleware'
import {
  createReceiveSchema,
  updateReceiveSchema,
  addReceiveItemSchema,
} from './receives.validation'
import { PERMISSIONS } from '../../../shared/constants/permissions'

const router = Router()
const controller = new ReceiveController()

/**
 * @swagger
 * /api/inventory/receives:
 *   get:
 *     tags:
 *       - Receives
 *     summary: Obtener todas las recepciones
 *     description: Obtiene un listado paginado de recepciones
 *     parameters:
 *       - name: page
 *         in: query
 *         type: integer
 *         default: 1
 *       - name: limit
 *         in: query
 *         type: integer
 *         default: 20
 *       - name: status
 *         in: query
 *         type: string
 *         enum: [DRAFT, COMPLETED, CANCELLED]
 *       - name: purchaseOrderId
 *         in: query
 *         type: string
 *         format: uuid
 *     responses:
 *       200:
 *         description: Listado de recepciones
 */
router.get(
  '/',
  authenticate,
  authorize(PERMISSIONS.INVENTORY_VIEW),
  controller.getAll
)

/**
 * @swagger
 * /api/inventory/receives:
 *   post:
 *     tags:
 *       - Receives
 *     summary: Crear nueva recepción
 *     parameters:
 *       - name: body
 *         in: body
 *         required: true
 *         schema:
 *           type: object
 *           required:
 *             - purchaseOrderId
 *             - warehouseId
 *           properties:
 *             purchaseOrderId:
 *               type: string
 *               format: uuid
 *             warehouseId:
 *               type: string
 *               format: uuid
 *     responses:
 *       201:
 *         description: Recepción creada
 */
router.post(
  '/',
  authenticate,
  authorize(PERMISSIONS.INVENTORY_CREATE),
  validateBody(createReceiveSchema),
  controller.create
)

/**
 * @swagger
 * /api/inventory/receives/{id}:
 *   get:
 *     tags:
 *       - Receives
 *     summary: Obtener recepción
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         type: string
 *         format: uuid
 *     responses:
 *       200:
 *         description: Recepción encontrada
 */
router.get(
  '/:id',
  authenticate,
  authorize(PERMISSIONS.INVENTORY_VIEW),
  controller.getOne
)

/**
 * @swagger
 * /api/inventory/receives/{id}:
 *   put:
 *     tags:
 *       - Receives
 *     summary: Actualizar recepción
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
 *               enum: [DRAFT, COMPLETED, CANCELLED]
 *     responses:
 *       200:
 *         description: Recepción actualizada
 */
router.put(
  '/:id',
  authenticate,
  authorize(PERMISSIONS.INVENTORY_UPDATE),
  validateBody(updateReceiveSchema),
  controller.update
)

/**
 * @swagger
 * /api/inventory/receives/{id}/items:
 *   post:
 *     tags:
 *       - Receives
 *     summary: Agregar item a recepción
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
  validateBody(addReceiveItemSchema),
  controller.addItem
)

/**
 * @swagger
 * /api/inventory/receives/{id}/items:
 *   get:
 *     tags:
 *       - Receives
 *     summary: Obtener items de recepción
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
  controller.getItems
)

/**
 * @swagger
 * /api/inventory/receives/{id}:
 *   delete:
 *     tags:
 *       - Receives
 *     summary: Eliminar recepción
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         description: Recepción eliminada
 */
router.delete(
  '/:id',
  authenticate,
  authorize(PERMISSIONS.INVENTORY_DELETE),
  controller.delete
)

export default router
