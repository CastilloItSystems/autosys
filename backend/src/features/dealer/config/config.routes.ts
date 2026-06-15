import { Router } from 'express'
import { PERMISSIONS } from '../../../shared/constants/permissions.js'
import { authorize } from '../../../shared/middleware/authorize.middleware.js'
import { validateBody } from '../../../shared/middleware/validateRequest.middleware.js'
import controller from './config.controller.js'
import { upsertDealerPolicySchema } from './config.validation.js'

const router = Router()

router.get('/', authorize(PERMISSIONS.DEALER_VIEW), controller.get)
router.put('/', authorize(PERMISSIONS.DEALER_UPDATE), validateBody(upsertDealerPolicySchema), controller.upsert)

export default router
