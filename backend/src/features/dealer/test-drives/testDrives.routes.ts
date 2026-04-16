import { Router } from 'express'
import { PERMISSIONS } from '../../../shared/constants/permissions.js'
import { authorize } from '../../../shared/middleware/authorize.middleware.js'
import { validateBody, validateQuery } from '../../../shared/middleware/validateRequest.middleware.js'
import dealerTestDrivesController from './testDrives.controller.js'
import {
  createDealerTestDriveSchema,
  dealerTestDriveFiltersSchema,
  updateDealerTestDriveSchema,
} from './testDrives.validation.js'

const router = Router()

router.get(
  '/',
  authorize(PERMISSIONS.DEALER_VIEW),
  validateQuery(dealerTestDriveFiltersSchema),
  dealerTestDrivesController.getAll
)

router.post(
  '/',
  authorize(PERMISSIONS.DEALER_CREATE),
  validateBody(createDealerTestDriveSchema),
  dealerTestDrivesController.create
)

router.get('/:id', authorize(PERMISSIONS.DEALER_VIEW), dealerTestDrivesController.getOne)

router.put(
  '/:id',
  authorize(PERMISSIONS.DEALER_UPDATE),
  validateBody(updateDealerTestDriveSchema),
  dealerTestDrivesController.update
)

router.delete('/:id', authorize(PERMISSIONS.DEALER_DELETE), dealerTestDrivesController.delete)

export default router
