// backend/src/features/inventory/transfers/transfers.routes.ts

/**
 * @swagger
 * tags:
 *   - name: Inventory - Transfers
 *     description: Gestión de transferencias entre almacenes
 *
 * /inventory/transfers:
 *   get:
 *     summary: Obtener lista de transferencias
 *     tags: [Inventory - Transfers]
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
 *         name: fromWarehouseId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: toWarehouseId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [DRAFT, IN_TRANSIT, RECEIVED, CANCELLED]
 *     responses:
 *       200:
 *         description: Lista de transferencias obtenida
 *
 *   post:
 *     summary: Crear nueva transferencia
 *     tags: [Inventory - Transfers]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fromWarehouseId
 *               - toWarehouseId
 *               - items
 *             properties:
 *               fromWarehouseId:
 *                 type: string
 *                 format: uuid
 *               toWarehouseId:
 *                 type: string
 *                 format: uuid
 *               items:
 *                 type: array
 *                 minItems: 1
 *                 items:
 *                   type: object
 *                   properties:
 *                     itemId:
 *                       type: string
 *                       format: uuid
 *                     quantity:
 *                       type: integer
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Transferencia creada exitosamente
 *
 * /inventory/transfers/{id}:
 *   get:
 *     summary: Obtener transferencia por ID
 *     tags: [Inventory - Transfers]
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
 *         description: Transferencia obtenida
 *
 *   put:
 *     summary: Actualizar transferencia
 *     tags: [Inventory - Transfers]
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
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Transferencia actualizada
 *
 * /inventory/transfers/{id}/send:
 *   patch:
 *     summary: Enviar  transferencia (marcar como en tránsito)
 *     tags: [Inventory - Transfers]
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
 *               - sentBy
 *             properties:
 *               sentBy:
 *                 type: string
 *     responses:
 *       200:
 *         description: Transferencia enviada
 *
 * /inventory/transfers/{id}/receive:
 *   patch:
 *     summary: Recibir transferencia
 *     tags: [Inventory - Transfers]
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
 *               - receivedBy
 *             properties:
 *               receivedBy:
 *                 type: string
 *     responses:
 *       200:
 *         description: Transferencia recibida
 *
 * /inventory/transfers/{id}/cancel:
 *   patch:
 *     summary: Cancelar transferencia
 *     tags: [Inventory - Transfers]
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
 *         description: Transferencia cancelada
 */

import { Router } from 'express'
import { authenticate } from '../../../shared/middleware/auth.middleware'
import { validateRequest } from '../../../shared/middleware/validateRequest.middleware'
import TransfersController from './transfers.controller'
import {
  createTransferSchema,
  updateTransferSchema,
  sendTransferSchema,
  receiveTransferSchema,
  transferFiltersSchema,
  transferIdSchema,
} from './transfers.validation'

const router = Router()

// Middleware
router.use(authenticate)

// Routes with specific paths first
router.patch(
  '/:id/send',
  validateRequest(transferIdSchema, 'params'),
  validateRequest(sendTransferSchema, 'body'),
  TransfersController.send
)

router.patch(
  '/:id/receive',
  validateRequest(transferIdSchema, 'params'),
  validateRequest(receiveTransferSchema, 'body'),
  TransfersController.receive
)

router.patch(
  '/:id/cancel',
  validateRequest(transferIdSchema, 'params'),
  TransfersController.cancel
)

// Generic routes
router.get(
  '/',
  validateRequest(transferFiltersSchema, 'query'),
  TransfersController.getAll
)

router.post(
  '/',
  validateRequest(createTransferSchema, 'body'),
  TransfersController.create
)

router.get(
  '/:id',
  validateRequest(transferIdSchema, 'params'),
  TransfersController.getOne
)

router.put(
  '/:id',
  validateRequest(transferIdSchema, 'params'),
  validateRequest(updateTransferSchema, 'body'),
  TransfersController.update
)

export default router
