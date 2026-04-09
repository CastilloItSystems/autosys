// backend/src/features/inventory/stock/stock.routes.ts

/**
 * @swagger
 * tags:
 *   - name: Inventory - Stock
 *     description: Gestión de stock e inventario
 *
 * /inventory/stock:
 *   get:
 *     summary: Obtener lista de stocks
 *     tags: [Inventory - Stock]
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
 *         name: warehouseId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: lowStock
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: outOfStock
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Lista de stocks obtenida exitosamente
 *       401:
 *         description: No autorizado
 *
 *   post:
 *     summary: Crear nuevo registro de stock
 *     tags: [Inventory - Stock]
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
 *             properties:
 *               itemId:
 *                 type: string
 *                 format: uuid
 *               warehouseId:
 *                 type: string
 *                 format: uuid
 *               quantityReal:
 *                 type: number
 *                 minimum: 0
 *               quantityReserved:
 *                 type: number
 *                 minimum: 0
 *               averageCost:
 *                 type: number
 *     responses:
 *       201:
 *         description: Stock creado exitosamente
 *       400:
 *         description: Datos inválidos
 *
 * /inventory/stock/{id}:
 *   get:
 *     summary: Obtener stock por ID
 *     tags: [Inventory - Stock]
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
 *         description: Stock obtenido exitosamente
 *       404:
 *         description: Stock no encontrado
 *
 *   put:
 *     summary: Actualizar stock
 *     tags: [Inventory - Stock]
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
 *               quantityReal:
 *                 type: number
 *               quantityReserved:
 *                 type: number
 *               averageCost:
 *                 type: number
 *     responses:
 *       200:
 *         description: Stock actualizado exitosamente
 *       404:
 *         description: Stock no encontrado
 *
 * /inventory/stock/low-stock:
 *   get:
 *     summary: Obtener items con bajo stock
 *     tags: [Inventory - Stock]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: warehouseId
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Items con bajo stock obtenidos
 *
 * /inventory/stock/out-of-stock:
 *   get:
 *     summary: Obtener items sin stock
 *     tags: [Inventory - Stock]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: warehouseId
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Items sin stock obtenidos
 *
 * /inventory/stock/item/{itemId}:
 *   get:
 *     summary: Obtener stocks de un artículo
 *     tags: [Inventory - Stock]
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
 *         description: Stocks obtenidos exitosamente
 *
 * /inventory/stock/warehouse/{warehouseId}:
 *   get:
 *     summary: Obtener stocks de un almacén
 *     tags: [Inventory - Stock]
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
 *         description: Stocks obtenidos exitosamente
 *
 * /inventory/stock/adjust:
 *   post:
 *     summary: Ajustar stock (entrada/salida)
 *     tags: [Inventory - Stock]
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
 *               - quantityChange
 *               - reason
 *             properties:
 *               itemId:
 *                 type: string
 *                 format: uuid
 *               warehouseId:
 *                 type: string
 *                 format: uuid
 *               quantityChange:
 *                 type: number
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Stock ajustado exitosamente
 *
 * /inventory/stock/reserve:
 *   post:
 *     summary: Reservar stock
 *     tags: [Inventory - Stock]
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
 *                 type: number
 *                 minimum: 1
 *     responses:
 *       200:
 *         description: Stock reservado exitosamente
 *
 * /inventory/stock/release:
 *   post:
 *     summary: Liberar reserva de stock
 *     tags: [Inventory - Stock]
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
 *                 type: number
 *                 minimum: 1
 *     responses:
 *       200:
 *         description: Reserva liberada exitosamente
 *
 * /inventory/stock/transfer:
 *   post:
 *     summary: Transferir stock entre almacenes
 *     tags: [Inventory - Stock]
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
 *               - warehouseFromId
 *               - warehouseToId
 *               - quantity
 *             properties:
 *               itemId:
 *                 type: string
 *                 format: uuid
 *               warehouseFromId:
 *                 type: string
 *                 format: uuid
 *               warehouseToId:
 *                 type: string
 *                 format: uuid
 *               quantity:
 *                 type: number
 *                 minimum: 1
 *     responses:
 *       200:
 *         description: Stock transferido exitosamente
 *
 * /inventory/stock/alerts:
 *   get:
 *     summary: Obtener alertas de stock
 *     tags: [Inventory - Stock]
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
 *           enum: [LOW_STOCK, OUT_OF_STOCK, EXPIRING_SOON, EXPIRED, OVERSTOCK]
 *       - in: query
 *         name: isRead
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Alertas obtenidas
 *
 *   post:
 *     summary: Crear alerta de stock
 *     tags: [Inventory - Stock]
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
 *               - type
 *               - message
 *             properties:
 *               itemId:
 *                 type: string
 *                 format: uuid
 *               warehouseId:
 *                 type: string
 *                 format: uuid
 *               type:
 *                 type: string
 *                 enum: [LOW_STOCK, OUT_OF_STOCK, EXPIRING_SOON, EXPIRED, OVERSTOCK]
 *               message:
 *                 type: string
 *               severity:
 *                 type: string
 *                 enum: [LOW, MEDIUM, HIGH, CRITICAL]
 *     responses:
 *       201:
 *         description: Alerta creada exitosamente
 *
 * /inventory/stock/alerts/{id}/read:
 *   patch:
 *     summary: Marcar alerta como leída
 *     tags: [Inventory - Stock]
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
 *         description: Alerta marcada como leída
 */

