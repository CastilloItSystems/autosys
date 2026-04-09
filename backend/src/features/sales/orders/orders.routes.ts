// backend/src/features/sales/orders/orders.routes.ts

import { Router } from 'express'
import ordersController from './orders.controller.js'
import { authorize } from '../../../shared/middleware/authorize.middleware.js'
import {
  validateBody,
  validateQuery,
} from '../../../shared/middleware/validateRequest.middleware.js'
import {
  createOrderSchema,
  updateOrderSchema,
  orderFiltersSchema,
} from './orders.validation.js'
import { PERMISSIONS } from '../../../shared/constants/permissions.js'

const router = Router()

// -- CRUD --
router.get(
  '/',
  authorize(PERMISSIONS.ORDERS_VIEW),
  validateQuery(orderFiltersSchema),
  ordersController.getAll
)

router.post(
  '/',
  authorize(PERMISSIONS.ORDERS_CREATE),
  validateBody(createOrderSchema),
  ordersController.create
)

router.get('/:id', authorize(PERMISSIONS.ORDERS_VIEW), ordersController.getOne)

router.put(
  '/:id',
  authorize(PERMISSIONS.ORDERS_UPDATE),
  validateBody(updateOrderSchema),
  ordersController.update
)

// -- Actions --
router.patch(
  '/:id/approve',
  authorize(PERMISSIONS.ORDERS_APPROVE),
  ordersController.approve
)

router.patch(
  '/:id/cancel',
  authorize(PERMISSIONS.ORDERS_UPDATE),
  ordersController.cancel
)

router.delete(
  '/:id',
  authorize(PERMISSIONS.ORDERS_DELETE),
  ordersController.delete
)

export default router
