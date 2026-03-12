// backend/src/features/inventory/warehouses/warehouses.routes.ts

/**
 * @swagger
 * tags:
 *   - name: Inventory - Warehouses
 *     description: Gestión de almacenes
 *
 * /inventory/warehouses:
 *   get:
 *     summary: Obtener lista de almacenes
 *     tags: [Inventory - Warehouses]
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
 *         name: type
 *         schema:
 *           type: string
 *           enum: [PRINCIPAL, SUCURSAL, TRANSITO]
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [name, code, type, createdAt]
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *     responses:
 *       200:
 *         description: Lista de almacenes obtenida exitosamente
 *       401:
 *         description: No autorizado
 *
 *   post:
 *     summary: Crear nuevo almacén
 *     tags: [Inventory - Warehouses]
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
 *                 example: "ALM-001"
 *               name:
 *                 type: string
 *                 example: "Almacén Principal"
 *               type:
 *                 type: string
 *                 enum: [PRINCIPAL, SUCURSAL, TRANSITO]
 *                 default: PRINCIPAL
 *               address:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *                 default: true
 *     responses:
 *       201:
 *         description: Almacén creado exitosamente
 *       400:
 *         description: Datos inválidos
 *       409:
 *         description: El código del almacén ya existe
 *
 * /inventory/warehouses/{id}:
 *   get:
 *     summary: Obtener almacén por ID
 *     tags: [Inventory - Warehouses]
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
 *         description: Almacén obtenido exitosamente
 *       404:
 *         description: Almacén no encontrado
 *
 *   put:
 *     summary: Actualizar almacén
 *     tags: [Inventory - Warehouses]
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
 *               type:
 *                 type: string
 *                 enum: [PRINCIPAL, SUCURSAL, TRANSITO]
 *               address:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Almacén actualizado exitosamente
 *       404:
 *         description: Almacén no encontrado
 *
 *   delete:
 *     summary: Eliminar almacén
 *     tags: [Inventory - Warehouses]
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
 *         description: Almacén eliminado exitosamente
 *       400:
 *         description: No se puede eliminar un almacén con movimientos
 *       404:
 *         description: Almacén no encontrado
 *
 * /inventory/warehouses/{id}/deactivate:
 *   patch:
 *     summary: Desactivar almacén
 *     tags: [Inventory - Warehouses]
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
 *         description: Almacén desactivado exitosamente
 *       404:
 *         description: Almacén no encontrado
 *
 * /inventory/warehouses/{id}/activate:
 *   patch:
 *     summary: Activar almacén
 *     tags: [Inventory - Warehouses]
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
 *         description: Almacén activado exitosamente
 *       404:
 *         description: Almacén no encontrado
 *
 * /inventory/warehouses/active:
 *   get:
 *     summary: Obtener almacenes activos
 *     tags: [Inventory - Warehouses]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *     responses:
 *       200:
 *         description: Almacenes activos obtenidos exitosamente
 *
 * /inventory/warehouses/search:
 *   get:
 *     summary: Buscar almacenes
 *     tags: [Inventory - Warehouses]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: term
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Búsqueda completada
 *       400:
 *         description: El término de búsqueda es requerido
 */

// backend/src/features/inventory/warehouses/warehouses.routes.ts

import { Router } from 'express'
import controller from './warehouses.controller.js'
import { authorize } from '../../../shared/middleware/authorize.middleware.js'
import { validateRequest } from '../../../shared/middleware/validateRequest.middleware.js'
import {
  createWarehouseSchema,
  updateWarehouseSchema,
  warehouseIdSchema,
} from './warehouses.validation.js'
import { PERMISSIONS } from '../../../shared/constants/permissions.js'

const router = Router()

// Rutas específicas ANTES de /:id para evitar conflictos
router.get(
  '/active',
  authorize(PERMISSIONS.WAREHOUSES_VIEW),
  controller.getActive
)
router.get('/search', authorize(PERMISSIONS.WAREHOUSES_VIEW), controller.search)

// CRUD base
router.get('/', authorize(PERMISSIONS.WAREHOUSES_VIEW), controller.getAll)
router.post(
  '/',
  authorize(PERMISSIONS.WAREHOUSES_CREATE),
  validateRequest(createWarehouseSchema, 'body'),
  controller.create
)

// Rutas con :id
router.get(
  '/:id',
  authorize(PERMISSIONS.WAREHOUSES_VIEW),
  validateRequest(warehouseIdSchema, 'params'),
  controller.getOne
)
router.put(
  '/:id',
  authorize(PERMISSIONS.WAREHOUSES_UPDATE),
  validateRequest(warehouseIdSchema, 'params'),
  validateRequest(updateWarehouseSchema, 'body'),
  controller.update
)
router.delete(
  '/:id',
  authorize(PERMISSIONS.WAREHOUSES_DELETE),
  validateRequest(warehouseIdSchema, 'params'),
  controller.delete
)
router.patch(
  '/:id/deactivate',
  authorize(PERMISSIONS.WAREHOUSES_UPDATE),
  validateRequest(warehouseIdSchema, 'params'),
  controller.deactivate
)
router.patch(
  '/:id/activate',
  authorize(PERMISSIONS.WAREHOUSES_UPDATE),
  validateRequest(warehouseIdSchema, 'params'),
  controller.activate
)

export default router
