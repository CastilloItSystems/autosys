// backend/src/features/inventory/cycleCounts/cycleCounts.routes.ts

import { Router } from 'express'
import { CycleCountController } from './cycleCounts.controller.js'
import { authenticate } from '../../../shared/middleware/authenticate.middleware.js'
import { authorize } from '../../../shared/middleware/authorize.middleware.js'
import { validateBody } from '../../../shared/middleware/validateRequest.middleware.js'
import {
  createCycleCountSchema,
  updateCycleCountSchema,
  startCycleCountSchema,
  completeCycleCountSchema,
  approveCycleCountSchema,
  applyCycleCountSchema,
  addCycleCountItemSchema,
} from './cycleCounts.validation.js'
import { PERMISSIONS } from '../../../shared/constants/permissions.js'

const router = Router()

/**
 * @swagger
 * tags:
 *   name: Cycle Counts
 *   description: Operaciones de ciclos de conteo de inventario
 */

/**
 * @swagger
 * /api/inventory/cycle-counts:
 *   get:
 *     summary: Obtener todos los ciclos de conteo
 *     tags: [Cycle Counts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: warehouseId
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [DRAFT, IN_PROGRESS, APPROVED, APPLIED, REJECTED, CANCELLED]
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lista de ciclos de conteo
 */
router.get(
  '/',
  authenticate,
  authorize(PERMISSIONS.INVENTORY_VIEW),
  CycleCountController.getAll
)

/**
 * @swagger
 * /api/inventory/cycle-counts/{id}:
 *   get:
 *     summary: Obtener ciclo de conteo por ID
 *     tags: [Cycle Counts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: includeItems
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Ciclo de conteo encontrado
 *       404:
 *         description: No encontrado
 */
router.get(
  '/:id',
  authenticate,
  authorize(PERMISSIONS.INVENTORY_VIEW),
  CycleCountController.getOne
)

/**
 * @swagger
 * /api/inventory/cycle-counts:
 *   post:
 *     summary: Crear nuevo ciclo de conteo
 *     tags: [Cycle Counts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [warehouseId, items]
 *             properties:
 *               warehouseId:
 *                 type: string
 *               notes:
 *                 type: string
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       201:
 *         description: Ciclo creado exitosamente
 */
router.post(
  '/',
  authenticate,
  authorize(PERMISSIONS.INVENTORY_CREATE),
  validateBody(createCycleCountSchema),
  CycleCountController.create
)

/**
 * @swagger
 * /api/inventory/cycle-counts/{id}:
 *   put:
 *     summary: Actualizar ciclo de conteo
 *     tags: [Cycle Counts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
 *               notes:
 *                 type: string
 *               remarks:
 *                 type: string
 *     responses:
 *       200:
 *         description: Ciclo actualizado
 */
router.put(
  '/:id',
  authenticate,
  authorize(PERMISSIONS.INVENTORY_UPDATE),
  validateBody(updateCycleCountSchema),
  CycleCountController.update
)

/**
 * @swagger
 * /api/inventory/cycle-counts/{id}/start:
 *   patch:
 *     summary: Iniciar ciclo de conteo (DRAFT → IN_PROGRESS)
 *     tags: [Cycle Counts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [startedBy]
 *             properties:
 *               startedBy:
 *                 type: string
 *     responses:
 *       200:
 *         description: Ciclo iniciado
 */
router.patch(
  '/:id/start',
  authenticate,
  authorize(PERMISSIONS.INVENTORY_UPDATE),
  validateBody(startCycleCountSchema),
  CycleCountController.start
)

/**
 * @swagger
 * /api/inventory/cycle-counts/{id}/complete:
 *   patch:
 *     summary: Completar ciclo de conteo (IN_PROGRESS → APPROVED)
 *     tags: [Cycle Counts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [completedBy]
 *             properties:
 *               completedBy:
 *                 type: string
 *     responses:
 *       200:
 *         description: Ciclo completado
 */
router.patch(
  '/:id/complete',
  authenticate,
  authorize(PERMISSIONS.INVENTORY_UPDATE),
  validateBody(completeCycleCountSchema),
  CycleCountController.complete
)

