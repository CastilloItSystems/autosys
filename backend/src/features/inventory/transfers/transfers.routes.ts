// backend/src/features/inventory/transfers/transfers.routes.ts

import { Router } from 'express'
import { authorize } from '../../../shared/middleware/authorize.middleware.js'
import { validateRequest } from '../../../shared/middleware/validateRequest.middleware.js'
import { PERMISSIONS } from '../../../shared/constants/permissions.js'
import TransfersController from './transfers.controller.js'
import {
  createTransferSchema,
  updateTransferSchema,
  rejectTransferSchema,
  transferFiltersSchema,
  transferIdSchema,
} from './transfers.validation.js'

// authenticate + extractEmpresa are applied by the parent inventory router
const router = Router()

// ─── State transition routes (before /:id to avoid conflicts) ───────────────

router.patch(
  '/:id/submit',
  authorize(PERMISSIONS.STOCK_TRANSFER),
  validateRequest(transferIdSchema, 'params'),
  TransfersController.submit
)

router.patch(
  '/:id/approve',
  authorize(PERMISSIONS.TRANSFER_APPROVE),
  validateRequest(transferIdSchema, 'params'),
  TransfersController.approve
)

router.patch(
  '/:id/reject',
  authorize(PERMISSIONS.TRANSFER_APPROVE),
  validateRequest(transferIdSchema, 'params'),
  validateRequest(rejectTransferSchema, 'body'),
  TransfersController.reject
)

router.patch(
  '/:id/send',
  authorize(PERMISSIONS.STOCK_TRANSFER),
  validateRequest(transferIdSchema, 'params'),
  TransfersController.send
)

router.patch(
  '/:id/receive',
  authorize(PERMISSIONS.STOCK_TRANSFER),
  validateRequest(transferIdSchema, 'params'),
  TransfersController.receive
)

router.patch(
  '/:id/cancel',
  authorize(PERMISSIONS.STOCK_TRANSFER),
  validateRequest(transferIdSchema, 'params'),
  TransfersController.cancel
)

// ─── CRUD routes ─────────────────────────────────────────────────────────────

router.get(
  '/',
  authorize(PERMISSIONS.STOCK_TRANSFER),
  validateRequest(transferFiltersSchema, 'query'),
  TransfersController.getAll
)

router.post(
  '/',
  authorize(PERMISSIONS.STOCK_TRANSFER),
  validateRequest(createTransferSchema, 'body'),
  TransfersController.create
)

router.get(
  '/:id',
  authorize(PERMISSIONS.STOCK_TRANSFER),
  validateRequest(transferIdSchema, 'params'),
  TransfersController.getOne
)

router.put(
  '/:id',
  authorize(PERMISSIONS.STOCK_TRANSFER),
  validateRequest(transferIdSchema, 'params'),
  validateRequest(updateTransferSchema, 'body'),
  TransfersController.update
)

router.delete(
  '/:id',
  authorize(PERMISSIONS.STOCK_TRANSFER),
  validateRequest(transferIdSchema, 'params'),
  TransfersController.remove
)

export default router
