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
// backend/src/features/inventory/items/catalogs/models/models.routes.ts

import { Router } from 'express'
import controller from './models.controller.js'
import { authorize } from '../../../../../shared/middleware/authorize.middleware.js'
import { validateRequest } from '../../../../../shared/middleware/validateRequest.middleware.js'
import {
  createModelSchema,
  updateModelSchema,
  modelIdSchema,
  getModelsQuerySchema,
  getModelsByBrandSchema,
} from './models.validation.js'
import { PERMISSIONS } from '../../../../../shared/constants/permissions.js'

const router = Router()

// ---------------------------------------------------------------------------
// Rutas específicas ANTES de /:id
// ---------------------------------------------------------------------------
router.get(
  '/active',
  authorize(PERMISSIONS.INVENTORY_VIEW),
  controller.getActive
)
router.get(
  '/grouped',
  authorize(PERMISSIONS.INVENTORY_VIEW),
  controller.getGroupedByBrand
)
router.get(
  '/years',
  authorize(PERMISSIONS.INVENTORY_VIEW),
  controller.getAvailableYears
)
router.get('/search', authorize(PERMISSIONS.INVENTORY_VIEW), controller.search)

router.get(
  '/brand/:brandId',
  authorize(PERMISSIONS.INVENTORY_VIEW),
  validateRequest(getModelsByBrandSchema, 'params'),
  controller.getByBrand
)

router.get(
  '/year/:year',
  authorize(PERMISSIONS.INVENTORY_VIEW),
  controller.getByYear
)

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
  validateRequest(getModelsQuerySchema, 'query'),
  controller.getAll
)

router.post(
  '/',
  authorize(PERMISSIONS.INVENTORY_CREATE),
  validateRequest(createModelSchema, 'body'),
  controller.create
)

// ---------------------------------------------------------------------------
// Rutas con :id
// ---------------------------------------------------------------------------
router.get(
  '/:id',
  authorize(PERMISSIONS.INVENTORY_VIEW),
  validateRequest(modelIdSchema, 'params'),
  controller.getById
)

router.put(
  '/:id',
  authorize(PERMISSIONS.INVENTORY_UPDATE),
  validateRequest(modelIdSchema, 'params'),
  validateRequest(updateModelSchema, 'body'),
  controller.update
)

router.patch(
  '/:id/toggle',
  authorize(PERMISSIONS.INVENTORY_UPDATE),
  validateRequest(modelIdSchema, 'params'),
  controller.toggleActive
)

router.delete(
  '/:id/hard',
  authorize(PERMISSIONS.INVENTORY_DELETE),
  validateRequest(modelIdSchema, 'params'),
  controller.hardDelete
)

router.delete(
  '/:id',
  authorize(PERMISSIONS.INVENTORY_DELETE),
  validateRequest(modelIdSchema, 'params'),
  controller.delete
)

export default router