/**
 * @swagger
 * /api/inventory/cycle-counts/{id}/approve:
 *   patch:
 *     summary: Aprobar ciclo de conteo (APPROVED state already set on complete)
 *     tags: [Cycle Counts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [approvedBy]
 *             properties:
 *               approvedBy:
 *                 type: string
 *     responses:
 *       200:
 *         description: Ciclo aprobado
 */
router.patch(
  '/:id/approve',
  authenticate,
  authorize(PERMISSIONS.INVENTORY_UPDATE),
  validateBody(approveCycleCountSchema),
  CycleCountController.approve
)

/**
 * @swagger
 * /api/inventory/cycle-counts/{id}/apply:
 *   patch:
 *     summary: Aplicar ciclo de conteo (APPROVED → APPLIED, actualizar stock)
 *     tags: [Cycle Counts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [appliedBy]
 *             properties:
 *               appliedBy:
 *                 type: string
 *     responses:
 *       200:
 *         description: Ciclo aplicado, stock actualizado
 */
router.patch(
  '/:id/apply',
  authenticate,
  authorize(PERMISSIONS.INVENTORY_UPDATE),
  validateBody(applyCycleCountSchema),
  CycleCountController.apply
)

/**
 * @swagger
 * /api/inventory/cycle-counts/{id}/reject:
 *   patch:
 *     summary: Rechazar ciclo de conteo
 *     tags: [Cycle Counts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Ciclo rechazado
 */
router.patch(
  '/:id/reject',
  authenticate,
  authorize(PERMISSIONS.INVENTORY_UPDATE),
  CycleCountController.reject
)

/**
 * @swagger
 * /api/inventory/cycle-counts/{id}/cancel:
 *   patch:
 *     summary: Cancelar ciclo de conteo
 *     tags: [Cycle Counts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Ciclo cancelado
 */
router.patch(
  '/:id/cancel',
  authenticate,
  authorize(PERMISSIONS.INVENTORY_UPDATE),
  CycleCountController.cancel
)

/**
 * @swagger
 * /api/inventory/cycle-counts/{id}/items:
 *   post:
 *     summary: Agregar item al ciclo de conteo
 *     tags: [Cycle Counts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [itemId, expectedQuantity]
 *             properties:
 *               itemId:
 *                 type: string
 *               expectedQuantity:
 *                 type: number
 *               location:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Item agregado
 */
router.post(
  '/:id/items',
  authenticate,
  authorize(PERMISSIONS.INVENTORY_CREATE),
  validateBody(addCycleCountItemSchema),
  CycleCountController.addItem
)

/**
 * @swagger
 * /api/inventory/cycle-counts/{id}/items:
 *   get:
 *     summary: Obtener items del ciclo de conteo
 *     tags: [Cycle Counts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Items del ciclo
 */
router.get(
  '/:id/items',
  authenticate,
  authorize(PERMISSIONS.INVENTORY_VIEW),
  CycleCountController.getItems
)

/**
 * @swagger
 * /api/inventory/cycle-counts/{id}/items/{itemId}:
 *   patch:
 *     summary: Actualizar cantidad contada de un item
 *     tags: [Cycle Counts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
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
 *             required: [countedQuantity]
 *             properties:
 *               countedQuantity:
 *                 type: number
 *     responses:
 *       200:
 *         description: Cantidad contada actualizada
 */
router.patch(
  '/:id/items/:itemId',
  authenticate,
  authorize(PERMISSIONS.INVENTORY_UPDATE),
  CycleCountController.updateItemCountedQuantity
)

/**
 * @swagger
 * /api/inventory/cycle-counts/{id}:
 *   delete:
 *     summary: Eliminar ciclo de conteo (solo DRAFT)
 *     tags: [Cycle Counts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Ciclo eliminado
 */
router.delete(
  '/:id',
  authenticate,
  authorize(PERMISSIONS.INVENTORY_DELETE),
  CycleCountController.delete
)

export default router
