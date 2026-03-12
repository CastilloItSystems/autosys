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
// backend/src/features/inventory/items/catalogs/categories/categories.routes.ts

import { Router } from 'express'
import controller from './categories.controller.js'
import { authorize } from '../../../../../shared/middleware/authorize.middleware.js'
import { validateRequest } from '../../../../../shared/middleware/validateRequest.middleware.js'
import {
  createCategorySchema,
  updateCategorySchema,
  categoryIdSchema,
  getCategoriesQuerySchema,
} from './categories.validation.js'
import { PERMISSIONS } from '../../../../../shared/constants/permissions.js'

const router = Router()

// ---------------------------------------------------------------------------
// Rutas específicas ANTES de /:id
// ---------------------------------------------------------------------------
router.get('/tree', authorize(PERMISSIONS.INVENTORY_VIEW), controller.getTree)
router.get(
  '/root',
  authorize(PERMISSIONS.INVENTORY_VIEW),
  controller.getRootCategories
)
router.get(
  '/active',
  authorize(PERMISSIONS.INVENTORY_VIEW),
  controller.getActive
)
router.get('/search', authorize(PERMISSIONS.INVENTORY_VIEW), controller.search)

router.post(
  '/bulk',
  authorize(PERMISSIONS.INVENTORY_CREATE),
  controller.bulkCreate
)

// ---------------------------------------------------------------------------
// CRUD base
// ---------------------------------------------------------------------------
router.get(
  '/',
  authorize(PERMISSIONS.INVENTORY_VIEW),
  validateRequest(getCategoriesQuerySchema, 'query'),
  controller.getAll
)

router.post(
  '/',
  authorize(PERMISSIONS.INVENTORY_CREATE),
  validateRequest(createCategorySchema, 'body'),
  controller.create
)

// ---------------------------------------------------------------------------
// Rutas con :id — sub-rutas ANTES de /:id simple
// ---------------------------------------------------------------------------
router.get(
  '/:id/tree',
  authorize(PERMISSIONS.INVENTORY_VIEW),
  validateRequest(categoryIdSchema, 'params'),
  controller.getSubTree
)

router.get(
  '/:id/children',
  authorize(PERMISSIONS.INVENTORY_VIEW),
  validateRequest(categoryIdSchema, 'params'),
  controller.getChildren
)

router.get(
  '/:id/ancestors',
  authorize(PERMISSIONS.INVENTORY_VIEW),
  validateRequest(categoryIdSchema, 'params'),
  controller.getAncestors
)

router.get(
  '/:id/path',
  authorize(PERMISSIONS.INVENTORY_VIEW),
  validateRequest(categoryIdSchema, 'params'),
  controller.getPath
)

router.get(
  '/:id/stats',
  authorize(PERMISSIONS.INVENTORY_VIEW),
  validateRequest(categoryIdSchema, 'params'),
  controller.getStats
)

router.get(
  '/:id',
  authorize(PERMISSIONS.INVENTORY_VIEW),
  validateRequest(categoryIdSchema, 'params'),
  controller.getById
)

router.put(
  '/:id',
  authorize(PERMISSIONS.INVENTORY_UPDATE),
  validateRequest(categoryIdSchema, 'params'),
  validateRequest(updateCategorySchema, 'body'),
  controller.update
)

router.patch(
  '/:id/move',
  authorize(PERMISSIONS.INVENTORY_UPDATE),
  validateRequest(categoryIdSchema, 'params'),
  controller.move
)

router.patch(
  '/:id/toggle',
  authorize(PERMISSIONS.INVENTORY_UPDATE),
  validateRequest(categoryIdSchema, 'params'),
  controller.toggleActive
)

router.delete(
  '/:id/hard',
  authorize(PERMISSIONS.INVENTORY_DELETE),
  validateRequest(categoryIdSchema, 'params'),
  controller.hardDelete
)

router.delete(
  '/:id',
  authorize(PERMISSIONS.INVENTORY_DELETE),
  validateRequest(categoryIdSchema, 'params'),
  controller.delete
)

export default router
