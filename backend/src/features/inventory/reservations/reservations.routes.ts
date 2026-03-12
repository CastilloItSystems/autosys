// backend/src/features/inventory/reservations/reservations.routes.ts

/**
 * @swagger
 * tags:
 *   - name: Inventory - Reservations
 *     description: Gestión de reservas de inventario
 *
 * /inventory/reservations:
 *   get:
 *     summary: Obtener lista de reservas
 *     tags: [Inventory - Reservations]
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
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ACTIVE, PENDING_PICKUP, CONSUMED, RELEASED]
 *       - in: query
 *         name: itemId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: warehouseId
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Lista de reservas obtenida
 *
 *   post:
 *     summary: Crear nueva reserva
 *     tags: [Inventory - Reservations]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - itemId
 *               - warehouseId
 *               - quantity
 *             properties:
 *               itemId:
 *                 type: string
 *                 format: uuid
 *               warehouseId:
 *                 type: string
 *                 format: uuid
 *               quantity:
 *                 type: integer
 *                 minimum: 1
 *               workOrderId:
 *                 type: string
 *                 format: uuid
 *               saleOrderId:
 *                 type: string
 *                 format: uuid
 *               reference:
 *                 type: string
 *               notes:
 *                 type: string
 *               expiresAt:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Reserva creada exitosamente
 *
 * /inventory/reservations/{id}:
 *   get:
 *     summary: Obtener reserva por ID
 *     tags: [Inventory - Reservations]
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
 *         description: Reserva obtenida
 *       404:
 *         description: Reserva no encontrada
 *
 *   put:
 *     summary: Actualizar reserva
 *     tags: [Inventory - Reservations]
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
 *               quantity:
 *                 type: integer
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, PENDING_PICKUP, CONSUMED, RELEASED]
 *     responses:
 *       200:
 *         description: Reserva actualizada
 *
 *   delete:
 *     summary: Eliminar reserva
 *     tags: [Inventory - Reservations]
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
 *         description: Reserva eliminada
 *
 * /inventory/reservations/active:
 *   get:
 *     summary: Obtener reservas activas
 *     tags: [Inventory - Reservations]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Reservas activas obtenidas
 *
 * /inventory/reservations/expired:
 *   get:
 *     summary: Obtener reservas expiradas
 *     tags: [Inventory - Reservations]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Reservas expiradas obtenidas
 *
 * /inventory/reservations/item/{itemId}:
 *   get:
 *     summary: Obtener reservas de un artículo
 *     tags: [Inventory - Reservations]
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
 *         description: Reservas obtenidas
 *
 * /inventory/reservations/warehouse/{warehouseId}:
 *   get:
 *     summary: Obtener reservas de un almacén
 *     tags: [Inventory - Reservations]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: warehouseId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Reservas obtenidas
 *
 * /inventory/reservations/{id}/consume:
 *   post:
 *     summary: Consumir reserva (entregar)
 *     tags: [Inventory - Reservations]
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
 *               quantity:
 *                 type: integer
 *               deliveredBy:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Reserva consumida
 *
 * /inventory/reservations/{id}/release:
 *   post:
 *     summary: Liberar reserva
 *     tags: [Inventory - Reservations]
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
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Reserva liberada
 *
 * /inventory/reservations/{id}/pending-pickup:
 *   patch:
 *     summary: Marcar como pendiente de entrega
 *     tags: [Inventory - Reservations]
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
 *         description: Reserva marcada como pendiente
 */

import { Router } from 'express'
import { ReservationController } from './reservations.controller.js'
import { authorize } from '../../../shared/middleware/authorize.middleware.js'
import {
  validateBody,
  validateParams,
  validateQuery,
} from '../../../shared/middleware/validateRequest.middleware.js'
import {
  createReservationSchema,
  updateReservationSchema,
  consumeReservationSchema,
  releaseReservationSchema,
  reservationIdSchema,
  itemIdSchema,
  warehouseIdSchema,
  getReservationsQuerySchema,
  paginationQuerySchema,
} from './reservations.validation.js'
import { PERMISSIONS } from '../../../shared/constants/permissions.js'

const router = Router()
const controller = new ReservationController()

/**
 * ============================================
 * RUTAS DE CONSULTA ESPECIALIZADAS
 * ============================================
 */

// GET /api/inventory/reservations/active
router.get(
  '/active',
  authorize(PERMISSIONS.INVENTORY_VIEW),
  validateQuery(paginationQuerySchema),
  controller.getActive
)

// GET /api/inventory/reservations/expired
router.get(
  '/expired',
  authorize(PERMISSIONS.INVENTORY_VIEW),
  validateQuery(paginationQuerySchema),
  controller.getExpired
)

/**
 * ============================================
 * RUTAS DE FILTROS POR REFERENCIA
 * ============================================
 */

// GET /api/inventory/reservations/item/:itemId
router.get(
  '/item/:itemId',
  authorize(PERMISSIONS.INVENTORY_VIEW),
  validateParams(itemIdSchema),
  validateQuery(paginationQuerySchema),
  controller.getByItem
)

// GET /api/inventory/reservations/warehouse/:warehouseId
router.get(
  '/warehouse/:warehouseId',
  authorize(PERMISSIONS.INVENTORY_VIEW),
  validateParams(warehouseIdSchema),
  validateQuery(paginationQuerySchema),
  controller.getByWarehouse
)

/**
 * ============================================
 * RUTAS DE OPERACIONES ESPECIALES
 * ============================================
 */

// POST /api/inventory/reservations/:id/consume
router.post(
  '/:id/consume',
  authorize(PERMISSIONS.INVENTORY_UPDATE),
  validateParams(reservationIdSchema),
  validateBody(consumeReservationSchema),
  controller.consume
)

// POST /api/inventory/reservations/:id/release
router.post(
  '/:id/release',
  authorize(PERMISSIONS.INVENTORY_UPDATE),
  validateParams(reservationIdSchema),
  validateBody(releaseReservationSchema),
  controller.release
)

// PATCH /api/inventory/reservations/:id/pending-pickup
router.patch(
  '/:id/pending-pickup',
  authorize(PERMISSIONS.INVENTORY_UPDATE),
  validateParams(reservationIdSchema),
  controller.markAsPendingPickup
)

/**
 * ============================================
 * RUTAS GENERALES - CRUD
 * ============================================
 */

// GET /api/inventory/reservations (Listar todos)
router.get(
  '/',
  authorize(PERMISSIONS.INVENTORY_VIEW),
  validateQuery(getReservationsQuerySchema),
  controller.getAll
)

// POST /api/inventory/reservations (Crear)
router.post(
  '/',
  authorize(PERMISSIONS.INVENTORY_CREATE),
  validateBody(createReservationSchema),
  controller.create
)

// GET /api/inventory/reservations/:id (Obtener uno)
router.get(
  '/:id',
  authorize(PERMISSIONS.INVENTORY_VIEW),
  validateParams(reservationIdSchema),
  controller.getOne
)

// PUT /api/inventory/reservations/:id (Actualizar)
router.put(
  '/:id',
  authorize(PERMISSIONS.INVENTORY_UPDATE),
  validateParams(reservationIdSchema),
  validateBody(updateReservationSchema),
  controller.update
)

// DELETE /api/inventory/reservations/:id (Eliminar)
router.delete(
  '/:id',
  authorize(PERMISSIONS.INVENTORY_DELETE),
  validateParams(reservationIdSchema),
  controller.delete
)

export default router
