// backend/src/features/inventory/stock/bulk/bulk.routes.ts

/**
 * @swagger
 * tags:
 *   - name: Inventory - Stock - Bulk
 *     description: Operaciones masivas de stock (cargas, ajustes, transferencias)
 *
 * /inventory/stock/bulk/import:
 *   post:
 *     summary: Carga masiva de stock desde CSV
 *     tags: [Inventory - Stock - Bulk]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               options:
 *                 type: string
 *                 description: JSON con { updateExisting: boolean }
 *     responses:
 *       201:
 *         description: Carga de stock completada
 *
 * /inventory/stock/bulk/adjust:
 *   post:
 *     summary: Ajuste masivo de stock desde CSV
 *     tags: [Inventory - Stock - Bulk]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Ajuste masivo completado
 *
 * /inventory/stock/bulk/transfer:
 *   post:
 *     summary: Transferencia masiva de stock desde CSV
 *     tags: [Inventory - Stock - Bulk]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Transferencia masiva completada
 *
 * /inventory/stock/bulk/export:
 *   post:
 *     summary: Exportar niveles de stock
 *     tags: [Inventory - Stock - Bulk]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               filters:
 *                 type: object
 *               format:
 *                 type: string
 *                 enum: [csv, json, xlsx]
 *               columns:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Exportación completada
 *
 * /inventory/stock/bulk/operations:
 *   get:
 *     summary: Historial de operaciones masivas de stock
 *     tags: [Inventory - Stock - Bulk]
 *     security:
 *       - BearerAuth: []
 *
 * /inventory/stock/bulk/operations/{operationId}:
 *   get:
 *     summary: Detalle de operación
 *     tags: [Inventory - Stock - Bulk]
 *     security:
 *       - BearerAuth: []
 *   delete:
 *     summary: Eliminar operación
 *     tags: [Inventory - Stock - Bulk]
 *     security:
 *       - BearerAuth: []
 */

import { Router } from 'express'
import multer from 'multer'
import { StockBulkController } from './bulk.controller.js'
import {
  validateBody,
  validateParams,
  validateQuery,
} from '../../../../shared/middleware/validateRequest.middleware.js'
import { authorize } from '../../../../shared/middleware/authorize.middleware.js'
import {
  stockBulkExportSchema,
  operationIdSchema,
  getPaginationSchema,
} from './bulk.validation.js'
import { PERMISSIONS } from '../../../../shared/constants/permissions.js'

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
const controller = new StockBulkController()

// POST /api/inventory/stock/bulk/import
router.post(
  '/import',
  authorize(PERMISSIONS.STOCK_ADJUST),
  upload.single('file'),
  controller.import
)

// POST /api/inventory/stock/bulk/adjust
router.post(
  '/adjust',
  authorize(PERMISSIONS.STOCK_ADJUST),
  upload.single('file'),
  controller.adjust
)

// POST /api/inventory/stock/bulk/transfer
router.post(
  '/transfer',
  authorize(PERMISSIONS.STOCK_TRANSFER),
  upload.single('file'),
  controller.transfer
)

// POST /api/inventory/stock/bulk/export
router.post(
  '/export',
  authorize(PERMISSIONS.STOCK_VIEW),
  validateBody(stockBulkExportSchema),
  controller.export
)

// GET /api/inventory/stock/bulk/operations
router.get(
  '/operations',
  authorize(PERMISSIONS.STOCK_VIEW),
  validateQuery(getPaginationSchema),
  controller.getOperations
)

// GET /api/inventory/stock/bulk/operations/:operationId
router.get(
  '/operations/:operationId',
  authorize(PERMISSIONS.STOCK_VIEW),
  validateParams(operationIdSchema),
  controller.getOperation
)

// DELETE /api/inventory/stock/bulk/operations/:operationId
router.delete(
  '/operations/:operationId',
  authorize(PERMISSIONS.STOCK_ADJUST),
  validateParams(operationIdSchema),
  controller.deleteOperation
)

export default router
