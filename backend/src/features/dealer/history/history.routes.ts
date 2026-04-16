import { Router } from 'express'
import { PERMISSIONS } from '../../../shared/constants/permissions.js'
import { authorize } from '../../../shared/middleware/authorize.middleware.js'
import { validateQuery } from '../../../shared/middleware/validateRequest.middleware.js'
import controller from './history.controller.js'
import { dealerHistoryFiltersSchema } from './history.validation.js'

const router = Router()

router.get('/', authorize(PERMISSIONS.DEALER_VIEW), validateQuery(dealerHistoryFiltersSchema), controller.getAll)

export default router
