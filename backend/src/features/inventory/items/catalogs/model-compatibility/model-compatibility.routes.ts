// backend/src/features/inventory/items/catalogs/model-compatibility/model-compatibility.routes.ts

/**
 * @swagger
 * tags:
 *   - name: Inventory - Catalogs - Model Compatibility
 *     description: Gestión de compatibilidades entre modelos de partes y vehículos
 *
 * /inventory/catalogs/model-compatibility:
 *   get:
 *     summary: Obtener todas las compatibilidades
 *     tags: [Inventory - Catalogs - Model Compatibility]
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
 *           default: 10
 *       - in: query
 *         name: partModelId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: vehicleModelId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: isVerified
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Lista de compatibilidades obtenida exitosamente
 *       401:
 *         description: No autorizado
 *       403:
 *         description: No tiene permisos
 *
 *   post:
 *     summary: Crear una nueva compatibilidad
 *     tags: [Inventory - Catalogs - Model Compatibility]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - partModelId
 *               - vehicleModelId
 *             properties:
 *               partModelId:
 *                 type: string
 *                 format: uuid
 *                 description: ID del modelo de parte
 *               vehicleModelId:
 *                 type: string
 *                 format: uuid
 *                 description: ID del modelo de vehículo
 *               notes:
 *                 type: string
 *                 description: Notas sobre la compatibilidad
 *               isVerified:
 *                 type: boolean
 *                 default: false
 *     responses:
 *       201:
 *         description: Compatibilidad creada exitosamente
 *       400:
 *         description: Datos inválidos
 *       409:
 *         description: La compatibilidad ya existe
 *
 * /inventory/catalogs/model-compatibility/{id}:
 *   get:
 *     summary: Obtener una compatibilidad por ID
 *     tags: [Inventory - Catalogs - Model Compatibility]
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
 *         description: Compatibilidad obtenida exitosamente
 *       404:
 *         description: Compatibilidad no encontrada
 *
 *   put:
 *     summary: Actualizar una compatibilidad
 *     tags: [Inventory - Catalogs - Model Compatibility]
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
 *               notes:
 *                 type: string
 *               isVerified:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Compatibilidad actualizada exitosamente
 *       404:
 *         description: Compatibilidad no encontrada
 *
 *   delete:
 *     summary: Eliminar una compatibilidad
 *     tags: [Inventory - Catalogs - Model Compatibility]
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
 *         description: Compatibilidad eliminada exitosamente
 *       404:
 *         description: Compatibilidad no encontrada
 *
 * /inventory/catalogs/model-compatibility/part/{partModelId}:
 *   get:
 *     summary: Obtener compatibilidades de un modelo de parte
 *     tags: [Inventory - Catalogs - Model Compatibility]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: partModelId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Compatibilidades obtenidas exitosamente
 *       404:
 *         description: Modelo de parte no encontrado
 *
 * /inventory/catalogs/model-compatibility/vehicle/{vehicleModelId}:
 *   get:
 *     summary: Obtener compatibilidades de un modelo de vehículo
 *     tags: [Inventory - Catalogs - Model Compatibility]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: vehicleModelId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Compatibilidades obtenidas exitosamente
 *       404:
 *         description: Modelo de vehículo no encontrado
 *
 * /inventory/catalogs/model-compatibility/{id}/verify:
 *   patch:
 *     summary: Marcar compatibilidad como verificada
 *     tags: [Inventory - Catalogs - Model Compatibility]
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
 *         description: Compatibilidad marcada como verificada
 *       404:
 *         description: Compatibilidad no encontrada
 *       409:
 *         description: La compatibilidad ya está verificada
 */

import { Router } from 'express'
import { ModelCompatibilityController } from './model-compatibility.controller'
import { authenticate } from '../../../../../shared/middleware/authenticate.middleware'
import { authorize } from '../../../../../shared/middleware/authorize.middleware'
import {
  validateBody,
  validateParams,
  validateQuery,
} from '../../../../../shared/middleware/validateRequest.middleware'
import {
  createCompatibilitySchema,
  updateCompatibilitySchema,
  compatibilityIdSchema,
  modelIdSchema,
  vehicleModelIdSchema,
  getCompatibilityFiltersSchema,
} from './model-compatibility.validation'
import { PERMISSIONS } from '../../../../../shared/constants/permissions'

const router = Router()
const controller = new ModelCompatibilityController()

/**
 * RUTAS GET ESPECÍFICAS (DEBEN IR ANTES DE /:id)
 */

// GET /api/inventory/catalogs/model-compatibility/part/:partModelId
router.get(
  '/part/:partModelId',
  authenticate,
  validateParams(modelIdSchema),
  controller.getByPartModel
)

// GET /api/inventory/catalogs/model-compatibility/vehicle/:vehicleModelId
router.get(
  '/vehicle/:vehicleModelId',
  authenticate,
  validateParams(vehicleModelIdSchema),
  controller.getByVehicleModel
)

/**
 * RUTAS CON :id
 */

// POST /api/inventory/catalogs/model-compatibility
router.post(
  '/',
  authenticate,
  authorize(PERMISSIONS.INVENTORY_CREATE),
  validateBody(createCompatibilitySchema),
  controller.create
)

// GET /api/inventory/catalogs/model-compatibility
router.get(
  '/',
  authenticate,
  authorize(PERMISSIONS.INVENTORY_VIEW),
  validateQuery(getCompatibilityFiltersSchema),
  controller.getAll
)

// GET /api/inventory/catalogs/model-compatibility/:id
router.get(
  '/:id',
  authenticate,
  authorize(PERMISSIONS.INVENTORY_VIEW),
  validateParams(compatibilityIdSchema),
  controller.getById
)

// PUT /api/inventory/catalogs/model-compatibility/:id
router.put(
  '/:id',
  authenticate,
  authorize(PERMISSIONS.INVENTORY_UPDATE),
  validateParams(compatibilityIdSchema),
  validateBody(updateCompatibilitySchema),
  controller.update
)

// PATCH /api/inventory/catalogs/model-compatibility/:id/verify
router.patch(
  '/:id/verify',
  authenticate,
  authorize(PERMISSIONS.INVENTORY_UPDATE),
  validateParams(compatibilityIdSchema),
  controller.verify
)

// DELETE /api/inventory/catalogs/model-compatibility/:id
router.delete(
  '/:id',
  authenticate,
  authorize(PERMISSIONS.INVENTORY_DELETE),
  validateParams(compatibilityIdSchema),
  controller.delete
)

export { router as modelCompatibilityRoutes }
