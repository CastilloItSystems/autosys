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
 *           enum: [DRAFT, PENDING_APPROVAL, APPROVED, REJECTED, CANCELLED]
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Buscar por número de transferencia o notas
 *     responses:
 *       200:
 *         description: Lista de transferencias obtenida
 *
 *   post:
 *     summary: Crear nueva transferencia (estado DRAFT)
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
 *     summary: Actualizar transferencia (solo en estado DRAFT)
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
 *   delete:
 *     summary: Eliminar transferencia (solo en estado DRAFT)
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
 *       204:
 *         description: Transferencia eliminada
 *
 * /inventory/transfers/{id}/submit:
 *   patch:
 *     summary: Enviar transferencia para aprobación (DRAFT → PENDING_APPROVAL)
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
 *         description: Transferencia enviada para aprobación
 *
 * /inventory/transfers/{id}/approve:
 *   patch:
 *     summary: Aprobar transferencia (PENDING_APPROVAL → APPROVED)
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
 *         description: Transferencia aprobada
 *
 * /inventory/transfers/{id}/reject:
 *   patch:
 *     summary: Rechazar transferencia (PENDING_APPROVAL → REJECTED)
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
 *               - reason
 *             properties:
 *               reason:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 500
 *     responses:
 *       200:
 *         description: Transferencia rechazada
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
import { authorize } from '../../../shared/middleware/authorize.middleware'
import { validateRequest } from '../../../shared/middleware/validateRequest.middleware'
import { PERMISSIONS } from '../../../shared/constants/permissions'
import TransfersController from './transfers.controller'
import {
  createTransferSchema,
  updateTransferSchema,
  rejectTransferSchema,
  transferFiltersSchema,
  transferIdSchema,
} from './transfers.validation'

const router = Router()

// Middleware
router.use(authenticate)

// ─── Approval flow routes ───────────────────────────────────────────

router.patch(
  '/:id/submit',
  authorize(PERMISSIONS.STOCK_TRANSFER),
  validateRequest(transferIdSchema, 'params'),
  TransfersController.submit
)

router.patch(
  '/:id/approve',
  authorize(PERMISSIONS.TRANSFER_APPROVE),
  validateRequest(transferIdSchema, 'params'),
  TransfersController.approve
)

router.patch(
  '/:id/reject',
  authorize(PERMISSIONS.TRANSFER_APPROVE),
  validateRequest(transferIdSchema, 'params'),
  validateRequest(rejectTransferSchema, 'body'),
  TransfersController.reject
)

// ─── State transition routes ────────────────────────────────────────

router.patch(
  '/:id/cancel',
  authorize(PERMISSIONS.STOCK_TRANSFER),
  validateRequest(transferIdSchema, 'params'),
  TransfersController.cancel
)

// ─── CRUD routes ────────────────────────────────────────────────────

router.get(
  '/',
  authorize(PERMISSIONS.STOCK_TRANSFER),
  validateRequest(transferFiltersSchema, 'query'),
  TransfersController.getAll
)

router.post(
  '/',
  authorize(PERMISSIONS.STOCK_TRANSFER),
  validateRequest(createTransferSchema, 'body'),
  TransfersController.create
)

router.get(
  '/:id',
  authorize(PERMISSIONS.STOCK_TRANSFER),
  validateRequest(transferIdSchema, 'params'),
  TransfersController.getOne
)

router.put(
  '/:id',
  authorize(PERMISSIONS.STOCK_TRANSFER),
  validateRequest(transferIdSchema, 'params'),
  validateRequest(updateTransferSchema, 'body'),
  TransfersController.update
)

router.delete(
  '/:id',
  authorize(PERMISSIONS.STOCK_TRANSFER),
  validateRequest(transferIdSchema, 'params'),
  TransfersController.remove
)

export default router
