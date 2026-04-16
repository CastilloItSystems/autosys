import { Router } from 'express'
import { PERMISSIONS } from '../../../shared/constants/permissions.js'
import { authorize } from '../../../shared/middleware/authorize.middleware.js'
import { validateBody, validateQuery } from '../../../shared/middleware/validateRequest.middleware.js'
import controller from './tradeIns.controller.js'
import { createDealerTradeInSchema, dealerTradeInFiltersSchema, updateDealerTradeInSchema } from './tradeIns.validation.js'

const router = Router()

router.get('/', authorize(PERMISSIONS.DEALER_VIEW), validateQuery(dealerTradeInFiltersSchema), controller.getAll)
router.post('/', authorize(PERMISSIONS.DEALER_CREATE), validateBody(createDealerTradeInSchema), controller.create)
router.get('/:id', authorize(PERMISSIONS.DEALER_VIEW), controller.getOne)
router.put('/:id', authorize(PERMISSIONS.DEALER_UPDATE), validateBody(updateDealerTradeInSchema), controller.update)
router.delete('/:id', authorize(PERMISSIONS.DEALER_DELETE), controller.delete)

export default router
