/**
 * @swagger
 * tags:
 *   - name: Inventory - Catalogs - Categories
 *     description: Endpoints para gestión de categorías de productos
 *
 * /inventory/catalogs/categories:
 *   get:
 *     summary: Obtener todas las categorías
 *     tags: [Inventory - Catalogs - Categories]
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
 *         description: Término de búsqueda por nombre
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: parentId
 *         schema:
 *           type: string
 *         description: Filtrar por categoría padre
 *     responses:
 *       200:
 *         description: Lista de categorías obtenida
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       code:
 *                         type: string
 *                       name:
 *                         type: string
 *                       description:
 *                         type: string
 *                       isActive:
 *                         type: boolean
 *                       level:
 *                         type: integer
 *                       parentId:
 *                         type: string
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *       401:
 *         description: No autorizado
 *       403:
 *         description: No tiene permisos
 *
 *   post:
 *     summary: Crear una nueva categoría
 *     tags: [Inventory - Catalogs - Categories]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *               - name
 *             properties:
 *               code:
 *                 type: string
 *                 example: "ELEC"
 *               name:
 *                 type: string
 *                 example: "Electrónica"
 *               description:
 *                 type: string
 *                 example: "Productos electrónicos"
 *               parentId:
 *                 type: string
 *                 description: ID de la categoría padre (para subcategorías)
 *               isActive:
 *                 type: boolean
 *                 default: true
 *     responses:
 *       201:
 *         description: Categoría creada exitosamente
 *       400:
 *         description: Datos inválidos
 *       409:
 *         description: El código de categoría ya existe
 *
 * /inventory/catalogs/categories/{id}:
 *   get:
 *     summary: Obtener una categoría por ID
 *     tags: [Inventory - Catalogs - Categories]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Categoría obtenida exitosamente
 *       404:
 *         description: Categoría no encontrada
 *
 *   put:
 *     summary: Actualizar una categoría
 *     tags: [Inventory - Catalogs - Categories]
 *     security:
 *       - BearerAuth: []
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
 *               code:
 *                 type: string
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               parentId:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Categoría actualizada exitosamente
 *       404:
 *         description: Categoría no encontrada
 *
 *   delete:
 *     summary: Eliminar categoría (soft delete)
 *     tags: [Inventory - Catalogs - Categories]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Categoría eliminada exitosamente
 *       404:
 *         description: Categoría no encontrada
 *
 * /inventory/catalogs/categories/active:
 *   get:
 *     summary: Obtener solo categorías activas
 *     tags: [Inventory - Catalogs - Categories]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de categorías activas
 *
 * /inventory/catalogs/categories/root:
 *   get:
 *     summary: Obtener categorías raíz (sin padre)
 *     tags: [Inventory - Catalogs - Categories]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de categorías raíz
 *
 * /inventory/catalogs/categories/tree:
 *   get:
 *     summary: Obtener árbol jerárquico de categorías
 *     tags: [Inventory - Catalogs - Categories]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Árbol de categorías
 *
 * /inventory/catalogs/categories/search:
 *   get:
 *     summary: Buscar categorías
 *     tags: [Inventory - Catalogs - Categories]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Término de búsqueda
 *     responses:
 *       200:
 *         description: Resultados de búsqueda
 *
 * /inventory/catalogs/categories/{id}/tree:
 *   get:
 *     summary: Obtener subárbol de una categoría
 *     tags: [Inventory - Catalogs - Categories]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Subárbol de la categoría
 *
 * /inventory/catalogs/categories/{id}/children:
 *   get:
 *     summary: Obtener subcategorías directas
 *     tags: [Inventory - Catalogs - Categories]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lista de subcategorías
 *
 * /inventory/catalogs/categories/{id}/ancestors:
 *   get:
 *     summary: Obtener categorías ancestros
 *     tags: [Inventory - Catalogs - Categories]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lista de categorías ancestros
 *
 * /inventory/catalogs/categories/{id}/path:
 *   get:
 *     summary: Obtener ruta completa de categoría
 *     tags: [Inventory - Catalogs - Categories]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Ruta completa de la categoría
 *
 * /inventory/catalogs/categories/{id}/stats:
 *   get:
 *     summary: Obtener estadísticas de una categoría
 *     tags: [Inventory - Catalogs - Categories]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Estadísticas de la categoría
 *
 * /inventory/catalogs/categories/{id}/toggle:
 *   patch:
 *     summary: Activar/Desactivar categoría
 *     tags: [Inventory - Catalogs - Categories]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Estado de categoría actualizado
 *
 * /inventory/catalogs/categories/{id}/move:
 *   patch:
 *     summary: Mover categoría a otra categoría padre
 *     tags: [Inventory - Catalogs - Categories]
 *     security:
 *       - BearerAuth: []
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
 *               parentId:
 *                 type: string
 *                 description: ID de la nueva categoría padre (null para hacerla raíz)
 *     responses:
 *       200:
 *         description: Categoría movida exitosamente
 *
 * /inventory/catalogs/categories/bulk:
 *   post:
 *     summary: Importación masiva de categorías
 *     tags: [Inventory - Catalogs - Categories]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - categories
 *             properties:
 *               categories:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       201:
 *         description: Importación completada
 *
 * /inventory/catalogs/categories/{id}/hard:
 *   delete:
 *     summary: Eliminar categoría permanentemente
 *     tags: [Inventory - Catalogs - Categories]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Categoría eliminada permanentemente
 *       404:
 *         description: Categoría no encontrada
 */

