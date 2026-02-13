// backend/src/features/inventory/items/items.routes.ts

/**
 * @swagger
 * tags:
 *   - name: Inventory - Items
 *     description: Gestión completa de artículos en inventario
 *
 * /inventory/items:
 *   get:
 *     summary: Obtener lista de artículos
 *     tags: [Inventory - Items]
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
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: brandId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *       - in: query
 *         name: inStock
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [name, sku, salePrice, createdAt]
 *     responses:
 *       200:
 *         description: Lista de artículos obtenida exitosamente
 *       401:
 *         description: No autorizado
 *       403:
 *         description: No tiene permisos
 *
 *   post:
 *     summary: Crear nuevo artículo
 *     tags: [Inventory - Items]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sku
 *               - name
 *               - brandId
 *               - categoryId
 *               - unitId
 *               - costPrice
 *               - salePrice
 *               - minStock
 *               - reorderPoint
 *             properties:
 *               sku:
 *                 type: string
 *                 example: "ITEM-001"
 *               name:
 *                 type: string
 *                 example: "Artículo de prueba"
 *               description:
 *                 type: string
 *               barcode:
 *                 type: string
 *               brandId:
 *                 type: string
 *                 format: uuid
 *               categoryId:
 *                 type: string
 *                 format: uuid
 *               unitId:
 *                 type: string
 *                 format: uuid
 *               costPrice:
 *                 type: number
 *               salePrice:
 *                 type: number
 *               wholesalePrice:
 *                 type: number
 *               minStock:
 *                 type: integer
 *               maxStock:
 *                 type: integer
 *               reorderPoint:
 *                 type: integer
 *               location:
 *                 type: string
 *               isSerialized:
 *                 type: boolean
 *               hasBatch:
 *                 type: boolean
 *               hasExpiry:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Artículo creado exitosamente
 *       400:
 *         description: Datos inválidos
 *       409:
 *         description: El SKU o barcode ya existe
 *
 * /inventory/items/{id}:
 *   get:
 *     summary: Obtener artículo por ID
 *     tags: [Inventory - Items]
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
 *         description: Artículo obtenido exitosamente
 *       404:
 *         description: Artículo no encontrado
 *
 *   put:
 *     summary: Actualizar artículo
 *     tags: [Inventory - Items]
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
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               barcode:
 *                 type: string
 *               minStock:
 *                 type: integer
 *               maxStock:
 *                 type: integer
 *               reorderPoint:
 *                 type: integer
 *               location:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Artículo actualizado exitosamente
 *       404:
 *         description: Artículo no encontrado
 *
 *   delete:
 *     summary: Eliminar artículo (soft delete)
 *     tags: [Inventory - Items]
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
 *         description: Artículo eliminado exitosamente
 *       404:
 *         description: Artículo no encontrado
 *
 * /inventory/items/active:
 *   get:
 *     summary: Obtener solo artículos activos
 *     tags: [Inventory - Items]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lista de artículos activos
 *
 * /inventory/items/search:
 *   get:
 *     summary: Buscar artículos por término
 *     tags: [Inventory - Items]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: term
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Resultados de búsqueda
 *       400:
 *         description: Término de búsqueda requerido
 *
 * /inventory/items/low-stock:
 *   get:
 *     summary: Obtener artículos con stock bajo
 *     tags: [Inventory - Items]
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
 *         description: Artículos con stock bajo
 *
 * /inventory/items/out-of-stock:
 *   get:
 *     summary: Obtener artículos sin stock
 *     tags: [Inventory - Items]
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
 *         description: Artículos sin stock
 *
 * /inventory/items/category/{categoryId}:
 *   get:
 *     summary: Obtener artículos de una categoría
 *     tags: [Inventory - Items]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Artículos de la categoría
 *       404:
 *         description: Categoría no encontrada
 *
 * /inventory/items/sku/{sku}:
 *   get:
 *     summary: Obtener artículo por SKU
 *     tags: [Inventory - Items]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sku
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Artículo obtenido exitosamente
 *       404:
 *         description: Artículo no encontrado
 *
 * /inventory/items/barcode/{barcode}:
 *   get:
 *     summary: Obtener artículo por código de barras
 *     tags: [Inventory - Items]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: barcode
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Artículo obtenido exitosamente
 *       404:
 *         description: Artículo no encontrado
 *
 * /inventory/items/{id}/stats:
 *   get:
 *     summary: Obtener estadísticas del artículo
 *     tags: [Inventory - Items]
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
 *         description: Estadísticas del artículo
 *       404:
 *         description: Artículo no encontrado
 *
 * /inventory/items/{id}/history:
 *   get:
 *     summary: Obtener historial de cambios del artículo
 *     tags: [Inventory - Items]
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
 *         description: Historial del artículo
 *       404:
 *         description: Artículo no encontrado
 *
 * /inventory/items/{id}/related:
 *   get:
 *     summary: Obtener artículos relacionados
 *     tags: [Inventory - Items]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Artículos relacionados
 *       404:
 *         description: Artículo no encontrado
 *
 * /inventory/items/bulk:
 *   post:
 *     summary: Crear múltiples artículos
 *     tags: [Inventory - Items]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - items
 *             properties:
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       201:
 *         description: Artículos creados exitosamente
 *       400:
 *         description: Datos inválidos
 *
 * /inventory/items/generate-sku:
 *   post:
 *     summary: Generar SKU automático
 *     tags: [Inventory - Items]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - brandId
 *               - categoryId
 *             properties:
 *               brandId:
 *                 type: string
 *                 format: uuid
 *               categoryId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: SKU generado exitosamente
 *       400:
 *         description: Datos inválidos
 *
 * /inventory/items/check-availability:
 *   post:
 *     summary: Verificar disponibilidad de artículo
 *     tags: [Inventory - Items]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sku
 *               - quantity
 *             properties:
 *               sku:
 *                 type: string
 *               quantity:
 *                 type: integer
 *               warehouseId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Disponibilidad verificada
 *       404:
 *         description: Artículo no encontrado
 *
 * /inventory/items/{id}/duplicate:
 *   post:
 *     summary: Duplicar un artículo
 *     tags: [Inventory - Items]
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
 *               - sku
 *             properties:
 *               sku:
 *                 type: string
 *               name:
 *                 type: string
 *     responses:
 *       201:
 *         description: Artículo duplicado exitosamente
 *       404:
 *         description: Artículo no encontrado
 *
 * /inventory/items/{id}/pricing:
 *   put:
 *     summary: Actualizar precios del artículo
 *     tags: [Inventory - Items]
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
 *               costPrice:
 *                 type: number
 *               salePrice:
 *                 type: number
 *               wholesalePrice:
 *                 type: number
 *     responses:
 *       200:
 *         description: Precios actualizados exitosamente
 *       404:
 *         description: Artículo no encontrado
 *
 * /inventory/items/bulk-update:
 *   put:
 *     summary: Actualizar múltiples artículos
 *     tags: [Inventory - Items]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - items
 *             properties:
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *     responses:
 *       200:
 *         description: Artículos actualizados exitosamente
 *       400:
 *         description: Datos inválidos
 *
 * /inventory/items/{id}/toggle:
 *   patch:
 *     summary: Activar/Desactivar artículo
 *     tags: [Inventory - Items]
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
 *         description: Estado del artículo actualizado
 *       404:
 *         description: Artículo no encontrado
 *
 * /inventory/items/{id}/hard:
 *   delete:
 *     summary: Eliminar artículo permanentemente (hard delete)
 *     tags: [Inventory - Items]
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
 *         description: Artículo eliminado permanentemente
 *       404:
 *         description: Artículo no encontrado
 */

