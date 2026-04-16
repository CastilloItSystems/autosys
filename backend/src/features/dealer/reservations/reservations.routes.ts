import { Router } from 'express'
import { PERMISSIONS } from '../../../shared/constants/permissions.js'
import { authorize } from '../../../shared/middleware/authorize.middleware.js'
import { validateBody, validateQuery } from '../../../shared/middleware/validateRequest.middleware.js'
import dealerReservationsController from './reservations.controller.js'
import {
  createDealerReservationSchema,
  dealerReservationFiltersSchema,
  updateDealerReservationSchema,
} from './reservations.validation.js'

const router = Router()

router.get(
  '/',
  authorize(PERMISSIONS.DEALER_VIEW),
  validateQuery(dealerReservationFiltersSchema),
  dealerReservationsController.getAll
)

router.post(
  '/',
  authorize(PERMISSIONS.DEALER_CREATE),
  validateBody(createDealerReservationSchema),
  dealerReservationsController.create
)

router.get('/:id', authorize(PERMISSIONS.DEALER_VIEW), dealerReservationsController.getOne)

router.put(
  '/:id',
  authorize(PERMISSIONS.DEALER_UPDATE),
  validateBody(updateDealerReservationSchema),
  dealerReservationsController.update
)

router.delete('/:id', authorize(PERMISSIONS.DEALER_DELETE), dealerReservationsController.delete)

export default router
