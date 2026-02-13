// backend/src/features/inventory/items/bulk/bulk.routes.ts

/**
 * @swagger
 * tags:
 *   - name: Inventory - Items - Bulk
 *     description: Operaciones en lote para artículos del inventario
 *
 * /inventory/items/bulk/import:
 *   post:
 *     summary: Importar artículos desde CSV
 *     tags: [Inventory - Items - Bulk]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - items
 *             properties:
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                 example: [{ "sku": "ITEM001", "name": "Product 1", "price": 100 }]
 *               updateIfExists:
 *                 type: boolean
 *                 default: false
 *     responses:
 *       201:
 *         description: Importación completada exitosamente
 *       400:
 *         description: Datos inválidos o archivo vacío
 *       401:
 *         description: No autorizado
 *       403:
 *         description: No tiene permisos
 *
 * /inventory/items/bulk/export:
 *   post:
 *     summary: Exportar artículos
 *     tags: [Inventory - Items - Bulk]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               format:
 *                 type: string
 *                 enum: [csv, json, excel]
 *                 default: csv
 *               filters:
 *                 type: object
 *                 example: { "category": "shoes", "isActive": true }
 *               fields:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["sku", "name", "price", "category"]
 *     responses:
 *       200:
 *         description: Exportación completada exitosamente
 *       400:
 *         description: Parámetros inválidos
 *       404:
 *         description: No hay artículos que cumplan los criterios
 *       401:
 *         description: No autorizado
 *       403:
 *         description: No tiene permisos
 *
 * /inventory/items/bulk/update:
 *   patch:
 *     summary: Actualizar artículos en lote
 *     tags: [Inventory - Items - Bulk]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - filters
 *               - updates
 *             properties:
 *               filters:
 *                 type: object
 *                 example: { "category": "shoes" }
 *               updates:
 *                 type: object
 *                 example: { "price": 150, "isActive": true }
 *     responses:
 *       200:
 *         description: Actualización en lote completada exitosamente
 *       400:
 *         description: Datos inválidos
 *       404:
 *         description: No hay artículos que cumplan los criterios
 *       401:
 *         description: No autorizado
 *       403:
 *         description: No tiene permisos
 *
 * /inventory/items/bulk/delete:
 *   delete:
 *     summary: Eliminar artículos en lote
 *     tags: [Inventory - Items - Bulk]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - filters
 *             properties:
 *               filters:
 *                 type: object
 *                 example: { "isActive": false }
 *               soft:
 *                 type: boolean
 *                 default: true
 *     responses:
 *       200:
 *         description: Eliminación en lote completada exitosamente
 *       400:
 *         description: Datos inválidos
 *       404:
 *         description: No hay artículos que cumplan los criterios
 *       401:
 *         description: No autorizado
 *       403:
 *         description: No tiene permisos
 *
 * /inventory/items/bulk/operations:
 *   get:
 *     summary: Listar operaciones en lote
 *     tags: [Inventory - Items - Bulk]
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
 *     responses:
 *       200:
 *         description: Operaciones obtenidas exitosamente
 *       401:
 *         description: No autorizado
 *       403:
 *         description: No tiene permisos
 *
 * /inventory/items/bulk/operations/{operationId}:
 *   get:
 *     summary: Obtener detalles de operación
 *     tags: [Inventory - Items - Bulk]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: operationId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Operación obtenida exitosamente
 *       404:
 *         description: Operación no encontrada
 *       401:
 *         description: No autorizado
 *       403:
 *         description: No tiene permisos
 *
 *   delete:
 *     summary: Eliminar operación
 *     tags: [Inventory - Items - Bulk]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: operationId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Operación eliminada exitosamente
 *       404:
 *         description: Operación no encontrada
 *       401:
 *         description: No autorizado
 *       403:
 *         description: No tiene permisos
 */

import { Router } from 'express'
import { BulkController } from './bulk.controller'
import {
  validateBody,
  validateParams,
  validateQuery,
} from '../../../../shared/middleware/validateRequest.middleware'
import { authenticate } from '../../../../shared/middleware/authenticate.middleware'
import { authorize } from '../../../../shared/middleware/authorize.middleware'
import {
  bulkImportSchema,
  bulkExportSchema,
  bulkUpdateSchema,
  bulkDeleteSchema,
  operationIdSchema,
  getPaginationSchema,
} from './bulk.validation'
import { PERMISSIONS } from '../../../../shared/constants/permissions'

const router = Router({ mergeParams: true })
const controller = new BulkController()

/**
 * Operaciones en lote - Importar, Exportar, Actualizar y Eliminar
 */

// POST /api/inventory/items/bulk/import
router.post(
  '/import',
  authenticate,
  authorize(PERMISSIONS.ITEMS_CREATE),
  validateBody(bulkImportSchema),
  controller.import
)

// POST /api/inventory/items/bulk/export
router.post(
  '/export',
  authenticate,
  authorize(PERMISSIONS.ITEMS_VIEW),
  validateBody(bulkExportSchema),
  controller.export
)

// PATCH /api/inventory/items/bulk/update
router.patch(
  '/update',
  authenticate,
  authorize(PERMISSIONS.ITEMS_UPDATE),
  validateBody(bulkUpdateSchema),
  controller.update
)

// DELETE /api/inventory/items/bulk/delete
router.delete(
  '/delete',
  authenticate,
  authorize(PERMISSIONS.ITEMS_DELETE),
  validateBody(bulkDeleteSchema),
  controller.delete
)

/**
 * Gestión de operaciones en lote
 */

// GET /api/inventory/items/bulk/operations
router.get(
  '/operations',
  authenticate,
  authorize(PERMISSIONS.ITEMS_VIEW),
  validateQuery(getPaginationSchema),
  controller.getOperations
)

// GET /api/inventory/items/bulk/operations/:operationId
router.get(
  '/operations/:operationId',
  authenticate,
  authorize(PERMISSIONS.ITEMS_VIEW),
  validateParams(operationIdSchema),
  controller.getOperation
)

// DELETE /api/inventory/items/bulk/operations/:operationId
router.delete(
  '/operations/:operationId',
  authenticate,
  authorize(PERMISSIONS.ITEMS_DELETE),
  validateParams(operationIdSchema),
  controller.deleteOperation
)

export default router
