// backend/src/features/inventory/items/catalogs/models/models.routes.ts

/**
 * @swagger
 * tags:
 *   - name: Inventory - Catalogs - Models
 *     description: Gestión de modelos de vehículos y partes en el inventario
 *
 * /inventory/catalogs/models:
 *   get:
 *     summary: Obtener todos los modelos
 *     tags: [Inventory - Catalogs - Models]
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
 *         name: year
 *         schema:
 *           type: integer
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [PART, VEHICLE]
 *     responses:
 *       200:
 *         description: Lista de modelos obtenida exitosamente
 *       401:
 *         description: No autorizado
 *       403:
 *         description: No tiene permisos
 *
 *   post:
 *     summary: Crear un nuevo modelo
 *     tags: [Inventory - Catalogs - Models]
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
 *               - brandId
 *               - type
 *             properties:
 *               code:
 *                 type: string
 *                 example: "MODEL-001"
 *               name:
 *                 type: string
 *                 example: "Toyota Corolla"
 *               description:
 *                 type: string
 *               brandId:
 *                 type: string
 *                 format: uuid
 *               year:
 *                 type: integer
 *               type:
 *                 type: string
 *                 enum: [PART, VEHICLE]
 *               isActive:
 *                 type: boolean
 *                 default: true
 *     responses:
 *       201:
 *         description: Modelo creado exitosamente
 *       400:
 *         description: Datos inválidos
 *       409:
 *         description: El código de modelo ya existe
 *
 * /inventory/catalogs/models/{id}:
 *   get:
 *     summary: Obtener un modelo por ID
 *     tags: [Inventory - Catalogs - Models]
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
 *         description: Modelo obtenido exitosamente
 *       404:
 *         description: Modelo no encontrado
 *
 *   put:
 *     summary: Actualizar un modelo
 *     tags: [Inventory - Catalogs - Models]
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
 *               code:
 *                 type: string
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               year:
 *                 type: integer
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Modelo actualizado exitosamente
 *       404:
 *         description: Modelo no encontrado
 *
 *   delete:
 *     summary: Eliminar un modelo (soft delete)
 *     tags: [Inventory - Catalogs - Models]
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
 *         description: Modelo eliminado exitosamente
 *       404:
 *         description: Modelo no encontrado
 *
 * /inventory/catalogs/models/active:
 *   get:
 *     summary: Obtener solo modelos activos
 *     tags: [Inventory - Catalogs - Models]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de modelos activos
 *
 * /inventory/catalogs/models/grouped:
 *   get:
 *     summary: Obtener modelos agrupados por marca
 *     tags: [Inventory - Catalogs - Models]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Modelos agrupados por marca
 *
 * /inventory/catalogs/models/years:
 *   get:
 *     summary: Obtener años disponibles de modelos
 *     tags: [Inventory - Catalogs - Models]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de años disponibles
 *
 * /inventory/catalogs/models/search:
 *   get:
 *     summary: Buscar modelos
 *     tags: [Inventory - Catalogs - Models]
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
 * /inventory/catalogs/models/brand/{brandId}:
 *   get:
 *     summary: Obtener modelos de una marca específica
 *     tags: [Inventory - Catalogs - Models]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: brandId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Modelos de la marca obtenidos exitosamente
 *       404:
 *         description: Marca no encontrada
 *
 * /inventory/catalogs/models/year/{year}:
 *   get:
 *     summary: Obtener modelos de un año específico
 *     tags: [Inventory - Catalogs - Models]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: year
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Modelos del año obtenidos exitosamente
 *
 * /inventory/catalogs/models/{id}/toggle:
 *   patch:
 *     summary: Activar/Desactivar un modelo
 *     tags: [Inventory - Catalogs - Models]
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
 *         description: Estado de modelo actualizado
 *       404:
 *         description: Modelo no encontrado
 *
 * /inventory/catalogs/models/bulk:
 *   post:
 *     summary: Crear múltiples modelos
 *     tags: [Inventory - Catalogs - Models]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - models
 *             properties:
 *               models:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - code
 *                     - name
 *                     - brandId
 *                     - type
 *                   properties:
 *                     code:
 *                       type: string
 *                     name:
 *                       type: string
 *                     description:
 *                       type: string
 *                     brandId:
 *                       type: string
 *                       format: uuid
 *                     year:
 *                       type: integer
 *                     type:
 *                       type: string
 *                       enum: [PART, VEHICLE]
 *     responses:
 *       201:
 *         description: Modelos creados exitosamente
 *       400:
 *         description: Datos inválidos
 */

