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
/// backend/src/features/inventory/items/items.routes.ts

import { Router } from 'express'
import controller from './items.controller.js'
import { authorize } from '../../../shared/middleware/authorize.middleware.js'
import { validateRequest } from '../../../shared/middleware/validateRequest.middleware.js'
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

const router = Router()

// ---------------------------------------------------------------------------
// Rutas específicas ANTES de /:id
// ---------------------------------------------------------------------------
router.get('/active', authorize(PERMISSIONS.ITEMS_VIEW), controller.getActive)
router.get('/search', authorize(PERMISSIONS.ITEMS_VIEW), controller.search)
router.get(
  '/low-stock',
  authorize(PERMISSIONS.ITEMS_VIEW),
  controller.getLowStock
)
router.get(
  '/out-of-stock',
  authorize(PERMISSIONS.ITEMS_VIEW),
  controller.getOutOfStock
)
router.get(
  '/category/:categoryId',
  authorize(PERMISSIONS.ITEMS_VIEW),
  controller.getByCategory
)
router.get('/sku/:sku', authorize(PERMISSIONS.ITEMS_VIEW), controller.getBySku)
router.get(
  '/barcode/:barcode',
  authorize(PERMISSIONS.ITEMS_VIEW),
  controller.getByBarcode
)

// ---------------------------------------------------------------------------
// CRUD base
// ---------------------------------------------------------------------------
router.get(
  '/',
  authorize(PERMISSIONS.ITEMS_VIEW),
  validateRequest(getItemsQuerySchema, 'query'),
  controller.getAll
)

router.post(
  '/',
  authorize(PERMISSIONS.ITEMS_CREATE),
  validateRequest(createItemSchema, 'body'),
  controller.create
)

router.post(
  '/bulk',
  authorize(PERMISSIONS.ITEMS_CREATE),
  validateRequest(bulkCreateSchema, 'body'),
  controller.bulkCreate
)

router.post(
  '/generate-sku',
  authorize(PERMISSIONS.ITEMS_CREATE),
  validateRequest(generateSkuSchema, 'body'),
  controller.generateSku
)

router.post(
  '/check-availability',
  authorize(PERMISSIONS.ITEMS_VIEW),
  validateRequest(checkAvailabilitySchema, 'body'),
  controller.checkAvailability
)

router.put(
  '/bulk-update',
  authorize(PERMISSIONS.ITEMS_UPDATE),
  validateRequest(bulkUpdateSchema, 'body'),
  controller.bulkUpdate
)

// ---------------------------------------------------------------------------
// Rutas con :id (después de rutas específicas)
// ---------------------------------------------------------------------------
router.get(
  '/:id',
  authorize(PERMISSIONS.ITEMS_VIEW),
  validateRequest(itemIdSchema, 'params'),
  controller.getById
)

router.get(
  '/:id/stats',
  authorize(PERMISSIONS.ITEMS_VIEW),
  validateRequest(itemIdSchema, 'params'),
  controller.getStats
)

router.get(
  '/:id/history',
  authorize(PERMISSIONS.ITEMS_VIEW),
  validateRequest(itemIdSchema, 'params'),
  controller.getHistory
)

router.get(
  '/:id/related',
  authorize(PERMISSIONS.ITEMS_VIEW),
  validateRequest(itemIdSchema, 'params'),
  controller.getRelatedItems
)

router.post(
  '/:id/duplicate',
  authorize(PERMISSIONS.ITEMS_CREATE),
  validateRequest(itemIdSchema, 'params'),
  controller.duplicate
)

router.put(
  '/:id',
  authorize(PERMISSIONS.ITEMS_UPDATE),
  validateRequest(itemIdSchema, 'params'),
  validateRequest(updateItemSchema, 'body'),
  controller.update
)

router.put(
  '/:id/pricing',
  authorize(PERMISSIONS.ITEMS_UPDATE),
  validateRequest(itemIdSchema, 'params'),
  validateRequest(updatePricingSchema, 'body'),
  controller.updatePricing
)

router.patch(
  '/:id/toggle',
  authorize(PERMISSIONS.ITEMS_UPDATE),
  validateRequest(itemIdSchema, 'params'),
  controller.toggleActive
)

router.delete(
  '/:id',
  authorize(PERMISSIONS.ITEMS_DELETE),
  validateRequest(itemIdSchema, 'params'),
  controller.delete
)

router.delete(
  '/:id/hard',
  authorize(PERMISSIONS.ITEMS_DELETE),
  validateRequest(itemIdSchema, 'params'),
  controller.hardDelete
)

export default router
