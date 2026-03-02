// backend/src/features/inventory/reconciliations/reconciliations.routes.ts

import { Router } from 'express'
import { ReconciliationController } from './reconciliations.controller'
import { authenticate } from '../../../shared/middleware/authenticate.middleware'
import { authorize } from '../../../shared/middleware/authorize.middleware'
import { validateBody } from '../../../shared/middleware/validateRequest.middleware'
import {
  createReconciliationSchema,
  updateReconciliationSchema,
  startReconciliationSchema,
  completeReconciliationSchema,
  approveReconciliationSchema,
  applyReconciliationSchema,
  addReconciliationItemSchema,
} from './reconciliations.validation'
import { PERMISSIONS } from '../../../shared/constants/permissions'

const router = Router()

/**
 * @swagger
 * tags:
 *   name: Reconciliations
 *   description: Operaciones de reconciliación de inventario
 */

/**
 * @swagger
 * /api/inventory/reconciliations:
 *   get:
 *     summary: Obtener todas las reconciliaciones
 *     tags: [Reconciliations]
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
 *         name: source
 *         schema:
 *           type: string
 *           enum: [CYCLE_COUNT, PHYSICAL_INVENTORY, SYSTEM_ERROR, ADJUSTMENT, OTHER]
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
 *         description: Lista de reconciliaciones
 */
router.get(
  '/',
  authenticate,
  authorize(PERMISSIONS.INVENTORY_VIEW),
  ReconciliationController.getAll
)

/**
 * @swagger
 * /api/inventory/reconciliations/{id}:
 *   get:
 *     summary: Obtener reconciliación por ID
 *     tags: [Reconciliations]
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
 *         description: Reconciliación encontrada
 *       404:
 *         description: No encontrada
 */
router.get(
  '/:id',
  authenticate,
  authorize(PERMISSIONS.INVENTORY_VIEW),
  ReconciliationController.getOne
)

/**
 * @swagger
 * /api/inventory/reconciliations:
 *   post:
 *     summary: Crear nueva reconciliación
 *     tags: [Reconciliations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [warehouseId, source, reason, items]
 *             properties:
 *               warehouseId:
 *                 type: string
 *               source:
 *                 type: string
 *                 enum: [CYCLE_COUNT, PHYSICAL_INVENTORY, SYSTEM_ERROR, ADJUSTMENT, OTHER]
 *               reason:
 *                 type: string
 *               notes:
 *                 type: string
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       201:
 *         description: Reconciliación creada exitosamente
 */
router.post(
  '/',
  authenticate,
  authorize(PERMISSIONS.INVENTORY_CREATE),
  validateBody(createReconciliationSchema),
  ReconciliationController.create
)

/**
 * @swagger
 * /api/inventory/reconciliations/{id}:
 *   put:
 *     summary: Actualizar reconciliación
 *     tags: [Reconciliations]
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
 *               notes:
 *                 type: string
 *               remarks:
 *                 type: string
 *     responses:
 *       200:
 *         description: Reconciliación actualizada
 */
router.put(
  '/:id',
  authenticate,
  authorize(PERMISSIONS.INVENTORY_UPDATE),
  validateBody(updateReconciliationSchema),
  ReconciliationController.update
)

/**
 * @swagger
 * /api/inventory/reconciliations/{id}/start:
 *   patch:
 *     summary: Iniciar reconciliación (DRAFT → IN_PROGRESS)
 *     tags: [Reconciliations]
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
 *         description: Reconciliación iniciada
 */
router.patch(
  '/:id/start',
  authenticate,
  authorize(PERMISSIONS.INVENTORY_UPDATE),
  validateBody(startReconciliationSchema),
  ReconciliationController.start
)

/**
 * @swagger
 * /api/inventory/reconciliations/{id}/complete:
 *   patch:
 *     summary: Completar reconciliación (IN_PROGRESS → APPROVED)
 *     tags: [Reconciliations]
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
 *         description: Reconciliación completada
 */
router.patch(
  '/:id/complete',
  authenticate,
  authorize(PERMISSIONS.INVENTORY_UPDATE),
  validateBody(completeReconciliationSchema),
  ReconciliationController.complete
)

/**
 * @swagger
 * /api/inventory/reconciliations/{id}/approve:
 *   patch:
 *     summary: Aprobar reconciliación
 *     tags: [Reconciliations]
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
 *         description: Reconciliación aprobada
 */
router.patch(
  '/:id/approve',
  authenticate,
  authorize(PERMISSIONS.INVENTORY_UPDATE),
  validateBody(approveReconciliationSchema),
  ReconciliationController.approve
)

/**
 * @swagger
 * /api/inventory/reconciliations/{id}/apply:
 *   patch:
 *     summary: Aplicar reconciliación (APPROVED → APPLIED, actualizar stock)
 *     tags: [Reconciliations]
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
 *         description: Reconciliación aplicada, stock actualizado
 */
router.patch(
  '/:id/apply',
  authenticate,
  authorize(PERMISSIONS.INVENTORY_UPDATE),
  validateBody(applyReconciliationSchema),
  ReconciliationController.apply
)

/**
 * @swagger
 * /api/inventory/reconciliations/{id}/reject:
 *   patch:
 *     summary: Rechazar reconciliación
 *     tags: [Reconciliations]
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
 *         description: Reconciliación rechazada
 */
router.patch(
  '/:id/reject',
  authenticate,
  authorize(PERMISSIONS.INVENTORY_UPDATE),
  ReconciliationController.reject
)

/**
 * @swagger
 * /api/inventory/reconciliations/{id}/cancel:
 *   patch:
 *     summary: Cancelar reconciliación
 *     tags: [Reconciliations]
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
 *         description: Reconciliación cancelada
 */
router.patch(
  '/:id/cancel',
  authenticate,
  authorize(PERMISSIONS.INVENTORY_UPDATE),
  ReconciliationController.cancel
)

/**
 * @swagger
 * /api/inventory/reconciliations/{id}/items:
 *   post:
 *     summary: Agregar item a la reconciliación
 *     tags: [Reconciliations]
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
 *             required: [itemId, systemQuantity, expectedQuantity]
 *             properties:
 *               itemId:
 *                 type: string
 *               systemQuantity:
 *                 type: number
 *               expectedQuantity:
 *                 type: number
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
  validateBody(addReconciliationItemSchema),
  ReconciliationController.addItem
)

/**
 * @swagger
 * /api/inventory/reconciliations/{id}/items:
 *   get:
 *     summary: Obtener items de la reconciliación
 *     tags: [Reconciliations]
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
 *         description: Items de la reconciliación
 */
router.get(
  '/:id/items',
  authenticate,
  authorize(PERMISSIONS.INVENTORY_VIEW),
  ReconciliationController.getItems
)

/**
 * @swagger
 * /api/inventory/reconciliations/{id}:
 *   delete:
 *     summary: Eliminar reconciliación (solo DRAFT)
 *     tags: [Reconciliations]
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
 *         description: Reconciliación eliminada
 */
router.delete(
  '/:id',
  authenticate,
  authorize(PERMISSIONS.INVENTORY_DELETE),
  ReconciliationController.delete
)

export default router
