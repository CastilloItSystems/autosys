import { Router } from 'express'
import { PERMISSIONS } from '../../../shared/constants/permissions.js'
import { authorize } from '../../../shared/middleware/authorize.middleware.js'
import { validateBody, validateQuery } from '../../../shared/middleware/validateRequest.middleware.js'
import dealerUnitsController from './units.controller.js'
import { createDealerUnitSchema, dealerUnitFiltersSchema, updateDealerUnitSchema } from './units.validation.js'

const router = Router()

router.get(
  '/',
  authorize(PERMISSIONS.DEALER_VIEW),
  validateQuery(dealerUnitFiltersSchema),
  dealerUnitsController.getAll
)

router.post(
  '/',
  authorize(PERMISSIONS.DEALER_CREATE),
  validateBody(createDealerUnitSchema),
  dealerUnitsController.create
)

router.get(
  '/:id',
  authorize(PERMISSIONS.DEALER_VIEW),
  dealerUnitsController.getOne
)

router.put(
  '/:id',
  authorize(PERMISSIONS.DEALER_UPDATE),
  validateBody(updateDealerUnitSchema),
  dealerUnitsController.update
)

router.delete(
  '/:id',
  authorize(PERMISSIONS.DEALER_DELETE),
  dealerUnitsController.delete
)

export default router

