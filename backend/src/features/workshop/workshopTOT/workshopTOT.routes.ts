// backend/src/features/workshop/workshopTOT/workshopTOT.routes.ts
import { Router } from 'express'
import { asyncHandler } from '../../../shared/middleware/asyncHandler.middleware.js'
import { authorize } from '../../../shared/middleware/authorize.middleware.js'
import { validateBody, validateQuery } from '../../../shared/middleware/validateRequest.middleware.js'
import { PERMISSIONS } from '../../../shared/constants/permissions.js'
import { FileUploadHelper } from '../../../shared/utils/fileUpload.js'
import {
  createTOTSchema, updateTOTSchema, updateTOTStatusSchema,
  addTOTDocumentSchema, totFiltersSchema,
} from './workshopTOT.validation.js'
import * as ctrl from './workshopTOT.controller.js'

const router = Router()

router.get('/',    authorize(PERMISSIONS.WORKSHOP_VIEW),   validateQuery(totFiltersSchema),    asyncHandler(ctrl.getAll))
router.post('/',   authorize(PERMISSIONS.WORKSHOP_CREATE), validateBody(createTOTSchema),      asyncHandler(ctrl.create))
router.get('/:id', authorize(PERMISSIONS.WORKSHOP_VIEW),                                       asyncHandler(ctrl.getOne))
router.put('/:id', authorize(PERMISSIONS.WORKSHOP_UPDATE), validateBody(updateTOTSchema),      asyncHandler(ctrl.update))
router.patch('/:id/status', authorize(PERMISSIONS.WORKSHOP_UPDATE), validateBody(updateTOTStatusSchema), asyncHandler(ctrl.updateStatus))
router.post('/:id/photos', authorize(PERMISSIONS.WORKSHOP_UPDATE), FileUploadHelper.createMemoryUploader('file'), asyncHandler(ctrl.uploadPhoto))
router.post('/:id/documents', authorize(PERMISSIONS.WORKSHOP_UPDATE), validateBody(addTOTDocumentSchema), asyncHandler(ctrl.addDoc))
router.delete('/:id/documents/:docId', authorize(PERMISSIONS.WORKSHOP_UPDATE),                asyncHandler(ctrl.removeDoc))
router.delete('/:id', authorize(PERMISSIONS.WORKSHOP_DELETE),                                 asyncHandler(ctrl.remove))

export default router
