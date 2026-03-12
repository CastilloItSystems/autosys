// backend/src/features/inventory/serialNumbers/serialNumbers.routes.ts

/**
 * @swagger
 * tags:
 *   - name: Inventory - Serial Numbers
 *     description: Gestión de números de serie
 *
 * /inventory/serial-numbers:
 *   get:
 *     summary: Obtener lista de números de serie
 *     tags: [Inventory - Serial Numbers]
 *     security:
 *       - BearerAuth: []
 *     parameters:
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
 *       - in: query
 *         name: itemId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: serialNumber
 *         schema:
 *           type: string
 *       - in: query
 *         name: warehouseId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [IN_STOCK, SOLD, DEFECTIVE, WARRANTY, LOANED]
 *     responses:
 *       200:
 *         description: Lista de números de serie obtenida
 *
 *   post:
 *     summary: Crear nuevo número de serie
 *     tags: [Inventory - Serial Numbers]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - serialNumber
 *               - itemId
 *             properties:
 *               serialNumber:
 *                 type: string
 *               itemId:
 *                 type: string
 *                 format: uuid
 *               warehouseId:
 *                 type: string
 *                 format: uuid
 *               status:
 *                 type: string
 *                 enum: [IN_STOCK, SOLD, DEFECTIVE, WARRANTY, LOANED]
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Número de serie creado exitosamente
 *
 * /inventory/serial-numbers/{id}:
 *   get:
 *     summary: Obtener número de serie por ID
 *     tags: [Inventory - Serial Numbers]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Número de serie obtenido
 *       404:
 *         description: Número de serie no encontrado
 *
 *   put:
 *     summary: Actualizar número de serie
 *     tags: [Inventory - Serial Numbers]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [IN_STOCK, SOLD, DEFECTIVE, WARRANTY, LOANED]
 *               warehouseId:
 *                 type: string
 *                 format: uuid
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Número de serie actualizado
 *
 *   delete:
 *     summary: Eliminar número de serie
 *     tags: [Inventory - Serial Numbers]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Número de serie eliminado
 *
 * /inventory/serial-numbers/search/{serialNumber}:
 *   get:
 *     summary: Buscar número de serie por su valor
 *     tags: [Inventory - Serial Numbers]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: serialNumber
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Número de serie encontrado
 *
 * /inventory/serial-numbers/item/{itemId}:
 *   get:
 *     summary: Obtener números de serie por item
 *     tags: [Inventory - Serial Numbers]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Números de serie obtenidos
 *
 * /inventory/serial-numbers/{id}/assign:
 *   patch:
 *     summary: Asignar número de serie a almacén
 *     tags: [Inventory - Serial Numbers]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - warehouseId
 *             properties:
 *               warehouseId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Número de serie asignado
 */

import { Router } from 'express'
import { authenticate } from '../../../shared/middleware/authenticate.middleware.js'
import { validateRequest } from '../../../shared/middleware/validateRequest.middleware.js'
import SerialNumbersController from './serialNumbers.controller.js'
import {
  createSerialNumberSchema,
  updateSerialNumberSchema,
  assignSerialSchema,
  serialFiltersSchema,
  serialIdSchema,
} from './serialNumbers.validation.js'
import trackingRoutes from './tracking/tracking.routes.js'

const router = Router()

// Middleware
router.use(authenticate)

// Mount tracking sub-routes
router.use('/:id/tracking', trackingRoutes)

// Routes with specific paths first
router.get('/search/:serialNumber', SerialNumbersController.getBySerialNumber)

router.get('/item/:itemId', SerialNumbersController.getByItemId)

router.get('/warehouse/:warehouseId', SerialNumbersController.getByWarehouseId)

router.get('/status/:status', SerialNumbersController.getByStatus)

router.patch(
  '/:id/assign',
  validateRequest(serialIdSchema, 'params'),
  validateRequest(assignSerialSchema, 'body'),
  SerialNumbersController.assignToWarehouse
)

// Generic routes
router.get(
  '/',
  validateRequest(serialFiltersSchema, 'query'),
  SerialNumbersController.getAll
)

router.post(
  '/',
  validateRequest(createSerialNumberSchema, 'body'),
  SerialNumbersController.create
)

router.get(
  '/:id',
  validateRequest(serialIdSchema, 'params'),
  SerialNumbersController.getOne
)

router.put(
  '/:id',
  validateRequest(serialIdSchema, 'params'),
  validateRequest(updateSerialNumberSchema, 'body'),
  SerialNumbersController.update
)

router.delete(
  '/:id',
  validateRequest(serialIdSchema, 'params'),
  SerialNumbersController.delete
)

export default router
