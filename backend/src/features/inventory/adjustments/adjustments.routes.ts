// backend/src/features/inventory/adjustments/adjustments.routes.ts

import { Router } from 'express'
import adjustmentController from './adjustments.controller'
import { authenticate } from '../../../shared/middleware/authenticate.middleware'
import { authorize } from '../../../shared/middleware/authorize.middleware'
import { validateBody } from '../../../shared/middleware/validateRequest.middleware'
import {
  createAdjustmentSchema,
  updateAdjustmentSchema,
  approveAdjustmentSchema,
  applyAdjustmentSchema,
  addAdjustmentItemSchema,
} from './adjustments.validation'
import { PERMISSIONS } from '../../../shared/constants/permissions'

const router = Router()

/**
 * @swagger
 * /api/inventory/adjustments:
 *   get:
 *     tags:
 *       - Adjustments
 *     summary: Obtener todos los ajustes
 *     parameters:
 *       - name: page
 *         in: query
 *         type: integer
 *         default: 1
 *       - name: limit
 *         in: query
 *         type: integer
 *         default: 20
 *       - name: warehouseId
 *         in: query
 *         type: string
 *       - name: status
 *         in: query
 *         type: string
 *         enum: [DRAFT, APPROVED, APPLIED, REJECTED, CANCELLED]
 *       - name: reason
 *         in: query
 *         type: string
 *       - name: sortBy
 *         in: query
 *         type: string
 *         default: createdAt
 *       - name: sortOrder
 *         in: query
 *         type: string
 *         enum: [asc, desc]
 *         default: desc
 *     responses:
 *       200:
 *         description: Lista de ajustes obtenida
 */
router.get(
  '/',
  authenticate,
  authorize(PERMISSIONS.INVENTORY_VIEW),
  adjustmentController.getAll
)

/**
 * @swagger
 * /api/inventory/adjustments:
 *   post:
 *     tags:
 *       - Adjustments
 *     summary: Crear nuevo ajuste
 *     parameters:
 *       - name: body
 *         in: body
 *         required: true
 *         schema:
 *           type: object
 *           required:
 *             - warehouseId
 *             - reason
 *             - items
 *           properties:
 *             warehouseId:
 *               type: string
 *             reason:
 *               type: string
 *             notes:
 *               type: string
 *             items:
 *               type: array
 *               items:
 *                 type: object
 *                 required:
 *                   - itemId
 *                   - quantityChange
 *                 properties:
 *                   itemId:
 *                     type: string
 *                   quantityChange:
 *                     type: integer
 *                   unitCost:
 *                     type: number
 *                   notes:
 *                     type: string
 *     responses:
 *       201:
 *         description: Ajuste creado
 */
router.post(
  '/',
  authenticate,
  authorize(PERMISSIONS.INVENTORY_CREATE),
  validateBody(createAdjustmentSchema),
  adjustmentController.create
)

/**
 * @swagger
 * /api/inventory/adjustments/{id}:
 *   get:
 *     tags:
 *       - Adjustments
 *     summary: Obtener ajuste por ID
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         type: string
 *       - name: includeItems
 *         in: query
 *         type: boolean
 *         default: true
 *     responses:
 *       200:
 *         description: Ajuste obtenido
 */
router.get(
  '/:id',
  authenticate,
  authorize(PERMISSIONS.INVENTORY_VIEW),
  adjustmentController.getOne
)

/**
 * @swagger
 * /api/inventory/adjustments/{id}:
 *   put:
 *     tags:
 *       - Adjustments
 *     summary: Actualizar ajuste
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
 *             reason:
 *               type: string
 *             notes:
 *               type: string
 *     responses:
 *       200:
 *         description: Ajuste actualizado
 */
router.put(
  '/:id',
  authenticate,
  authorize(PERMISSIONS.INVENTORY_UPDATE),
  validateBody(updateAdjustmentSchema),
  adjustmentController.update
)

/**
 * @swagger
 * /api/inventory/adjustments/{id}/approve:
 *   patch:
 *     tags:
 *       - Adjustments
 *     summary: Aprobar ajuste
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         description: Ajuste aprobado
 */
router.patch(
  '/:id/approve',
  authenticate,
  authorize(PERMISSIONS.INVENTORY_UPDATE),
  adjustmentController.approve
)

/**
 * @swagger
 * /api/inventory/adjustments/{id}/apply:
 *   patch:
 *     tags:
 *       - Adjustments
 *     summary: Aplicar ajuste
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         description: Ajuste aplicado
 */
router.patch(
  '/:id/apply',
  authenticate,
  authorize(PERMISSIONS.INVENTORY_UPDATE),
  adjustmentController.apply
)

/**
 * @swagger
 * /api/inventory/adjustments/{id}/reject:
 *   patch:
 *     tags:
 *       - Adjustments
 *     summary: Rechazar ajuste
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
 *             reason:
 *               type: string
 *     responses:
 *       200:
 *         description: Ajuste rechazado
 */
router.patch(
  '/:id/reject',
  authenticate,
  authorize(PERMISSIONS.INVENTORY_UPDATE),
  adjustmentController.reject
)

/**
 * @swagger
 * /api/inventory/adjustments/{id}/cancel:
 *   patch:
 *     tags:
 *       - Adjustments
 *     summary: Cancelar ajuste
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         description: Ajuste cancelado
 */
router.patch(
  '/:id/cancel',
  authenticate,
  authorize(PERMISSIONS.INVENTORY_UPDATE),
  adjustmentController.cancel
)

/**
 * @swagger
 * /api/inventory/adjustments/{id}/items:
 *   post:
 *     tags:
 *       - Adjustments
 *     summary: Agregar item a ajuste
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
 *             - quantityChange
 *           properties:
 *             itemId:
 *               type: string
 *             quantityChange:
 *               type: integer
 *             unitCost:
 *               type: number
 *             notes:
 *               type: string
 *     responses:
 *       201:
 *         description: Item agregado
 */
router.post(
  '/:id/items',
  authenticate,
  authorize(PERMISSIONS.INVENTORY_CREATE),
  validateBody(addAdjustmentItemSchema),
  adjustmentController.addItem
)

/**
 * @swagger
 * /api/inventory/adjustments/{id}/items:
 *   get:
 *     tags:
 *       - Adjustments
 *     summary: Obtener items de ajuste
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
  adjustmentController.getItems
)

/**
 * @swagger
 * /api/inventory/adjustments/{id}:
 *   delete:
 *     tags:
 *       - Adjustments
 *     summary: Eliminar ajuste
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         description: Ajuste eliminado
 */
router.delete(
  '/:id',
  authenticate,
  authorize(PERMISSIONS.INVENTORY_DELETE),
  adjustmentController.delete
)

export default router
