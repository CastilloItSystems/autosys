// backend/src/features/inventory/items/search/search.routes.ts

/**
 * @swagger
 * tags:
 *   - name: Inventory - Items - Search
 *     description: Búsqueda y indexación de artículos en el inventario
 *
 * /inventory/items/search:
 *   post:
 *     summary: Búsqueda de artículos
 *     tags: [Inventory - Items - Search]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - query
 *             properties:
 *               query:
 *                 type: string
 *                 example: "Nike"
 *               filters:
 *                 type: object
 *                 example: { "category": "shoes" }
 *               page:
 *                 type: integer
 *                 default: 1
 *               limit:
 *                 type: integer
 *                 default: 20
 *     responses:
 *       200:
 *         description: Búsqueda completada exitosamente
 *       400:
 *         description: Query de búsqueda inválida
 *       401:
 *         description: No autorizado
 *       403:
 *         description: No tiene permisos
 *
 * /inventory/items/search/advanced:
 *   post:
 *     summary: Búsqueda avanzada de artículos
 *     tags: [Inventory - Items - Search]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - filters
 *             properties:
 *               query:
 *                 type: string
 *                 example: "Nike shoes"
 *               filters:
 *                 type: object
 *                 properties:
 *                   category:
 *                     type: string
 *                   brand:
 *                     type: string
 *                   priceMin:
 *                     type: number
 *                   priceMax:
 *                     type: number
 *               sortBy:
 *                 type: string
 *                 enum: ["name", "price", "relevance", "newest"]
 *                 default: "relevance"
 *               page:
 *                 type: integer
 *                 default: 1
 *               limit:
 *                 type: integer
 *                 default: 20
 *     responses:
 *       200:
 *         description: Búsqueda avanzada completada
 *       400:
 *         description: Filtros inválidos
 *       401:
 *         description: No autorizado
 *       403:
 *         description: No tiene permisos
 */

import { Router } from 'express'
import { SearchController } from './search.controller'
import {
  validateBody,
  validateParams,
  validateQuery,
} from '../../../../shared/middleware/validateRequest.middleware'
import { authenticate } from '../../../../shared/middleware/authenticate.middleware'
import { authorize } from '../../../../shared/middleware/authorize.middleware'
import {
  searchSchema,
  advancedSearchSchema,
  suggestionsSchema,
  aggregationsSchema,
  createSearchIndexSchema,
  updateSearchIndexSchema,
  itemIdSchema,
  getSearchIndexFiltersSchema,
} from './search.validation'
import { PERMISSIONS } from '../../../../shared/constants/permissions'

const router = Router({ mergeParams: true })
const controller = new SearchController()

/**
 * Búsqueda de artículos - Endpoints básicos y avanzados
 */

// POST /api/inventory/items/search
router.post(
  '/',
  authenticate,
  authorize(PERMISSIONS.ITEMS_VIEW),
  validateBody(searchSchema),
  controller.search
)

// POST /api/inventory/items/search/advanced
router.post(
  '/advanced',
  authenticate,
  authorize(PERMISSIONS.ITEMS_VIEW),
  validateBody(advancedSearchSchema),
  controller.advancedSearch
)

/**
 * @swagger
 * /inventory/items/search/suggestions:
 *   get:
 *     summary: Obtener sugerencias de búsqueda
 *     tags: [Inventory - Items - Search]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: query
 *         required: true
 *         schema:
 *           type: string
 *           minLength: 2
 *         description: Término de búsqueda
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Máximo número de sugerencias
 *     responses:
 *       200:
 *         description: Sugerencias obtenidas exitosamente
 *       400:
 *         description: Parámetros inválidos
 *       401:
 *         description: No autorizado
 *       403:
 *         description: No tiene permisos
 *
 * /inventory/items/search/aggregations:
 *   get:
 *     summary: Obtener agregaciones de búsqueda
 *     tags: [Inventory - Items - Search]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: query
 *         schema:
 *           type: string
 *         description: Término de búsqueda opcional
 *       - in: query
 *         name: filters
 *         schema:
 *           type: object
 *         description: Filtros opcionales
 *     responses:
 *       200:
 *         description: Agregaciones obtenidas exitosamente
 *       401:
 *         description: No autorizado
 *       403:
 *         description: No tiene permisos
 */

