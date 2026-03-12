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
// backend/src/features/inventory/items/catalogs/model-compatibility/model-compatibility.routes.ts

import { Router } from 'express'
import controller from './model-compatibility.controller.js'
import { authorize } from '../../../../../shared/middleware/authorize.middleware.js'
import { validateRequest } from '../../../../../shared/middleware/validateRequest.middleware.js'
import {
  createCompatibilitySchema,
  updateCompatibilitySchema,
  compatibilityIdSchema,
  modelIdSchema,
  vehicleModelIdSchema,
  getCompatibilityFiltersSchema,
} from './model-compatibility.validation.js'
import { PERMISSIONS } from '../../../../../shared/constants/permissions.js'

const router = Router()

// ---------------------------------------------------------------------------
// Rutas específicas ANTES de /:id
// ---------------------------------------------------------------------------
router.get(
  '/part/:partModelId',
  authorize(PERMISSIONS.INVENTORY_VIEW),
  validateRequest(modelIdSchema, 'params'),
  controller.getByPartModel
)

router.get(
  '/vehicle/:vehicleModelId',
  authorize(PERMISSIONS.INVENTORY_VIEW),
  validateRequest(vehicleModelIdSchema, 'params'),
  controller.getByVehicleModel
)

// ---------------------------------------------------------------------------
// CRUD base
// ---------------------------------------------------------------------------
router.get(
  '/',
  authorize(PERMISSIONS.INVENTORY_VIEW),
  validateRequest(getCompatibilityFiltersSchema, 'query'),
  controller.getAll
)

router.post(
  '/',
  authorize(PERMISSIONS.INVENTORY_CREATE),
  validateRequest(createCompatibilitySchema, 'body'),
  controller.create
)

// ---------------------------------------------------------------------------
// Rutas con :id
// ---------------------------------------------------------------------------
router.get(
  '/:id',
  authorize(PERMISSIONS.INVENTORY_VIEW),
  validateRequest(compatibilityIdSchema, 'params'),
  controller.getById
)

router.put(
  '/:id',
  authorize(PERMISSIONS.INVENTORY_UPDATE),
  validateRequest(compatibilityIdSchema, 'params'),
  validateRequest(updateCompatibilitySchema, 'body'),
  controller.update
)

router.patch(
  '/:id/verify',
  authorize(PERMISSIONS.INVENTORY_UPDATE),
  validateRequest(compatibilityIdSchema, 'params'),
  controller.verify
)

router.delete(
  '/:id',
  authorize(PERMISSIONS.INVENTORY_DELETE),
  validateRequest(compatibilityIdSchema, 'params'),
  controller.delete
)

export default router
