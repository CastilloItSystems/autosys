// backend/src/features/inventory/purchaseOrders/purchaseOrders.routes.ts

import { Router } from 'express'
import purchaseOrderController from './purchaseOrders.controller.js'
import { authorize } from '../../../shared/middleware/authorize.middleware.js'
import { validateBody } from '../../../shared/middleware/validateRequest.middleware.js'
import {
  createPurchaseOrderSchema,
  updatePurchaseOrderSchema,
  approvePurchaseOrderSchema,
  addPurchaseOrderItemSchema,
  receiveOrderSchema,
} from './purchaseOrders.validation.js'
import { PERMISSIONS } from '../../../shared/constants/permissions.js'

const router = Router()

// GET /api/inventory/purchase-orders
router.get(
  '/',
  authorize(PERMISSIONS.INVENTORY_VIEW),
  purchaseOrderController.getAll
)

// POST /api/inventory/purchase-orders
router.post(
  '/',
  authorize(PERMISSIONS.INVENTORY_CREATE),
  validateBody(createPurchaseOrderSchema),
  purchaseOrderController.create
)

// PATCH /api/inventory/purchase-orders/:id/approve
router.patch(
  '/:id/approve',
  authorize(PERMISSIONS.INVENTORY_UPDATE),
  validateBody(approvePurchaseOrderSchema),
  purchaseOrderController.approve
)

// PATCH /api/inventory/purchase-orders/:id/cancel
router.patch(
  '/:id/cancel',
  authorize(PERMISSIONS.INVENTORY_UPDATE),
  purchaseOrderController.cancel
)

// POST /api/inventory/purchase-orders/:id/receive
router.post(
  '/:id/receive',
  authorize(PERMISSIONS.INVENTORY_CREATE),
  validateBody(receiveOrderSchema),
  purchaseOrderController.receive
)

// POST /api/inventory/purchase-orders/:id/items
router.post(
  '/:id/items',
  authorize(PERMISSIONS.INVENTORY_CREATE),
  validateBody(addPurchaseOrderItemSchema),
  purchaseOrderController.addItem
)

// GET /api/inventory/purchase-orders/:id/items
router.get(
  '/:id/items',
  authorize(PERMISSIONS.INVENTORY_VIEW),
  purchaseOrderController.getItems
)

// GET /api/inventory/purchase-orders/:id
router.get(
  '/:id',
  authorize(PERMISSIONS.INVENTORY_VIEW),
  purchaseOrderController.getOne
)

// PUT /api/inventory/purchase-orders/:id
router.put(
  '/:id',
  authorize(PERMISSIONS.INVENTORY_UPDATE),
  validateBody(updatePurchaseOrderSchema),
  purchaseOrderController.update
)

// DELETE /api/inventory/purchase-orders/:id
router.delete(
  '/:id',
  authorize(PERMISSIONS.INVENTORY_DELETE),
  purchaseOrderController.delete
)

export default router