import { Router } from 'express'
import { ModelController } from './models.controller'
import { authenticate } from '../../../../../shared/middleware/authenticate.middleware'

const modelController = new ModelController()
import { authorize } from '../../../../../shared/middleware/authorize.middleware'
import {
  validateBody,
  validateParams,
  validateQuery,
} from '../../../../../shared/middleware/validateRequest.middleware'
import {
  createModelSchema,
  updateModelSchema,
  modelIdSchema,
  getModelsQuerySchema,
  getModelsByBrandSchema,
} from './models.validation'
import { PERMISSIONS } from '../../../../../shared/constants/permissions'

const router = Router()

/**
 * RUTAS GET ESPECÍFICAS (DEBEN IR ANTES DE /:id)
 */

// GET /api/inventory/catalogs/models/active
router.get('/active', authenticate, modelController.getActive)

// GET /api/inventory/catalogs/models/grouped
router.get('/grouped', authenticate, modelController.getGroupedByBrand)

// GET /api/inventory/catalogs/models/years
router.get('/years', authenticate, modelController.getAvailableYears)

// GET /api/inventory/catalogs/models/search
router.get('/search', authenticate, modelController.search)

// GET /api/inventory/catalogs/models/brand/:brandId
router.get(
  '/brand/:brandId',
  authenticate,
  validateParams(getModelsByBrandSchema),
  modelController.getByBrand
)

// GET /api/inventory/catalogs/models/year/:year
router.get('/year/:year', authenticate, modelController.getByYear)

/**
 * RUTAS POST ESPECÍFICAS (DEBEN IR ANTES DE /:id)
 */

// POST /api/inventory/catalogs/models/bulk
router.post(
  '/bulk',
  authenticate,
  authorize(PERMISSIONS.INVENTORY_CREATE),
  modelController.bulkCreate
)

/**
 * RUTAS GENÉRICAS CON :id
 */

// GET /api/inventory/catalogs/models
router.get(
  '/',
  authenticate,
  authorize(PERMISSIONS.INVENTORY_VIEW),
  validateQuery(getModelsQuerySchema),
  modelController.getAll
)

// POST /api/inventory/catalogs/models
router.post(
  '/',
  authenticate,
  authorize(PERMISSIONS.INVENTORY_CREATE),
  validateBody(createModelSchema),
  modelController.create
)

// GET /api/inventory/catalogs/models/:id
router.get(
  '/:id',
  authenticate,
  authorize(PERMISSIONS.INVENTORY_VIEW),
  validateParams(modelIdSchema),
  modelController.getById
)

// PUT /api/inventory/catalogs/models/:id
router.put(
  '/:id',
  authenticate,
  authorize(PERMISSIONS.INVENTORY_UPDATE),
  validateParams(modelIdSchema),
  validateBody(updateModelSchema),
  modelController.update
)

// PATCH /api/inventory/catalogs/models/:id/toggle
router.patch(
  '/:id/toggle',
  authenticate,
  authorize(PERMISSIONS.INVENTORY_UPDATE),
  validateParams(modelIdSchema),
  modelController.toggleActive
)

// DELETE /api/inventory/catalogs/models/:id/hard (DEBE IR ANTES DE /:id DELETE)
router.delete(
  '/:id/hard',
  authenticate,
  authorize(PERMISSIONS.INVENTORY_DELETE),
  validateParams(modelIdSchema),
  modelController.hardDelete
)

// DELETE /api/inventory/catalogs/models/:id (soft delete)
router.delete(
  '/:id',
  authenticate,
  authorize(PERMISSIONS.INVENTORY_DELETE),
  validateParams(modelIdSchema),
  modelController.delete
)

export default router
