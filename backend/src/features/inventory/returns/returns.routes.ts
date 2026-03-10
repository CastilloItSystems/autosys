// backend/src/features/inventory/returns/returns.routes.ts

import { Router } from 'express'
import { authenticate } from '../../../shared/middleware/auth.middleware'
import { validateRequest } from '../../../shared/middleware/validateRequest.middleware'
import ReturnsController from './returns.controller'
import {
  createReturnSchema,
  updateReturnSchema,
  returnFiltersSchema,
} from './returns.validation'

const router = Router()

router.use(authenticate)

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
