// backend/src/features/inventory/batches/batches.routes.ts

/**
 * @swagger
 * tags:
 *   - name: Inventory - Batches
 *     description: Gestión de lotes
 *
 * /inventory/batches:
 *   get:
 *     summary: Obtener lista de lotes
 *     tags: [Inventory - Batches]
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
 *         name: batchNumber
 *         schema:
 *           type: string
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ACTIVE, EXPIRED, EXPIRING_SOON, INACTIVE]
 *     responses:
 *       200:
 *         description: Lista de lotes obtenida
 *
 *   post:
 *     summary: Crear nuevo lote
 *     tags: [Inventory - Batches]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - batchNumber
 *               - itemId
 *               - initialQuantity
 *             properties:
 *               batchNumber:
 *                 type: string
 *               itemId:
 *                 type: string
 *                 format: uuid
 *               manufacturingDate:
 *                 type: string
 *                 format: date-time
 *               expiryDate:
 *                 type: string
 *                 format: date-time
 *               initialQuantity:
 *                 type: integer
 *                 minimum: 1
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Lote creado exitosamente
 *
 * /inventory/batches/{id}:
 *   get:
 *     summary: Obtener lote por ID
 *     tags: [Inventory - Batches]
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
 *         description: Lote obtenido
 *       404:
 *         description: Lote no encontrado
 *
 *   put:
 *     summary: Actualizar lote
 *     tags: [Inventory - Batches]
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
 *               currentQuantity:
 *                 type: integer
 *               notes:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Lote actualizado
 *       404:
 *         description: Lote no encontrado
 *
 *   delete:
 *     summary: Eliminar lote
 *     tags: [Inventory - Batches]
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
 *         description: Lote eliminado
 *       404:
 *         description: Lote no encontrado
 *
 * /inventory/batches/item/{itemId}:
 *   get:
 *     summary: Obtener lotes por item ID
 *     tags: [Inventory - Batches]
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
 *         description: Lotes obtenidos
 *
 * /inventory/batches/{id}/deactivate:
 *   patch:
 *     summary: Desactivar lote
 *     tags: [Inventory - Batches]
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
 *         description: Lote desactivado
 */

import { Router, Request, Response, NextFunction } from 'express'
import { authenticate } from '../../../shared/middleware/authenticate.middleware.js'
import { validateRequest } from '../../../shared/middleware/validateRequest.middleware.js'
import BatchesController from './batches.controller.js'
import {
  createBatchSchema,
  updateBatchSchema,
  batchFiltersSchema,
  batchIdSchema,
} from './batches.validation.js'
import expiryRoutes from './expiry/expiry.routes.js'

const router = Router()

// Middleware
router.use(authenticate)

// Mount expiry sub-routes
router.use('/expiry', expiryRoutes)

// Routes with specific paths first
router.get('/item/:itemId', BatchesController.getByItemId)

router.patch(
  '/:id/deactivate',
  validateRequest(batchIdSchema, 'params'),
  BatchesController.deactivate
)

// Generic routes
router.get(
  '/',
  validateRequest(batchFiltersSchema, 'query'),
  BatchesController.getAll
)

router.post(
  '/',
  validateRequest(createBatchSchema, 'body'),
  BatchesController.create
)

router.get(
  '/:id',
  validateRequest(batchIdSchema, 'params'),
  BatchesController.getOne
)

router.put(
  '/:id',
  validateRequest(batchIdSchema, 'params'),
  validateRequest(updateBatchSchema, 'body'),
  BatchesController.update
)

router.delete(
  '/:id',
  validateRequest(batchIdSchema, 'params'),
  BatchesController.delete
)

export default router