// backend/src/features/inventory/items/catalogs/categories/categories.routes.ts

import { Router } from 'express'
import categoryController from './categories.controller'
import { authenticate } from '../../../../../shared/middleware/authenticate.middleware'
import { authorize } from '../../../../../shared/middleware/authorize.middleware'
import {
  validateBody,
  validateParams,
  validateQuery,
} from '../../../../../shared/middleware/validateRequest.middleware'
import {
  createCategorySchema,
  updateCategorySchema,
  categoryIdSchema,
  getCategoriesQuerySchema,
} from './categories.validation'
import { PERMISSIONS } from '../../../../../shared/constants/permissions'

const router = Router()

/**
 * Rutas públicas (o con autenticación básica)
 */

// GET /api/inventory/catalogs/categories/tree
router.get('/tree', authenticate, categoryController.getTree)

// GET /api/inventory/catalogs/categories/root
router.get('/root', authenticate, categoryController.getRootCategories)

// GET /api/inventory/catalogs/categories/active
router.get('/active', authenticate, categoryController.getActive)

// GET /api/inventory/catalogs/categories/search
router.get('/search', authenticate, categoryController.search)

/**
 * Rutas protegidas - Requieren autenticación y permisos
 */

// GET /api/inventory/catalogs/categories
router.get(
  '/',
  authenticate,
  authorize(PERMISSIONS.INVENTORY_VIEW),
  validateQuery(getCategoriesQuerySchema),
  categoryController.getAll
)

// GET /api/inventory/catalogs/categories/:id/tree
router.get(
  '/:id/tree',
  authenticate,
  authorize(PERMISSIONS.INVENTORY_VIEW),
  validateParams(categoryIdSchema),
  categoryController.getSubTree
)

// GET /api/inventory/catalogs/categories/:id/children
router.get(
  '/:id/children',
  authenticate,
  authorize(PERMISSIONS.INVENTORY_VIEW),
  validateParams(categoryIdSchema),
  categoryController.getChildren
)

// GET /api/inventory/catalogs/categories/:id/ancestors
router.get(
  '/:id/ancestors',
  authenticate,
  authorize(PERMISSIONS.INVENTORY_VIEW),
  validateParams(categoryIdSchema),
  categoryController.getAncestors
)

// GET /api/inventory/catalogs/categories/:id/path
router.get(
  '/:id/path',
  authenticate,
  authorize(PERMISSIONS.INVENTORY_VIEW),
  validateParams(categoryIdSchema),
  categoryController.getPath
)

// GET /api/inventory/catalogs/categories/:id/stats
router.get(
  '/:id/stats',
  authenticate,
  authorize(PERMISSIONS.INVENTORY_VIEW),
  validateParams(categoryIdSchema),
  categoryController.getStats
)

// GET /api/inventory/catalogs/categories/:id (DEBE IR DESPUÉS DE LAS RUTAS ESPECÍFICAS)
router.get(
  '/:id',
  authenticate,
  authorize(PERMISSIONS.INVENTORY_VIEW),
  validateParams(categoryIdSchema),
  categoryController.getById
)

// POST /api/inventory/catalogs/categories
router.post(
  '/',
  authenticate,
  authorize(PERMISSIONS.INVENTORY_CREATE),
  validateBody(createCategorySchema),
  categoryController.create
)

// POST /api/inventory/catalogs/categories/bulk
router.post(
  '/bulk',
  authenticate,
  authorize(PERMISSIONS.INVENTORY_CREATE),
  categoryController.bulkCreate
)

// PUT /api/inventory/catalogs/categories/:id
router.put(
  '/:id',
  authenticate,
  authorize(PERMISSIONS.INVENTORY_UPDATE),
  validateParams(categoryIdSchema),
  validateBody(updateCategorySchema),
  categoryController.update
)

// PATCH /api/inventory/catalogs/categories/:id/move
router.patch(
  '/:id/move',
  authenticate,
  authorize(PERMISSIONS.INVENTORY_UPDATE),
  validateParams(categoryIdSchema),
  categoryController.move
)

// PATCH /api/inventory/catalogs/categories/:id/toggle
router.patch(
  '/:id/toggle',
  authenticate,
  authorize(PERMISSIONS.INVENTORY_UPDATE),
  validateParams(categoryIdSchema),
  categoryController.toggleActive
)

// DELETE /api/inventory/catalogs/categories/:id/hard (DEBE IR ANTES DE /:id DELETE)
router.delete(
  '/:id/hard',
  authenticate,
  authorize(PERMISSIONS.INVENTORY_DELETE),
  validateParams(categoryIdSchema),
  categoryController.hardDelete
)

// DELETE /api/inventory/catalogs/categories/:id (soft delete)
router.delete(
  '/:id',
  authenticate,
  authorize(PERMISSIONS.INVENTORY_DELETE),
  validateParams(categoryIdSchema),
  categoryController.delete
)

export default router
