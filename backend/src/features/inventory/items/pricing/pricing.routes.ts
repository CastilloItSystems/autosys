// backend/src/features/inventory/items/pricing/pricing.routes.ts

/**
 * @swagger
 * tags:
 *   - name: Inventory - Items - Pricing
 *     description: Gestión de precios y márgenes de artículos del inventario
 *
 * /inventory/items/pricing:
 *   get:
 *     summary: Listar información de precios
 *     tags: [Inventory - Items - Pricing]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: itemId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filtrar por ID del artículo
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filtrar por activas/inactivas
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Información de precios obtenida exitosamente
 *       401:
 *         description: No autorizado
 *       403:
 *         description: No tiene permisos
 *   post:
 *     summary: Crear información de precios
 *     tags: [Inventory - Items - Pricing]
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
 *               - cost
 *               - salePrice
 *             properties:
 *               itemId:
 *                 type: string
 *                 format: uuid
 *                 example: "550e8400-e29b-41d4-a716-446655440000"
 *               cost:
 *                 type: number
 *                 example: 50
 *               salePrice:
 *                 type: number
 *                 example: 100
 *               currency:
 *                 type: string
 *                 default: USD
 *               minPrice:
 *                 type: number
 *               isActive:
 *                 type: boolean
 *                 default: true
 *     responses:
 *       201:
 *         description: Información de precios creada exitosamente
 *       400:
 *         description: Datos inválidos
 *       409:
 *         description: Ya existe información de precios para este artículo
 *       401:
 *         description: No autorizado
 *       403:
 *         description: No tiene permisos
 *
 * /inventory/items/pricing/{id}:
 *   get:
 *     summary: Obtener información de precios por ID
 *     tags: [Inventory - Items - Pricing]
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
 *         description: Información de precios obtenida exitosamente
 *       404:
 *         description: Información de precios no encontrada
 *       401:
 *         description: No autorizado
 *       403:
 *         description: No tiene permisos
 *   put:
 *     summary: Actualizar información de precios
 *     tags: [Inventory - Items - Pricing]
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
 *               cost:
 *                 type: number
 *               salePrice:
 *                 type: number
 *               minPrice:
 *                 type: number
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Información de precios actualizada exitosamente
 *       404:
 *         description: Información de precios no encontrada
 *       401:
 *         description: No autorizado
 *       403:
 *         description: No tiene permisos
 *   delete:
 *     summary: Eliminar información de precios
 *     tags: [Inventory - Items - Pricing]
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
 *         description: Información de precios eliminada exitosamente
 *       404:
 *         description: Información de precios no encontrada
 *       401:
 *         description: No autorizado
 *       403:
 *         description: No tiene permisos
 *
 * /inventory/items/pricing/item/{itemId}:
 *   get:
 *     summary: Obtener información de precios de un artículo
 *     tags: [Inventory - Items - Pricing]
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
 *         description: Información de precios obtenida exitosamente
 *       404:
 *         description: Artículo no encontrado
 *       401:
 *         description: No autorizado
 *       403:
 *         description: No tiene permisos
 *
 * /inventory/items/pricing/tiers:
 *   get:
 *     summary: Listar tiers de precio
 *     tags: [Inventory - Items - Pricing]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: pricingId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filtrar por ID de precios
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Tiers de precio obtenidos exitosamente
 *       401:
 *         description: No autorizado
 *       403:
 *         description: No tiene permisos
 *   post:
 *     summary: Crear tier de precio
 *     tags: [Inventory - Items - Pricing]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - pricingId
 *               - minQty
 *               - price
 *             properties:
 *               pricingId:
 *                 type: string
 *                 format: uuid
 *               minQty:
 *                 type: integer
 *                 example: 10
 *               price:
 *                 type: number
 *                 example: 95
 *               discount:
 *                 type: number
 *                 example: 5
 *     responses:
 *       201:
 *         description: Tier de precio creado exitosamente
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autorizado
 *       403:
 *         description: No tiene permisos
 *
 * /inventory/items/pricing/tiers/{tierId}:
 *   get:
 *     summary: Obtener tier de precio por ID
 *     tags: [Inventory - Items - Pricing]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tierId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Tier de precio obtenido exitosamente
 *       404:
 *         description: Tier no encontrado
 *       401:
 *         description: No autorizado
 *       403:
 *         description: No tiene permisos
 *   put:
 *     summary: Actualizar tier de precio
 *     tags: [Inventory - Items - Pricing]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tierId
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
 *               minQty:
 *                 type: integer
 *               price:
 *                 type: number
 *               discount:
 *                 type: number
 *     responses:
 *       200:
 *         description: Tier de precio actualizado exitosamente
 *       404:
 *         description: Tier no encontrado
 *       401:
 *         description: No autorizado
 *       403:
 *         description: No tiene permisos
 *   delete:
 *     summary: Eliminar tier de precio
 *     tags: [Inventory - Items - Pricing]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tierId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Tier de precio eliminado exitosamente
 *       404:
 *         description: Tier no encontrado
 *       401:
 *         description: No autorizado
 *       403:
 *         description: No tiene permisos
 *
 * /inventory/items/pricing/calculate/margin:
 *   post:
 *     summary: Calcular margen de precio
 *     tags: [Inventory - Items - Pricing]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - cost
 *               - salePrice
 *             properties:
 *               cost:
 *                 type: number
 *                 example: 50
 *               salePrice:
 *                 type: number
 *                 example: 100
 *     responses:
 *       200:
 *         description: Cálculo de margen completado exitosamente
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autorizado
 *       403:
 *         description: No tiene permisos
 */

