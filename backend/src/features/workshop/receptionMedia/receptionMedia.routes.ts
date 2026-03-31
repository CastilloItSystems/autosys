// backend/src/features/workshop/receptionMedia/receptionMedia.routes.ts
import { Router } from 'express'
import { asyncHandler } from '../../../shared/middleware/asyncHandler.middleware.js'
import { authorize } from '../../../shared/middleware/authorize.middleware.js'
import { validateBody } from '../../../shared/middleware/validateRequest.middleware.js'
import { PERMISSIONS } from '../../../shared/constants/permissions.js'
import { createDamageSchema, updateDamageSchema, createPhotoSchema } from './receptionMedia.validation.js'
import * as ctrl from './receptionMedia.controller.js'

const router = Router({ mergeParams: true }) // Hereda :receptionId del parent

// Daños
router.get('/damages', authorize(PERMISSIONS.WORKSHOP_VIEW), asyncHandler(ctrl.getDamages))
router.post('/damages', authorize(PERMISSIONS.WORKSHOP_CREATE), validateBody(createDamageSchema), asyncHandler(ctrl.addDamage))
router.put('/damages/:damageId', authorize(PERMISSIONS.WORKSHOP_UPDATE), validateBody(updateDamageSchema), asyncHandler(ctrl.editDamage))
router.delete('/damages/:damageId', authorize(PERMISSIONS.WORKSHOP_DELETE), asyncHandler(ctrl.removeDamage))

// Fotos
router.get('/photos', authorize(PERMISSIONS.WORKSHOP_VIEW), asyncHandler(ctrl.getPhotos))
router.post('/photos', authorize(PERMISSIONS.WORKSHOP_CREATE), validateBody(createPhotoSchema), asyncHandler(ctrl.addPhoto))
router.delete('/photos/:photoId', authorize(PERMISSIONS.WORKSHOP_DELETE), asyncHandler(ctrl.removePhoto))

export default router
