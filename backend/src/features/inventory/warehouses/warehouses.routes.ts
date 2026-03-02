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

import { Router } from 'express'
import { WarehouseController } from './warehouses.controller'
import { authenticate } from '../../../shared/middleware/authenticate.middleware'
import { authorize } from '../../../shared/middleware/authorize.middleware'
import {
  validateBody,
  validateParams,
  validateQuery,
} from '../../../shared/middleware/validateRequest.middleware'
import {
  createWarehouseSchema,
  updateWarehouseSchema,
} from './warehouses.validation'
import { PERMISSIONS } from '../../../shared/constants/permissions'

const router = Router()
const warehouseController = new WarehouseController()

/**
 * ============================================
 * RUTAS DE BÚSQUEDA Y CONSULTA (Sin parámetros)
 * ============================================
 */

// GET /api/inventory/warehouses/active
router.get(
  '/active',
  authenticate,
  authorize(PERMISSIONS.WAREHOUSES_VIEW),
  warehouseController.getActive
)

// GET /api/inventory/warehouses/search
router.get(
  '/search',
  authenticate,
  authorize(PERMISSIONS.WAREHOUSES_VIEW),
  warehouseController.search
)

/**
 * ============================================
 * RUTAS PROTEGIDAS - Requieren permisos
 * ============================================
 */

// GET /api/inventory/warehouses (Listar todos)
router.get(
  '/',
  authenticate,
  authorize(PERMISSIONS.WAREHOUSES_VIEW),
  warehouseController.getAll
)

// POST /api/inventory/warehouses (Crear)
router.post(
  '/',
  authenticate,
  authorize(PERMISSIONS.WAREHOUSES_CREATE),
  validateBody(createWarehouseSchema),
  warehouseController.create
)

/**
 * ============================================
 * RUTAS CON PARÁMETROS (después de query routes)
 * ============================================
 */

// GET /api/inventory/warehouses/:id (Obtener uno)
router.get(
  '/:id',
  authenticate,
  authorize(PERMISSIONS.WAREHOUSES_VIEW),
  warehouseController.getOne
)

// PUT /api/inventory/warehouses/:id (Actualizar)
router.put(
  '/:id',
  authenticate,
  authorize(PERMISSIONS.WAREHOUSES_UPDATE),
  validateBody(updateWarehouseSchema),
  warehouseController.update
)

// DELETE /api/inventory/warehouses/:id (Eliminar)
router.delete(
  '/:id',
  authenticate,
  authorize(PERMISSIONS.WAREHOUSES_DELETE),
  warehouseController.delete
)

// PATCH /api/inventory/warehouses/:id/deactivate (Desactivar)
router.patch(
  '/:id/deactivate',
  authenticate,
  authorize(PERMISSIONS.WAREHOUSES_UPDATE),
  warehouseController.deactivate
)

// PATCH /api/inventory/warehouses/:id/activate (Activar)
router.patch(
  '/:id/activate',
  authenticate,
  authorize(PERMISSIONS.WAREHOUSES_UPDATE),
  warehouseController.activate
)

export default router