import { Router } from 'express'
import { PricingController } from './pricing.controller'
import {
  validateBody,
  validateParams,
  validateQuery,
} from '../../../../shared/middleware/validateRequest.middleware'
import { authenticate } from '../../../../shared/middleware/authenticate.middleware'
import { authorize } from '../../../../shared/middleware/authorize.middleware'
import {
  createPricingSchema,
  updatePricingSchema,
  pricingIdSchema,
  itemIdSchema,
  getPricingFiltersSchema,
  createPricingTierSchema,
  updatePricingTierSchema,
  tierIdSchema,
  getPricingTierFiltersSchema,
  calculateMarginSchema,
} from './pricing.validation'
import { PERMISSIONS } from '../../../../shared/constants/permissions'

const router = Router({ mergeParams: true })
const controller = new PricingController()

/**
 * Gestión de precios - Endpoints principales
 */

// GET /api/inventory/items/pricing
router.get(
  '/',
  authenticate,
  authorize(PERMISSIONS.ITEMS_VIEW),
  validateQuery(getPricingFiltersSchema),
  controller.getAll
)

// POST /api/inventory/items/pricing
router.post(
  '/',
  authenticate,
  authorize(PERMISSIONS.ITEMS_CREATE),
  validateBody(createPricingSchema),
  controller.create
)

// GET /api/inventory/items/pricing/:id
router.get(
  '/:id',
  authenticate,
  authorize(PERMISSIONS.ITEMS_VIEW),
  validateParams(pricingIdSchema),
  controller.getById
)

// PUT /api/inventory/items/pricing/:id
router.put(
  '/:id',
  authenticate,
  authorize(PERMISSIONS.ITEMS_UPDATE),
  validateParams(pricingIdSchema),
  validateBody(updatePricingSchema),
  controller.update
)

// DELETE /api/inventory/items/pricing/:id
router.delete(
  '/:id',
  authenticate,
  authorize(PERMISSIONS.ITEMS_DELETE),
  validateParams(pricingIdSchema),
  controller.delete
)

// GET /api/inventory/items/pricing/item/:itemId
router.get(
  '/item/:itemId',
  authenticate,
  authorize(PERMISSIONS.ITEMS_VIEW),
  validateParams(itemIdSchema),
  controller.getByItem
)

/**
 * Gestión de tiers de precio
 */

// GET /api/inventory/items/pricing/tiers
router.get(
  '/tiers',
  authenticate,
  authorize(PERMISSIONS.ITEMS_VIEW),
  validateQuery(getPricingTierFiltersSchema),
  controller.getTiers
)

// POST /api/inventory/items/pricing/tiers
router.post(
  '/tiers',
  authenticate,
  authorize(PERMISSIONS.ITEMS_CREATE),
  validateBody(createPricingTierSchema),
  controller.createTier
)

// GET /api/inventory/items/pricing/tiers/:tierId
router.get(
  '/tiers/:tierId',
  authenticate,
  authorize(PERMISSIONS.ITEMS_VIEW),
  validateParams(tierIdSchema),
  controller.getTierById
)

// PUT /api/inventory/items/pricing/tiers/:tierId
router.put(
  '/tiers/:tierId',
  authenticate,
  authorize(PERMISSIONS.ITEMS_UPDATE),
  validateParams(tierIdSchema),
  validateBody(updatePricingTierSchema),
  controller.updateTier
)

// DELETE /api/inventory/items/pricing/tiers/:tierId
router.delete(
  '/tiers/:tierId',
  authenticate,
  authorize(PERMISSIONS.ITEMS_DELETE),
  validateParams(tierIdSchema),
  controller.deleteTier
)

/**
 * Cálculos de precios
 */

// POST /api/inventory/items/pricing/calculate/margin
router.post(
  '/calculate/margin',
  authenticate,
  authorize(PERMISSIONS.ITEMS_VIEW),
  validateBody(calculateMarginSchema),
  controller.calculateTierPrice
)

export default router