// backend/src/features/inventory/stock/stock.routes.ts

/**
 * @swagger
 * tags:
 *   - name: Inventory - Stock
 *     description: Gestión de stock e inventario
 *
 * /inventory/stock:
 *   get:
 *     summary: Obtener lista de stocks
 *     tags: [Inventory - Stock]
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
 *         name: warehouseId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: lowStock
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: outOfStock
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Lista de stocks obtenida exitosamente
 *       401:
 *         description: No autorizado
 *
 *   post:
 *     summary: Crear nuevo registro de stock
 *     tags: [Inventory - Stock]
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
 *             properties:
 *               itemId:
 *                 type: string
 *                 format: uuid
 *               warehouseId:
 *                 type: string
 *                 format: uuid
 *               quantityReal:
 *                 type: number
 *                 minimum: 0
 *               quantityReserved:
 *                 type: number
 *                 minimum: 0
 *               averageCost:
 *                 type: number
 *     responses:
 *       201:
 *         description: Stock creado exitosamente
 *       400:
 *         description: Datos inválidos
 *
 * /inventory/stock/{id}:
 *   get:
 *     summary: Obtener stock por ID
 *     tags: [Inventory - Stock]
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
 *         description: Stock obtenido exitosamente
 *       404:
 *         description: Stock no encontrado
 *
 *   put:
 *     summary: Actualizar stock
 *     tags: [Inventory - Stock]
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
 *               quantityReal:
 *                 type: number
 *               quantityReserved:
 *                 type: number
 *               averageCost:
 *                 type: number
 *     responses:
 *       200:
 *         description: Stock actualizado exitosamente
 *       404:
 *         description: Stock no encontrado
 *
 * /inventory/stock/low-stock:
 *   get:
 *     summary: Obtener items con bajo stock
 *     tags: [Inventory - Stock]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: warehouseId
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Items con bajo stock obtenidos
 *
 * /inventory/stock/out-of-stock:
 *   get:
 *     summary: Obtener items sin stock
 *     tags: [Inventory - Stock]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: warehouseId
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Items sin stock obtenidos
 *
 * /inventory/stock/item/{itemId}:
 *   get:
 *     summary: Obtener stocks de un artículo
 *     tags: [Inventory - Stock]
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
 *         description: Stocks obtenidos exitosamente
 *
 * /inventory/stock/warehouse/{warehouseId}:
 *   get:
 *     summary: Obtener stocks de un almacén
 *     tags: [Inventory - Stock]
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
 *         description: Stocks obtenidos exitosamente
 *
 * /inventory/stock/adjust:
 *   post:
 *     summary: Ajustar stock (entrada/salida)
 *     tags: [Inventory - Stock]
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
 *               - quantityChange
 *               - reason
 *             properties:
 *               itemId:
 *                 type: string
 *                 format: uuid
 *               warehouseId:
 *                 type: string
 *                 format: uuid
 *               quantityChange:
 *                 type: number
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Stock ajustado exitosamente
 *
 * /inventory/stock/reserve:
 *   post:
 *     summary: Reservar stock
 *     tags: [Inventory - Stock]
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
 *                 type: number
 *                 minimum: 1
 *     responses:
 *       200:
 *         description: Stock reservado exitosamente
 *
 * /inventory/stock/release:
 *   post:
 *     summary: Liberar reserva de stock
 *     tags: [Inventory - Stock]
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
 *                 type: number
 *                 minimum: 1
 *     responses:
 *       200:
 *         description: Reserva liberada exitosamente
 *
 * /inventory/stock/transfer:
 *   post:
 *     summary: Transferir stock entre almacenes
 *     tags: [Inventory - Stock]
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
 *               - warehouseFromId
 *               - warehouseToId
 *               - quantity
 *             properties:
 *               itemId:
 *                 type: string
 *                 format: uuid
 *               warehouseFromId:
 *                 type: string
 *                 format: uuid
 *               warehouseToId:
 *                 type: string
 *                 format: uuid
 *               quantity:
 *                 type: number
 *                 minimum: 1
 *     responses:
 *       200:
 *         description: Stock transferido exitosamente
 *
 * /inventory/stock/alerts:
 *   get:
 *     summary: Obtener alertas de stock
 *     tags: [Inventory - Stock]
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
 *           enum: [LOW_STOCK, OUT_OF_STOCK, EXPIRING_SOON, EXPIRED, OVERSTOCK]
 *       - in: query
 *         name: isRead
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Alertas obtenidas
 *
 *   post:
 *     summary: Crear alerta de stock
 *     tags: [Inventory - Stock]
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
 *               - type
 *               - message
 *             properties:
 *               itemId:
 *                 type: string
 *                 format: uuid
 *               warehouseId:
 *                 type: string
 *                 format: uuid
 *               type:
 *                 type: string
 *                 enum: [LOW_STOCK, OUT_OF_STOCK, EXPIRING_SOON, EXPIRED, OVERSTOCK]
 *               message:
 *                 type: string
 *               severity:
 *                 type: string
 *                 enum: [LOW, MEDIUM, HIGH, CRITICAL]
 *     responses:
 *       201:
 *         description: Alerta creada exitosamente
 *
 * /inventory/stock/alerts/{id}/read:
 *   patch:
 *     summary: Marcar alerta como leída
 *     tags: [Inventory - Stock]
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
 *         description: Alerta marcada como leída
 */

