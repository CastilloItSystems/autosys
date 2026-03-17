// backend/src/features/inventory/items/bulk/bulk.routes.ts

/**
 * @swagger
 * tags:
 *   - name: Inventory - Items - Bulk
 *     description: Operaciones en lote para artículos del inventario
 *
 * /inventory/items/bulk:
 *   post:
 *     summary: Crear artículos en lote
 *     tags: [Inventory - Items - Bulk]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [items]
 *             properties:
 *               items:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/CreateItemRequest'
 *     responses:
 *       200:
 *         description: Importación completada
 *   put:
 *     summary: Actualizar artículos específicos en lote
 *     tags: [Inventory - Items - Bulk]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [itemIds, updates]
 *             properties:
 *               itemIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *               updates:
 *                 type: object
 *     responses:
 *       200:
 *         description: Actualización masiva completada
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
 *             $ref: '#/components/schemas/BulkImportRequest'
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
 *             $ref: '#/components/schemas/BulkExportRequest'
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
 *             $ref: '#/components/schemas/BulkUpdateRequest'
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
import multer from 'multer'
import { BulkController } from './bulk.controller.js'
import itemsController from '../items.controller.js'
import {
  validateBody,
  validateParams,
  validateQuery,
  validateRequest,
} from '../../../../shared/middleware/validateRequest.middleware.js'
import { authenticate } from '../../../../shared/middleware/authenticate.middleware.js'
import { authorize } from '../../../../shared/middleware/authorize.middleware.js'
import {
  bulkExportSchema,
  bulkUpdateSchema,
  bulkDeleteSchema,
  operationIdSchema,
  getPaginationSchema,
} from './bulk.validation.js'
import {
  bulkCreateSchema as itemsBulkCreateSchema,
  bulkUpdateSchema as itemsBulkUpdateSchema,
} from '../items.validation.js'
import { PERMISSIONS } from '../../../../shared/constants/permissions.js'

// Accept CSV and Excel files up to 50 MB in memory (no disk I/O)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/octet-stream',
      'text/plain',
    ]
    cb(
      null,
      allowed.includes(file.mimetype) ||
        file.originalname.endsWith('.csv') ||
        file.originalname.endsWith('.xlsx')
    )
  },
})

const router = Router({ mergeParams: true })
const controller = new BulkController()

/**
 * Operaciones en lote - Importar, Exportar, Actualizar y Eliminar
 */

// POST /api/inventory/items/bulk
router.post(
  '/',
  authenticate,
  authorize(PERMISSIONS.ITEMS_CREATE),
  validateRequest(itemsBulkCreateSchema, 'body'),
  itemsController.bulkCreate
)

// PUT /api/inventory/items/bulk
router.put(
  '/',
  authenticate,
  authorize(PERMISSIONS.ITEMS_UPDATE),
  validateRequest(itemsBulkUpdateSchema, 'body'),
  itemsController.bulkUpdate
)

router.post('/test-import', controller.import)

// POST /api/inventory/items/bulk/import  (multipart/form-data)
router.post(
  '/import',
  authenticate,
  authorize(PERMISSIONS.ITEMS_CREATE),
  upload.single('file'), // req.file = uploaded CSV/XLSX buffer
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
