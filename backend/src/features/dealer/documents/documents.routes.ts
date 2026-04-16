import { Router } from 'express'
import { PERMISSIONS } from '../../../shared/constants/permissions.js'
import { authorize } from '../../../shared/middleware/authorize.middleware.js'
import { validateBody, validateQuery } from '../../../shared/middleware/validateRequest.middleware.js'
import controller from './documents.controller.js'
import { createDealerDocumentSchema, dealerDocumentFiltersSchema, updateDealerDocumentSchema } from './documents.validation.js'

const router = Router()

router.get('/', authorize(PERMISSIONS.DEALER_VIEW), validateQuery(dealerDocumentFiltersSchema), controller.getAll)
router.post('/', authorize(PERMISSIONS.DEALER_CREATE), validateBody(createDealerDocumentSchema), controller.create)
router.get('/:id', authorize(PERMISSIONS.DEALER_VIEW), controller.getOne)
router.put('/:id', authorize(PERMISSIONS.DEALER_UPDATE), validateBody(updateDealerDocumentSchema), controller.update)
router.delete('/:id', authorize(PERMISSIONS.DEALER_DELETE), controller.delete)

export default router
