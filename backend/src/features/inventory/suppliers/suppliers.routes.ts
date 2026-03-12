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
// backend/src/features/inventory/suppliers/suppliers.routes.ts

import { Router } from 'express'
import controller from './suppliers.controller.js'
import { authorize } from '../../../shared/middleware/authorize.middleware.js'
import { validateRequest } from '../../../shared/middleware/validateRequest.middleware.js'
import {
  createSupplierSchema,
  updateSupplierSchema,
  supplierIdSchema,
  supplierCodeSchema,
} from './suppliers.validation.js'
import { PERMISSIONS } from '../../../shared/constants/permissions.js'

const router = Router()

// Rutas específicas ANTES de /:id
router.get(
  '/active',
  authorize(PERMISSIONS.INVENTORY_VIEW),
  controller.getActive
)
router.get(
  '/code/:code',
  authorize(PERMISSIONS.INVENTORY_VIEW),
  validateRequest(supplierCodeSchema, 'params'),
  controller.getByCode
)

// CRUD base
router.get('/', authorize(PERMISSIONS.INVENTORY_VIEW), controller.getAll)
router.post(
  '/',
  authorize(PERMISSIONS.INVENTORY_CREATE),
  validateRequest(createSupplierSchema, 'body'),
  controller.create
)

// Rutas con :id
router.get(
  '/:id',
  authorize(PERMISSIONS.INVENTORY_VIEW),
  validateRequest(supplierIdSchema, 'params'),
  controller.getOne
)
router.put(
  '/:id',
  authorize(PERMISSIONS.INVENTORY_UPDATE),
  validateRequest(supplierIdSchema, 'params'),
  validateRequest(updateSupplierSchema, 'body'),
  controller.update
)
router.patch(
  '/:id/toggle',
  authorize(PERMISSIONS.INVENTORY_UPDATE),
  validateRequest(supplierIdSchema, 'params'),
  controller.toggleActive
)
router.delete(
  '/:id',
  authorize(PERMISSIONS.INVENTORY_DELETE),
  validateRequest(supplierIdSchema, 'params'),
  controller.delete
)

export default router