import { Router } from 'express'
import stockController from './stock.controller.js'
import { authorize } from '../../../shared/middleware/authorize.middleware.js'
import {
  validateBody,
  validateParams,
  validateQuery,
} from '../../../shared/middleware/validateRequest.middleware.js'
import {
  createStockSchema,
  updateStockSchema,
  adjustStockSchema,
  reserveStockSchema,
  releaseStockSchema,
  transferStockSchema,
  createStockAlertSchema,
} from './stock.validation.js'
import { PERMISSIONS } from '../../../shared/constants/permissions.js'
import stockBulkRouter from './bulk/bulk.routes.js'

const router = Router()

// Mount bulk operations sub-router
router.use('/bulk', stockBulkRouter)

/**
 * ============================================
 * RUTAS DE CONSULTA ESPECIALIZADAS (Sin parámetros ID)
 * ============================================
 */

// GET /api/inventory/stock/low-stock
router.get(
  '/low-stock',
  authorize(PERMISSIONS.STOCK_VIEW),
  stockController.getLowStock
)

// GET /api/inventory/stock/out-of-stock
router.get(
  '/out-of-stock',
  authorize(PERMISSIONS.STOCK_VIEW),
  stockController.getOutOfStock
)

/**
 * ============================================
 * RUTAS DE OPERACIONES ESPECIALES
 * ============================================
 */

// POST /api/inventory/stock/adjust
router.post(
  '/adjust',
  authorize(PERMISSIONS.STOCK_ADJUST),
  validateBody(adjustStockSchema),
  stockController.adjust
)

// POST /api/inventory/stock/reserve
router.post(
  '/reserve',
  authorize(PERMISSIONS.STOCK_VIEW),
  validateBody(reserveStockSchema),
  stockController.reserve
)

// POST /api/inventory/stock/release
router.post(
  '/release',
  authorize(PERMISSIONS.STOCK_VIEW),
  validateBody(releaseStockSchema),
  stockController.release
)

// POST /api/inventory/stock/transfer
router.post(
  '/transfer',
  authorize(PERMISSIONS.STOCK_TRANSFER),
  validateBody(transferStockSchema),
  stockController.transfer
)

/**
 * ============================================
 * RUTAS DE ALERTAS
 * ============================================
 */

// GET /api/inventory/stock/alerts
router.get(
  '/alerts',
  authorize(PERMISSIONS.STOCK_VIEW),
  stockController.getAlerts
)

// POST /api/inventory/stock/alerts
router.post(
  '/alerts',
  authorize(PERMISSIONS.STOCK_VIEW),
  validateBody(createStockAlertSchema),
  stockController.createAlert
)

// PATCH /api/inventory/stock/alerts/:id/read
router.patch(
  '/alerts/:id/read',
  authorize(PERMISSIONS.STOCK_VIEW),
  stockController.markAlertAsRead
)

/**
 * ============================================
 * RUTAS GENERALES - Filtros por referencia
 * ============================================
 */

// GET /api/inventory/stock/item/:itemId
router.get(
  '/item/:itemId',
  authorize(PERMISSIONS.STOCK_VIEW),
  stockController.getByItem
)

// GET /api/inventory/stock/warehouse/:warehouseId
router.get(
  '/warehouse/:warehouseId',
  authorize(PERMISSIONS.STOCK_VIEW),
  stockController.getByWarehouse
)

/**
 * ============================================
 * RUTAS GENERALES - CRUD
 * ============================================
 */

// GET /api/inventory/stock (Listar todos)
router.get('/', authorize(PERMISSIONS.STOCK_VIEW), stockController.getAll)

// POST /api/inventory/stock (Crear)
router.post(
  '/',
  authorize(PERMISSIONS.STOCK_VIEW),
  validateBody(createStockSchema),
  stockController.create
)

// GET /api/inventory/stock/:id (Obtener uno)
router.get('/:id', authorize(PERMISSIONS.STOCK_VIEW), stockController.getOne)

// PUT /api/inventory/stock/:id (Actualizar)
router.put(
  '/:id',
  authorize(PERMISSIONS.STOCK_ADJUST),
  validateBody(updateStockSchema),
  stockController.update
)

export default router
