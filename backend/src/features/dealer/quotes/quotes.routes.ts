import { Router } from 'express'
import { PERMISSIONS } from '../../../shared/constants/permissions.js'
import { authorize } from '../../../shared/middleware/authorize.middleware.js'
import { validateBody, validateQuery } from '../../../shared/middleware/validateRequest.middleware.js'
import dealerQuotesController from './quotes.controller.js'
import { createDealerQuoteSchema, dealerQuoteFiltersSchema, updateDealerQuoteSchema } from './quotes.validation.js'

const router = Router()

router.get('/', authorize(PERMISSIONS.DEALER_VIEW), validateQuery(dealerQuoteFiltersSchema), dealerQuotesController.getAll)

router.post('/', authorize(PERMISSIONS.DEALER_CREATE), validateBody(createDealerQuoteSchema), dealerQuotesController.create)

router.get('/:id', authorize(PERMISSIONS.DEALER_VIEW), dealerQuotesController.getOne)

router.put('/:id', authorize(PERMISSIONS.DEALER_UPDATE), validateBody(updateDealerQuoteSchema), dealerQuotesController.update)

router.delete('/:id', authorize(PERMISSIONS.DEALER_DELETE), dealerQuotesController.delete)

export default router
