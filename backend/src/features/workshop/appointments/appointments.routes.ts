// backend/src/features/workshop/appointments/appointments.routes.ts
import { Router } from 'express'
import { asyncHandler } from '../../../shared/middleware/asyncHandler.middleware.js'
import { authorize } from '../../../shared/middleware/authorize.middleware.js'
import { validateBody, validateQuery } from '../../../shared/middleware/validateRequest.middleware.js'
import { PERMISSIONS } from '../../../shared/constants/permissions.js'
import {
  createAppointmentSchema, updateAppointmentSchema,
  updateAppointmentStatusSchema, appointmentFiltersSchema,
} from './appointments.validation.js'
import * as ctrl from './appointments.controller.js'

const router = Router()

router.get('/', authorize(PERMISSIONS.WORKSHOP_VIEW), validateQuery(appointmentFiltersSchema), asyncHandler(ctrl.getAll))
router.post('/', authorize(PERMISSIONS.WORKSHOP_CREATE), validateBody(createAppointmentSchema), asyncHandler(ctrl.create))
router.get('/:id', authorize(PERMISSIONS.WORKSHOP_VIEW), asyncHandler(ctrl.getOne))
router.put('/:id', authorize(PERMISSIONS.WORKSHOP_UPDATE), validateBody(updateAppointmentSchema), asyncHandler(ctrl.update))
router.patch('/:id/status', authorize(PERMISSIONS.WORKSHOP_UPDATE), validateBody(updateAppointmentStatusSchema), asyncHandler(ctrl.updateStatus))
router.delete('/:id', authorize(PERMISSIONS.WORKSHOP_DELETE), asyncHandler(ctrl.remove))

export default router
