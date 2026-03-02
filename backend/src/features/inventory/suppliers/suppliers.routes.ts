// backend/src/features/inventory/suppliers/suppliers.routes.ts

/**
 * @swagger
 * tags:
 *   - name: Inventory - Suppliers
 *     description: Gestión de proveedores
 *
 * /inventory/suppliers:
 *   get:
 *     summary: Obtener lista de proveedores
 *     tags: [Inventory - Suppliers]
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
 *         name: code
 *         schema:
 *           type: string
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Lista de proveedores obtenida
 *
 *   post:
 *     summary: Crear nuevo proveedor
 *     tags: [Inventory - Suppliers]
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
 *               name:
 *                 type: string
 *               contactName:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               address:
 *                 type: string
 *               taxId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Proveedor creado exitosamente
 *
 * /inventory/suppliers/{id}:
 *   get:
 *     summary: Obtener proveedor por ID
 *     tags: [Inventory - Suppliers]
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
 *         description: Proveedor obtenido
 *       404:
 *         description: Proveedor no encontrado
 *
 *   put:
 *     summary: Actualizar proveedor
 *     tags: [Inventory - Suppliers]
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
 *               contactName:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               address:
 *                 type: string
 *               taxId:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Proveedor actualizado
 *
 *   delete:
 *     summary: Eliminar proveedor
 *     tags: [Inventory - Suppliers]
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
 *         description: Proveedor eliminado
 *
 * /inventory/suppliers/code/{code}:
 *   get:
 *     summary: Obtener proveedor por código
 *     tags: [Inventory - Suppliers]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Proveedor obtenido
 *
 * /inventory/suppliers/active:
 *   get:
 *     summary: Obtener proveedores activos
 *     tags: [Inventory - Suppliers]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Proveedores activos obtenidos
 *
 * /inventory/suppliers/{id}/toggle:
 *   patch:
 *     summary: Cambiar estado activo/inactivo del proveedor
 *     tags: [Inventory - Suppliers]
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
 *         description: Estado actualizado
 */

import { Router } from 'express'
import { SupplierController } from './suppliers.controller'
import { authenticate } from '../../../shared/middleware/authenticate.middleware'
import { authorize } from '../../../shared/middleware/authorize.middleware'
import { validateBody } from '../../../shared/middleware/validateRequest.middleware'
import {
  createSupplierSchema,
  updateSupplierSchema,
} from './suppliers.validation'
import { PERMISSIONS } from '../../../shared/constants/permissions'

const router = Router()
const controller = new SupplierController()

/**
 * ============================================
 * RUTAS DE CONSULTA ESPECIALIZADAS
 * ============================================
 */

// GET /api/inventory/suppliers/active
router.get(
  '/active',
  authenticate,
  authorize(PERMISSIONS.INVENTORY_VIEW),
  controller.getActive
)

/**
 * ============================================
 * RUTAS DE FILTROS POR REFERENCIA
 * ============================================
 */

// GET /api/inventory/suppliers/code/:code
router.get(
  '/code/:code',
  authenticate,
  authorize(PERMISSIONS.INVENTORY_VIEW),
  controller.getByCode
)

/**
 * ============================================
 * RUTAS GENERALES - CRUD
 * ============================================
 */

// GET /api/inventory/suppliers (Listar todos)
router.get(
  '/',
  authenticate,
  authorize(PERMISSIONS.INVENTORY_VIEW),
  controller.getAll
)

// POST /api/inventory/suppliers (Crear)
router.post(
  '/',
  authenticate,
  authorize(PERMISSIONS.INVENTORY_CREATE),
  validateBody(createSupplierSchema),
  controller.create
)

// GET /api/inventory/suppliers/:id (Obtener uno)
router.get(
  '/:id',
  authenticate,
  authorize(PERMISSIONS.INVENTORY_VIEW),
  controller.getOne
)

// PUT /api/inventory/suppliers/:id (Actualizar)
router.put(
  '/:id',
  authenticate,
  authorize(PERMISSIONS.INVENTORY_UPDATE),
  validateBody(updateSupplierSchema),
  controller.update
)

// PATCH /api/inventory/suppliers/:id/toggle (Cambiar estado)
router.patch(
  '/:id/toggle',
  authenticate,
  authorize(PERMISSIONS.INVENTORY_UPDATE),
  controller.toggleActive
)

// DELETE /api/inventory/suppliers/:id (Eliminar)
router.delete(
  '/:id',
  authenticate,
  authorize(PERMISSIONS.INVENTORY_DELETE),
  controller.delete
)

export default router
