// backend/src/features/inventory/items/catalogs/units/units.routes.ts

/**
 * @swagger
 * tags:
 *   - name: Inventory - Catalogs - Units
 *     description: Gestión de unidades de medida en el inventario
 *
 * /inventory/catalogs/units:
 *   get:
 *     summary: Obtener todas las unidades
 *     tags: [Inventory - Catalogs - Units]
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
 *     responses:
 *       200:
 *         description: Lista de unidades obtenida exitosamente
 *       401:
 *         description: No autorizado
 *       403:
 *         description: No tiene permisos
 *
 *   post:
 *     summary: Crear una nueva unidad
 *     tags: [Inventory - Catalogs - Units]
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
 *                 example: "KG"
 *               name:
 *                 type: string
 *                 example: "Kilogramo"
 *               description:
 *                 type: string
 *               abbreviation:
 *                 type: string
 *               type:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *                 default: true
 *     responses:
 *       201:
 *         description: Unidad creada exitosamente
 *       400:
 *         description: Datos inválidos
 *       409:
 *         description: El código de unidad ya existe
 *
 * /inventory/catalogs/units/{id}:
 *   get:
 *     summary: Obtener una unidad por ID
 *     tags: [Inventory - Catalogs - Units]
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
 *         description: Unidad obtenida exitosamente
 *       404:
 *         description: Unidad no encontrada
 *
 *   put:
 *     summary: Actualizar una unidad
 *     tags: [Inventory - Catalogs - Units]
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
 *               abbreviation:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Unidad actualizada exitosamente
 *       404:
 *         description: Unidad no encontrada
 *
 *   delete:
 *     summary: Eliminar una unidad (soft delete)
 *     tags: [Inventory - Catalogs - Units]
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
 *         description: Unidad eliminada exitosamente
 *       404:
 *         description: Unidad no encontrada
 *
 * /inventory/catalogs/units/active:
 *   get:
 *     summary: Obtener solo unidades activas
 *     tags: [Inventory - Catalogs - Units]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de unidades activas
 *
 * /inventory/catalogs/units/grouped:
 *   get:
 *     summary: Obtener unidades agrupadas por tipo
 *     tags: [Inventory - Catalogs - Units]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Unidades agrupadas por tipo
 *
 * /inventory/catalogs/units/search:
 *   get:
 *     summary: Buscar unidades
 *     tags: [Inventory - Catalogs - Units]
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
 * /inventory/catalogs/units/type/{type}:
 *   get:
 *     summary: Obtener unidades de un tipo específico
 *     tags: [Inventory - Catalogs - Units]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Unidades del tipo obtenidas exitosamente
 *       404:
 *         description: Tipo de unidad no encontrado
 *
 * /inventory/catalogs/units/{id}/toggle:
 *   patch:
 *     summary: Activar/Desactivar una unidad
 *     tags: [Inventory - Catalogs - Units]
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
 *         description: Estado de unidad actualizado
 *       404:
 *         description: Unidad no encontrada
 *
 * /inventory/catalogs/units/bulk:
 *   post:
 *     summary: Crear múltiples unidades
 *     tags: [Inventory - Catalogs - Units]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - units
 *             properties:
 *               units:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - code
 *                     - name
 *                   properties:
 *                     code:
 *                       type: string
 *                     name:
 *                       type: string
 *                     description:
 *                       type: string
 *                     abbreviation:
 *                       type: string
 *                     type:
 *                       type: string
 *     responses:
 *       201:
 *         description: Unidades creadas exitosamente
 *       400:
 *         description: Datos inválidos
 */

import { Router } from 'express'
import unitController from './units.controller'
import { authenticate } from '../../../../../shared/middleware/authenticate.middleware'
import { authorize } from '../../../../../shared/middleware/authorize.middleware'
import {
  validateBody,
  validateParams,
  validateQuery,
} from '../../../../../shared/middleware/validateRequest.middleware'
import {
  createUnitSchema,
  updateUnitSchema,
  unitIdSchema,
  getUnitsQuerySchema,
} from './units.validation'
import { PERMISSIONS } from '../../../../../shared/constants/permissions'

const router = Router()

/**
 * Rutas públicas (o con autenticación básica)
 */

// GET /api/inventory/catalogs/units/active
router.get('/active', authenticate, unitController.getActive)

// GET /api/inventory/catalogs/units/grouped
router.get('/grouped', authenticate, unitController.getGroupedByType)

// GET /api/inventory/catalogs/units/search
router.get('/search', authenticate, unitController.search)

// GET /api/inventory/catalogs/units/type/:type
router.get('/type/:type', authenticate, unitController.getByType)

/**
 * Rutas protegidas - Requieren autenticación y permisos
 */

// GET /api/inventory/catalogs/units
router.get(
  '/',
  authenticate,
  authorize(PERMISSIONS.INVENTORY_VIEW),
  validateQuery(getUnitsQuerySchema),
  unitController.getAll
)

// GET /api/inventory/catalogs/units/:id
router.get(
  '/:id',
  authenticate,
  authorize(PERMISSIONS.INVENTORY_VIEW),
  validateParams(unitIdSchema),
  unitController.getById
)

// POST /api/inventory/catalogs/units
router.post(
  '/',
  authenticate,
  authorize(PERMISSIONS.INVENTORY_CREATE),
  validateBody(createUnitSchema),
  unitController.create
)

// POST /api/inventory/catalogs/units/bulk
router.post(
  '/bulk',
  authenticate,
  authorize(PERMISSIONS.INVENTORY_CREATE),
  unitController.bulkCreate
)

// PUT /api/inventory/catalogs/units/:id
router.put(
  '/:id',
  authenticate,
  authorize(PERMISSIONS.INVENTORY_UPDATE),
  validateParams(unitIdSchema),
  validateBody(updateUnitSchema),
  unitController.update
)

// PATCH /api/inventory/catalogs/units/:id/toggle
router.patch(
  '/:id/toggle',
  authenticate,
  authorize(PERMISSIONS.INVENTORY_UPDATE),
  validateParams(unitIdSchema),
  unitController.toggleActive
)

// DELETE /api/inventory/catalogs/units/:id (soft delete)
router.delete(
  '/:id',
  authenticate,
  authorize(PERMISSIONS.INVENTORY_DELETE),
  validateParams(unitIdSchema),
  unitController.delete
)

// DELETE /api/inventory/catalogs/units/:id/hard (hard delete)
router.delete(
  '/:id/hard',
  authenticate,
  authorize(PERMISSIONS.INVENTORY_DELETE),
  validateParams(unitIdSchema),
  unitController.hardDelete
)

export default router
