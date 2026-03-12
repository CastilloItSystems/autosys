// backend/src/features/inventory/returns/returns.routes.ts

import { Router } from 'express'
import { validateRequest } from '../../../shared/middleware/validateRequest.middleware.js'
import ReturnsController from './returns.controller.js'
import {
  createReturnSchema,
  updateReturnSchema,
  returnFiltersSchema,
} from './returns.validation.js'

const router = Router()

router.get(
  '/',
  validateRequest(returnFiltersSchema, 'query'),
  ReturnsController.getAll
)
router.post(
  '/',
  validateRequest(createReturnSchema, 'body'),
  ReturnsController.create
)
router.get('/:id', ReturnsController.getOne)
router.put(
  '/:id',
  validateRequest(updateReturnSchema, 'body'),
  ReturnsController.update
)
router.patch('/:id/submit', ReturnsController.submit)
router.patch('/:id/approve', ReturnsController.approve)
router.patch('/:id/process', ReturnsController.process)
router.patch('/:id/reject', ReturnsController.reject)
router.patch('/:id/cancel', ReturnsController.cancel)

export default router