import { Router } from 'express'
import itemController from './items.controller'
import { authenticate } from '../../../shared/middleware/authenticate.middleware'
import { authorize } from '../../../shared/middleware/authorize.middleware'
import {
  validateBody,
  validateParams,
  validateQuery,
} from '../../../shared/middleware/validateRequest.middleware'
import {
  createItemSchema,
  updateItemSchema,
  itemIdSchema,
  getItemsQuerySchema,
  updatePricingSchema,
  bulkCreateSchema,
  bulkUpdateSchema,
  generateSkuSchema,
  checkAvailabilitySchema,
} from './items.validation'
import { PERMISSIONS } from '../../../shared/constants/permissions'
import imagesRouter from './images/images.routes'
import pricingRouter from './pricing/pricing.routes'
import searchRouter from './search/search.routes'
import bulkRouter from './bulk/bulk.routes'

const router = Router()

/**
 * ============================================
 * SUB-MÓDULOS DE ITEMS (REGISTRAR PRIMERO)
 * ============================================
 */

// Registrar sub-módulos ANTES de cualquier otra ruta
router.use('/images', imagesRouter)
router.use('/pricing', pricingRouter)
router.use('/search', searchRouter)
router.use('/bulk', bulkRouter)

/**
 * ============================================
 * RUTAS DE BÚSQUEDA Y CONSULTA (Públicas con auth)
 * ============================================
 */

// GET /api/inventory/items/active
router.get('/active', authenticate, itemController.getActive)

// GET /api/inventory/items/search
router.get('/search', authenticate, itemController.search)

// GET /api/inventory/items/low-stock
router.get('/low-stock', authenticate, itemController.getLowStock)

