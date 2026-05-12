// backend/src/features/sales/creditNotes/creditNotes.routes.ts

import { Router } from 'express'
import creditNotesController from './creditNotes.controller.js'
import { authorize } from '../../../shared/middleware/authorize.middleware.js'
import { validateBody } from '../../../shared/middleware/validateRequest.middleware.js'
import { createCreditNoteSchema, cancelCreditNoteSchema } from './creditNotes.validation.js'
import { PERMISSIONS } from '../../../shared/constants/permissions.js'

const router = Router()

router.get(
  '/',
  authorize(PERMISSIONS.INVOICES_VIEW),
  creditNotesController.getAll
)

router.get(
  '/:id',
  authorize(PERMISSIONS.INVOICES_VIEW),
  creditNotesController.getById
)

router.post(
  '/',
  authorize(PERMISSIONS.INVOICES_CREATE),
  validateBody(createCreditNoteSchema),
  creditNotesController.create
)

router.patch(
  '/:id/cancel',
  authorize(PERMISSIONS.INVOICES_UPDATE),
  validateBody(cancelCreditNoteSchema),
  creditNotesController.cancel
)

export default router
