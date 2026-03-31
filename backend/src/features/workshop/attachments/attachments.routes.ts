// backend/src/features/workshop/attachments/attachments.routes.ts
import { Router } from 'express'
import { asyncHandler } from '../../../shared/middleware/asyncHandler.middleware.js'
import { authorize } from '../../../shared/middleware/authorize.middleware.js'
import { validateBody, validateQuery } from '../../../shared/middleware/validateRequest.middleware.js'
import { PERMISSIONS } from '../../../shared/constants/permissions.js'
import { createAttachmentSchema, listAttachmentsSchema } from './attachments.validation.js'
import * as ctrl from './attachments.controller.js'

const router = Router()

router.get('/', authorize(PERMISSIONS.WORKSHOP_VIEW), validateQuery(listAttachmentsSchema), asyncHandler(ctrl.getAll))
router.post('/', authorize(PERMISSIONS.WORKSHOP_CREATE), validateBody(createAttachmentSchema), asyncHandler(ctrl.create))
router.delete('/:id', authorize(PERMISSIONS.WORKSHOP_DELETE), asyncHandler(ctrl.remove))

export default router