// GET /api/inventory/items/search/suggestions
router.get(
  '/suggestions',
  authenticate,
  authorize(PERMISSIONS.ITEMS_VIEW),
  validateQuery(suggestionsSchema),
  controller.getSuggestions
)

// GET /api/inventory/items/search/aggregations
router.get(
  '/aggregations',
  authenticate,
  authorize(PERMISSIONS.ITEMS_VIEW),
  validateQuery(aggregationsSchema),
  controller.getAggregations
)

/**
 * Gestión de índices de búsqueda
 */

/**
 * @swagger
 * /inventory/items/search/indexes:
 *   get:
 *     summary: Listar índices de búsqueda
 *     tags: [Inventory - Items - Search]
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
 *         description: Índices obtenidos exitosamente
 *       401:
 *         description: No autorizado
 *       403:
 *         description: No tiene permisos
 *
 *   post:
 *     summary: Crear índice de búsqueda
 *     tags: [Inventory - Items - Search]
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
 *               - content
 *             properties:
 *               itemId:
 *                 type: string
 *                 format: uuid
 *                 example: "550e8400-e29b-41d4-a716-446655440000"
 *               content:
 *                 type: string
 *                 example: "Nike Air Max shoes"
 *               metadata:
 *                 type: object
 *                 example: { "category": "shoes", "brand": "Nike" }
 *     responses:
 *       201:
 *         description: Índice creado exitosamente
 *       400:
 *         description: Datos inválidos
 *       409:
 *         description: El índice ya existe para este artículo
 *       401:
 *         description: No autorizado
 *       403:
 *         description: No tiene permisos
 *
 * /inventory/items/search/indexes/{itemId}:
 *   put:
 *     summary: Actualizar índice de búsqueda
 *     tags: [Inventory - Items - Search]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: itemId
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
 *               content:
 *                 type: string
 *               metadata:
 *                 type: object
 *     responses:
 *       200:
 *         description: Índice actualizado exitosamente
 *       404:
 *         description: Índice no encontrado
 *       401:
 *         description: No autorizado
 *       403:
 *         description: No tiene permisos
 *
 *   delete:
 *     summary: Eliminar índice de búsqueda
 *     tags: [Inventory - Items - Search]
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
 *         description: Índice eliminado exitosamente
 *       404:
 *         description: Índice no encontrado
 *       401:
 *         description: No autorizado
 *       403:
 *         description: No tiene permisos
 *
 * /inventory/items/search/reindex:
 *   post:
 *     summary: Reindexar todos los artículos
 *     tags: [Inventory - Items - Search]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Reindexación completada exitosamente
 *       401:
 *         description: No autorizado
 *       403:
 *         description: No tiene permisos
 */

// GET /api/inventory/items/search/indexes
router.get(
  '/indexes',
  authenticate,
  authorize(PERMISSIONS.ITEMS_VIEW),
  validateQuery(getSearchIndexFiltersSchema),
  controller.getIndexes
)

// POST /api/inventory/items/search/indexes
router.post(
  '/indexes',
  authenticate,
  authorize(PERMISSIONS.ITEMS_CREATE),
  validateBody(createSearchIndexSchema),
  controller.createIndex
)

// PUT /api/inventory/items/search/indexes/:itemId
router.put(
  '/indexes/:itemId',
  authenticate,
  authorize(PERMISSIONS.ITEMS_UPDATE),
  validateParams(itemIdSchema),
  validateBody(updateSearchIndexSchema),
  controller.updateIndex
)

// DELETE /api/inventory/items/search/indexes/:itemId
router.delete(
  '/indexes/:itemId',
  authenticate,
  authorize(PERMISSIONS.ITEMS_DELETE),
  validateParams(itemIdSchema),
  controller.deleteIndex
)

// POST /api/inventory/items/search/reindex
router.post(
  '/reindex',
  authenticate,
  authorize(PERMISSIONS.ITEMS_UPDATE),
  controller.reindexAll
)

export default router

