// backend/src/features/inventory/batches/expiry/expiry.routes.ts

/**
 * @swagger
 * /inventory/batches/expiry/expiring:
 *   get:
 *     summary: Obtener lotes próximos a vencer
 *     tags: [Inventory - Batches]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: daysThreshold
 *         schema:
 *           type: integer
 *           default: 30
 *     responses:
 *       200:
 *         description: Lista de lotes próximos a vencer
 *
 * /inventory/batches/expiry/expired:
 *   get:
 *     summary: Obtener lotes vencidos
 *     tags: [Inventory - Batches]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de lotes vencidos
 *
 * /inventory/batches/expiry/summary:
 *   get:
 *     summary: Resumen de vencimientos
 *     tags: [Inventory - Batches]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: daysThreshold
 *         schema:
 *           type: integer
 *           default: 30
 *     responses:
 *       200:
 *         description: Resumen de lotes por estado de vencimiento
 */

import { Router } from 'express'
import { authenticate } from '../../../../shared/middleware/authenticate.middleware.js'
import ExpiryController from './expiry.controller.js'

const router = Router({ mergeParams: true })

// All routes require authentication
router.use(authenticate)

router.get('/expiring', ExpiryController.getExpiringBatches)
router.get('/expired', ExpiryController.getExpiredBatches)
router.get('/summary', ExpiryController.getSummary)

export default router