// GET /api/inventory/items/out-of-stock
router.get('/out-of-stock', authenticate, itemController.getOutOfStock)

// GET /api/inventory/items/category/:categoryId
router.get('/category/:categoryId', authenticate, itemController.getByCategory)

// GET /api/inventory/items/sku/:sku
router.get('/sku/:sku', authenticate, itemController.getBySku)

// GET /api/inventory/items/barcode/:barcode
router.get('/barcode/:barcode', authenticate, itemController.getByBarcode)

/**
 * ============================================
 * RUTAS PROTEGIDAS - Requieren permisos
 * ============================================
 */

// GET /api/inventory/items
router.get(
  '/',
  authenticate,
  authorize(PERMISSIONS.ITEMS_VIEW),
  validateQuery(getItemsQuerySchema),
  itemController.getAll
)

// POST /api/inventory/items
router.post(
  '/',
  authenticate,
  authorize(PERMISSIONS.ITEMS_CREATE),
  validateBody(createItemSchema),
  itemController.create
)

// POST /api/inventory/items/bulk - Crear múltiples artículos
router.post(
  '/bulk',
  authenticate,
  authorize(PERMISSIONS.ITEMS_CREATE),
  validateBody(bulkCreateSchema),
  itemController.bulkCreate
)

// POST /api/inventory/items/generate-sku - Generar SKU automático
router.post(
  '/generate-sku',
  authenticate,
  authorize(PERMISSIONS.ITEMS_CREATE),
  validateBody(generateSkuSchema),
  itemController.generateSku
)

// POST /api/inventory/items/check-availability - Verificar disponibilidad
router.post(
  '/check-availability',
  authenticate,
  authorize(PERMISSIONS.ITEMS_VIEW),
  validateBody(checkAvailabilitySchema),
  itemController.checkAvailability
)

// PUT /api/inventory/items/bulk-update - Actualizar múltiples artículos
router.put(
  '/bulk-update',
  authenticate,
  authorize(PERMISSIONS.ITEMS_UPDATE),
  validateBody(bulkUpdateSchema),
  itemController.bulkUpdate
)

/**
 * ============================================
 * RUTAS CON PARÁMETROS (después de sub-módulos)
 * ============================================
 */

// GET /api/inventory/items/:id
router.get(
  '/:id',
  authenticate,
  authorize(PERMISSIONS.ITEMS_VIEW),
  validateParams(itemIdSchema),
  itemController.getById
)

// GET /api/inventory/items/:id/stats
router.get(
  '/:id/stats',
  authenticate,
  authorize(PERMISSIONS.ITEMS_VIEW),
  validateParams(itemIdSchema),
  itemController.getStats
)

// GET /api/inventory/items/:id/history
router.get(
  '/:id/history',
  authenticate,
  authorize(PERMISSIONS.ITEMS_VIEW),
  validateParams(itemIdSchema),
  itemController.getHistory
)

// GET /api/inventory/items/:id/related
router.get(
  '/:id/related',
  authenticate,
  authorize(PERMISSIONS.ITEMS_VIEW),
  validateParams(itemIdSchema),
  itemController.getRelatedItems
)

// POST /api/inventory/items/:id/duplicate
router.post(
  '/:id/duplicate',
  authenticate,
  authorize(PERMISSIONS.ITEMS_CREATE),
  validateParams(itemIdSchema),
  itemController.duplicate
)

// PUT /api/inventory/items/:id
router.put(
  '/:id',
  authenticate,
  authorize(PERMISSIONS.ITEMS_UPDATE),
  validateParams(itemIdSchema),
  validateBody(updateItemSchema),
  itemController.update
)

// PUT /api/inventory/items/:id/pricing
router.put(
  '/:id/pricing',
  authenticate,
  authorize(PERMISSIONS.ITEMS_UPDATE),
  validateParams(itemIdSchema),
  validateBody(updatePricingSchema),
  itemController.updatePricing
)

// PATCH /api/inventory/items/:id/toggle
router.patch(
  '/:id/toggle',
  authenticate,
  authorize(PERMISSIONS.ITEMS_UPDATE),
  validateParams(itemIdSchema),
  itemController.toggleActive
)

// DELETE /api/inventory/items/:id (soft delete)
router.delete(
  '/:id',
  authenticate,
  authorize(PERMISSIONS.ITEMS_DELETE),
  validateParams(itemIdSchema),
  itemController.delete
)

// DELETE /api/inventory/items/:id/hard (hard delete)
router.delete(
  '/:id/hard',
  authenticate,
  authorize(PERMISSIONS.ITEMS_DELETE),
  validateParams(itemIdSchema),
  itemController.hardDelete
)

export default router
