/**
 * @swagger
 * tags:
 *   - name: Inventory - Items
 *     description: Gestión de artículos de inventario
 *
 * /inventory/items:
 *   get:
 *     summary: Listar artículos
 *     tags: [Inventory - Items]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: brandId
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: categoryId
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: sortBy
 *         schema: { type: string, example: name }
 *       - in: query
 *         name: sortOrder
 *         schema: { type: string, enum: [asc, desc], default: asc }
 *     responses:
 *       200: { description: OK }
 *
 *   post:
 *     summary: Crear artículo
 *     tags: [Inventory - Items]
 *     responses:
 *       201: { description: Creado }
 *
 * /inventory/items/active:
 *   get:
 *     summary: Listar artículos activos
 *     tags: [Inventory - Items]
 *     responses:
 *       200: { description: OK }
 *
 * /inventory/items/search:
 *   get:
 *     summary: Buscar artículos
 *     tags: [Inventory - Items]
 *     parameters:
 *       - in: query
 *         name: term
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200: { description: OK }
 *
 * /inventory/items/{id}:
 *   get:
 *     summary: Obtener artículo por ID
 *     tags: [Inventory - Items]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: OK }
 *       404: { description: No encontrado }
 *   put:
 *     summary: Actualizar artículo
 *     tags: [Inventory - Items]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: Actualizado }
 *   delete:
 *     summary: Eliminar artículo (soft delete)
 *     tags: [Inventory - Items]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: Eliminado }
 *
 * /inventory/items/{id}/stats:
 *   get:
 *     summary: Obtener estadísticas de artículo
 *     tags: [Inventory - Items]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: OK }
 *
 * /inventory/items/{id}/history:
 *   get:
 *     summary: Obtener historial de artículo
 *     tags: [Inventory - Items]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: OK }
 *
 * /inventory/items/{id}/duplicate:
 *   post:
 *     summary: Duplicar artículo
 *     tags: [Inventory - Items]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [newSku]
 *             properties:
 *               newSku:
 *                 type: string
 *     responses:
 *       201: { description: Duplicado }
 */
// backend/src/features/inventory/items/items.routes.ts
import { Router } from 'express'
import itemController from './items.controller.js'
import { authorize } from '../../../shared/middleware/authorize.middleware.js'
import {
  validateBody,
  validateParams,
  validateQuery,
} from '../../../shared/middleware/validateRequest.middleware.js'
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
} from './items.validation.js'
import { PERMISSIONS } from '../../../shared/constants/permissions.js'
import imagesRouter from './images/images.routes.js'
import pricingRouter from './pricing/pricing.routes.js'
import searchRouter from './search/search.routes.js'
import bulkRouter from './bulk/bulk.routes.js'

const router = Router()

/**
 * IMPORTANTE:
 * authenticate + extractEmpresa ya se aplican en el mount padre (/api/inventory)
 * en src/routes/api.routes.ts
 */

// Sub-módulos (primero)
router.use('/images', imagesRouter)
router.use('/pricing', pricingRouter)
router.use('/search', searchRouter)
router.use('/bulk', bulkRouter)

// Rutas de consulta
router.get('/active', itemController.getActive)
router.get('/search', itemController.search)
router.get('/low-stock', itemController.getLowStock)
router.get('/out-of-stock', itemController.getOutOfStock)
router.get('/category/:categoryId', itemController.getByCategory)
router.get('/sku/:sku', itemController.getBySku)
router.get('/barcode/:barcode', itemController.getByBarcode)

// CRUD principal
router.get(
  '/',
  authorize(PERMISSIONS.ITEMS_VIEW),
  validateQuery(getItemsQuerySchema),
  itemController.getAll
)

router.post(
  '/',
  authorize(PERMISSIONS.ITEMS_CREATE),
  validateBody(createItemSchema),
  itemController.create
)

router.post(
  '/bulk',
  authorize(PERMISSIONS.ITEMS_CREATE),
  validateBody(bulkCreateSchema),
  itemController.bulkCreate
)

router.post(
  '/generate-sku',
  authorize(PERMISSIONS.ITEMS_CREATE),
  validateBody(generateSkuSchema),
  itemController.generateSku
)

router.post(
  '/check-availability',
  authorize(PERMISSIONS.ITEMS_VIEW),
  validateBody(checkAvailabilitySchema),
  itemController.checkAvailability
)

router.put(
  '/bulk-update',
  authorize(PERMISSIONS.ITEMS_UPDATE),
  validateBody(bulkUpdateSchema),
  itemController.bulkUpdate
)

// Rutas por ID (después de rutas específicas)
router.get(
  '/:id',
  authorize(PERMISSIONS.ITEMS_VIEW),
  validateParams(itemIdSchema),
  itemController.getById
)

router.get(
  '/:id/stats',
  authorize(PERMISSIONS.ITEMS_VIEW),
  validateParams(itemIdSchema),
  itemController.getStats
)

router.get(
  '/:id/history',
  authorize(PERMISSIONS.ITEMS_VIEW),
  validateParams(itemIdSchema),
  itemController.getHistory
)

router.get(
  '/:id/related',
  authorize(PERMISSIONS.ITEMS_VIEW),
  validateParams(itemIdSchema),
  itemController.getRelatedItems
)

router.post(
  '/:id/duplicate',
  authorize(PERMISSIONS.ITEMS_CREATE),
  validateParams(itemIdSchema),
  itemController.duplicate
)

router.put(
  '/:id',
  authorize(PERMISSIONS.ITEMS_UPDATE),
  validateParams(itemIdSchema),
  validateBody(updateItemSchema),
  itemController.update
)

router.put(
  '/:id/pricing',
  authorize(PERMISSIONS.ITEMS_UPDATE),
  validateParams(itemIdSchema),
  validateBody(updatePricingSchema),
  itemController.updatePricing
)

router.patch(
  '/:id/toggle',
  authorize(PERMISSIONS.ITEMS_UPDATE),
  validateParams(itemIdSchema),
  itemController.toggleActive
)

router.delete(
  '/:id',
  authorize(PERMISSIONS.ITEMS_DELETE),
  validateParams(itemIdSchema),
  itemController.delete
)

router.delete(
  '/:id/hard',
  authorize(PERMISSIONS.ITEMS_DELETE),
  validateParams(itemIdSchema),
  itemController.hardDelete
)

export default router
