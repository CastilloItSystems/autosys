// backend/src/features/inventory/movements/movements.routes.ts

/**
 * @swagger
 * tags:
 *   - name: Inventory - Movements
 *     description: Gestión de movimientos de inventario
 *
 * /inventory/movements:
 *   get:
 *     summary: Obtener lista de movimientos
 *     tags: [Inventory - Movements]
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
 *         name: type
 *         schema:
 *           type: string
 *           enum: [PURCHASE, SALE, ADJUSTMENT_IN, ADJUSTMENT_OUT, TRANSFER, SUPPLIER_RETURN, WORKSHOP_RETURN, RESERVATION_RELEASE]
 *       - in: query
 *         name: itemId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: warehouseFromId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: warehouseToId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: createdBy
 *         schema:
 *           type: string
 *       - in: query
 *         name: reference
 *         schema:
 *           type: string
 *       - in: query
 *         name: dateFrom
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: dateTo
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [movementDate, movementNumber, type, createdAt]
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *     responses:
 *       200:
 *         description: Lista de movimientos obtenida exitosamente
 *       401:
 *         description: No autorizado
 *
 *   post:
 *     summary: Crear nuevo movimiento
 *     tags: [Inventory - Movements]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - itemId
 *               - quantity
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [PURCHASE, SALE, ADJUSTMENT_IN, ADJUSTMENT_OUT, TRANSFER, SUPPLIER_RETURN, WORKSHOP_RETURN, RESERVATION_RELEASE]
 *               itemId:
 *                 type: string
 *                 format: uuid
 *               quantity:
 *                 type: number
 *                 minimum: 1
 *               unitCost:
 *                 type: number
 *               totalCost:
 *                 type: number
 *               warehouseFromId:
 *                 type: string
 *                 format: uuid
 *               warehouseToId:
 *                 type: string
 *                 format: uuid
 *               batchId:
 *                 type: string
 *                 format: uuid
 *               reference:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Movimiento creado exitosamente
 *       400:
 *         description: Datos inválidos
 *       404:
 *         description: Artículo o almacén no encontrado
 *
 * /inventory/movements/{id}:
 *   get:
 *     summary: Obtener movimiento por ID
 *     tags: [Inventory - Movements]
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
 *         description: Movimiento obtenido exitosamente
 *       404:
 *         description: Movimiento no encontrado
 *
 *   put:
 *     summary: Actualizar movimiento
 *     tags: [Inventory - Movements]
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
 *               type:
 *                 type: string
 *                 enum: [PURCHASE, SALE, ADJUSTMENT_IN, ADJUSTMENT_OUT, TRANSFER, SUPPLIER_RETURN, WORKSHOP_RETURN, RESERVATION_RELEASE]
 *               quantity:
 *                 type: number
 *               unitCost:
 *                 type: number
 *               totalCost:
 *                 type: number
 *               reference:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Movimiento actualizado exitosamente
 *       404:
 *         description: Movimiento no encontrado
 *
 *   delete:
 *     summary: Eliminar movimiento
 *     tags: [Inventory - Movements]
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
 *         description: Movimiento eliminado exitosamente
 *       404:
 *         description: Movimiento no encontrado
 *
 * /inventory/movements/{id}/cancel:
 *   patch:
 *     summary: Cancelar movimiento
 *     tags: [Inventory - Movements]
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
 *         description: Movimiento cancelado exitosamente
 *       404:
 *         description: Movimiento no encontrado
 *
 * /inventory/movements/type/{type}:
 *   get:
 *     summary: Obtener movimientos por tipo
 *     tags: [Inventory - Movements]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [PURCHASE, SALE, ADJUSTMENT_IN, ADJUSTMENT_OUT, TRANSFER, SUPPLIER_RETURN, WORKSHOP_RETURN, RESERVATION_RELEASE]
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *     responses:
 *       200:
 *         description: Movimientos obtenidos exitosamente
 *
 * /inventory/movements/warehouse/{warehouseId}:
 *   get:
 *     summary: Obtener movimientos por almacén
 *     tags: [Inventory - Movements]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: warehouseId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *     responses:
 *       200:
 *         description: Movimientos obtenidos exitosamente
 *
 * /inventory/movements/item/{itemId}:
 *   get:
 *     summary: Obtener movimientos por artículo
 *     tags: [Inventory - Movements]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *     responses:
 *       200:
 *         description: Movimientos obtenidos exitosamente
 */

import { Router } from 'express'
import { MovementController } from './movements.controller'
import { authenticate } from '../../../shared/middleware/authenticate.middleware'
import { authorize } from '../../../shared/middleware/authorize.middleware'
import {
  validateBody,
  validateParams,
  validateQuery,
} from '../../../shared/middleware/validateRequest.middleware'
import {
  createMovementSchema,
  updateMovementSchema,
} from './movements.validation'
import { PERMISSIONS } from '../../../shared/constants/permissions'

const router = Router()
const movementController = new MovementController()

/**
 * ============================================
 * RUTAS DE BÚSQUEDA Y CONSULTA (Sin parámetros en el path)
 * ============================================
 */

// GET /api/inventory/movements/type/:type
router.get(
  '/type/:type',
  authenticate,
  authorize(PERMISSIONS.MOVEMENTS_VIEW),
  movementController.getByType
)

// GET /api/inventory/movements/warehouse/:warehouseId
router.get(
  '/warehouse/:warehouseId',
  authenticate,
  authorize(PERMISSIONS.MOVEMENTS_VIEW),
  movementController.getByWarehouse
)

// GET /api/inventory/movements/item/:itemId
router.get(
  '/item/:itemId',
  authenticate,
  authorize(PERMISSIONS.MOVEMENTS_VIEW),
  movementController.getByItem
)

// GET /api/inventory/movements/dashboard
router.get(
  '/dashboard',
  authenticate,
  authorize(PERMISSIONS.MOVEMENTS_VIEW),
  movementController.getDashboard
)

/**
 * ============================================
 * RUTAS PROTEGIDAS - Requieren permisos
 * ============================================
 */

// GET /api/inventory/movements (Listar todos)
router.get(
  '/',
  authenticate,
  authorize(PERMISSIONS.MOVEMENTS_VIEW),
  movementController.getAll
)

// POST /api/inventory/movements (Crear)
router.post(
  '/',
  authenticate,
  authorize(PERMISSIONS.MOVEMENTS_CREATE),
  validateBody(createMovementSchema),
  movementController.create
)

/**
 * ============================================
 * RUTAS CON PARÁMETROS (después de query routes)
 * ============================================
 */

// GET /api/inventory/movements/:id (Obtener uno)
router.get(
  '/:id',
  authenticate,
  authorize(PERMISSIONS.MOVEMENTS_VIEW),
  movementController.getOne
)

// PUT /api/inventory/movements/:id (Actualizar)
router.put(
  '/:id',
  authenticate,
  authorize(PERMISSIONS.MOVEMENTS_UPDATE),
  validateBody(updateMovementSchema),
  movementController.update
)

// DELETE /api/inventory/movements/:id (Eliminar)
router.delete(
  '/:id',
  authenticate,
  authorize(PERMISSIONS.MOVEMENTS_DELETE),
  movementController.delete
)

// PATCH /api/inventory/movements/:id/cancel (Cancelar)
router.patch(
  '/:id/cancel',
  authenticate,
  authorize(PERMISSIONS.MOVEMENTS_UPDATE),
  movementController.cancel
)

export default router
